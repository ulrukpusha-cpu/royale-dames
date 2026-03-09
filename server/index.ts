/**
 * Serveur WebSocket multijoueur - Royale Dames
 * Format compatible: red/white, Board Royale Dames 10x10
 */
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { createHmac } from 'crypto';
import { Server, Socket } from 'socket.io';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { startTelegramBot, broadcastMatchSearch, registerRoomCode } from './telegramBot';

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || process.env.VITE_WS_CLIENT_URL || 'https://royale-dames.vercel.app';
const PORT = process.env.PORT || 3001;

// CORS pour les requêtes HTTP (Wave, healthcheck)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CLIENT_URL);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parser JSON + garder le corps brut pour le webhook Wave (vérification signature)
app.use(express.json({
  verify: (req: express.Request, _res, buf: Buffer) => {
    if (req.originalUrl === '/api/wave/callback') {
      (req as any).rawBody = buf;
    }
  },
}));

const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, credentials: true }
});

// Client Supabase côté serveur (service role pour mettre à jour les soldes)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseAdmin: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
} else {
  console.warn('Supabase (service role) non configuré : WAVE callback ne pourra pas créditer les soldes.');
}

// Healthcheck simple
app.get('/', (_req, res) => {
  res.send('Royale Dames server OK');
});

// ====== WAVE CHECKOUT BACKEND (Fiat XOF) ======
const WAVE_API_KEY = process.env.WAVE_API_KEY;
const WAVE_API_BASE = process.env.WAVE_API_BASE || 'https://api.wave.com/v1';
const WAVE_CALLBACK_URL = process.env.WAVE_CALLBACK_URL;

app.post('/api/wave/checkout', async (req, res) => {
  try {
    const { amount, phone, external_id } = req.body || {};
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Numéro de téléphone requis' });
    }
    if (!WAVE_API_KEY) {
      console.warn('WAVE_API_KEY manquant - le backend Wave n’est pas configuré');
      return res.json({
        redirectUrl: null,
        simulated: true,
      });
    }

    const externalId = typeof external_id === 'string' && external_id.trim() ? external_id.trim() : null;
    if (!externalId) {
      return res.status(400).json({ error: 'Identifiant utilisateur (external_id) requis pour le callback.' });
    }

    const amountCents = Math.round(numericAmount * 100);
    const payload: any = {
      amount: {
        currency: 'XOF',
        value: amountCents,
      },
      customer: {
        phone_number: phone,
      },
      description: 'Depot Royale Dames',
      client_reference_id: externalId,
    };
    if (WAVE_CALLBACK_URL) {
      payload.callback_url = WAVE_CALLBACK_URL;
    }

    const resp = await fetch(`${WAVE_API_BASE}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WAVE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error('Erreur Wave API', data);
      return res.status(500).json({ error: 'Wave API error', details: data });
    }

    const redirectUrl =
      (data as any).checkout_url ||
      (data as any).redirect_url ||
      (data as any).payment_url ||
      null;

    return res.json({ redirectUrl });
  } catch (e) {
    console.error('Erreur backend Wave', e);
    return res.status(500).json({ error: 'Erreur serveur Wave' });
  }
});

// ====== WAVE CALLBACK (webhook) – crédit du solde après paiement confirmé ======
const WAVE_WEBHOOK_SECRET = process.env.WAVE_WEBHOOK_SECRET;

function verifyWaveSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!WAVE_WEBHOOK_SECRET || !signatureHeader) return false;
  try {
    const expected = createHmac('sha256', WAVE_WEBHOOK_SECRET).update(rawBody).digest('hex');
    const received = (signatureHeader.replace(/^sha256=/, '') || signatureHeader).trim();
    return expected === received || createHmac('sha256', WAVE_WEBHOOK_SECRET).update(rawBody.toString('utf8')).digest('hex') === received;
  } catch {
    return false;
  }
}

app.post('/api/wave/callback', async (req, res) => {
  const rawBody = (req as any).rawBody as Buffer | undefined;
  const signature = req.headers['x-wave-signature'] || req.headers['x-webhook-signature'] || req.headers['wave-signature'];

  if (!rawBody || !rawBody.length) {
    return res.status(400).send('Body manquant');
  }

  if (WAVE_WEBHOOK_SECRET && !verifyWaveSignature(rawBody, typeof signature === 'string' ? signature : signature?.[0])) {
    console.error('Wave callback: signature invalide');
    return res.status(401).send('Signature invalide');
  }

  let body: any;
  try {
    body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).send('JSON invalide');
  }

  const eventType = body.event_type || body.type || body.status;
  const status = (body.status || body.event_type || '').toLowerCase();
  const paid = status === 'completed' || status === 'success' || status === 'paid' || eventType === 'checkout.session.completed' || body.success === true;

  if (!paid) {
    return res.status(200).send('OK');
  }

  const externalId = body.client_reference_id || body.external_id || body.customer_reference;
  const amountCents = Number(body.amount?.value ?? body.amount_cents ?? body.amount ?? 0);
  const paymentId = body.id || body.payment_id || body.checkout_id || body.session_id;

  if (!externalId || !amountCents || amountCents <= 0) {
    console.error('Wave callback: external_id ou montant manquant', { externalId, amountCents });
    return res.status(400).json({ error: 'client_reference_id ou montant manquant' });
  }

  if (!supabaseAdmin) {
    console.error('Wave callback: Supabase non configuré');
    return res.status(503).json({ error: 'Service indisponible' });
  }

  const { data: existingTx } = await supabaseAdmin
    .from('transactions')
    .select('id')
    .contains('metadata', { wave_payment_id: String(paymentId) })
    .limit(1)
    .maybeSingle();

  if (existingTx) {
    return res.status(200).send('OK');
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, fiat_balance_cents')
    .eq('external_id', externalId)
    .single();

  if (profileError || !profile) {
    const { data: inserted } = await supabaseAdmin
      .from('profiles')
      .insert({
        external_id: externalId,
        provider: 'telegram',
        fiat_balance_cents: amountCents,
        fiat_currency: 'XOF',
      })
      .select('id')
      .single();
    if (inserted?.id) {
      await supabaseAdmin.from('transactions').insert({
        profile_id: inserted.id,
        type: 'fiat_deposit',
        amount_fiat_cents: amountCents,
        metadata: { wave_payment_id: paymentId, source: 'wave_callback' },
      });
      return res.status(200).send('OK');
    }
    console.error('Wave callback: profil introuvable et création échouée', externalId, profileError);
    return res.status(400).json({ error: 'Profil introuvable' });
  }

  const newBalance = Number(profile.fiat_balance_cents || 0) + amountCents;

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ fiat_balance_cents: newBalance })
    .eq('id', profile.id);

  if (updateError) {
    console.error('Wave callback: erreur mise à jour solde', updateError);
    return res.status(500).json({ error: 'Erreur mise à jour solde' });
  }

  await supabaseAdmin.from('transactions').insert({
    profile_id: profile.id,
    type: 'fiat_deposit',
    amount_fiat_cents: amountCents,
    metadata: { wave_payment_id: paymentId, source: 'wave_callback' },
  });

  return res.status(200).send('OK');
});

// IA Master : suggestion de coup via Kimi 2.5 (Moonshot AI)
const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

app.post('/api/ai/suggest', async (req, res) => {
  const moves = req.body?.moves;
  if (!Array.isArray(moves) || moves.length === 0) {
    return res.status(400).json({ error: 'moves array required' });
  }
  if (!KIMI_API_KEY) {
    const idx = Math.floor(Math.random() * moves.length);
    return res.json({ move: moves[idx], source: 'fallback' });
  }
  const lines = moves.map((m: any, i: number) =>
    `${i}: (${m.from?.r},${m.from?.c}) → (${m.to?.r},${m.to?.c})${(m.captures?.length) ? ` [${m.captures.length} prise(s)]` : ''}`
  ).join('\n');
  const prompt = `Tu es un expert aux dames internationales (10x10). Voici les coups légaux pour les Blancs, un par ligne. Réponds par UN SEUL nombre : l'index (0-based) du meilleur coup.\n\n${lines}`;
  try {
    const kimiRes = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'kimi-k2.5',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.2,
      }),
    });
    if (!kimiRes.ok) {
      const idx = Math.floor(Math.random() * moves.length);
      return res.json({ move: moves[idx], source: 'fallback' });
    }
    const data = await kimiRes.json();
    const text = (data.choices?.[0]?.message?.content ?? '').trim();
    const num = parseInt(text.replace(/\D/g, '').slice(0, 3), 10);
    const idx = Number.isFinite(num) && num >= 0 && num < moves.length ? num : Math.floor(Math.random() * moves.length);
    return res.json({ move: moves[idx], source: 'kimi' });
  } catch (err) {
    const idx = Math.floor(Math.random() * moves.length);
    return res.json({ move: moves[idx], source: 'fallback' });
  }
});

// ---------- Parrainage (Inviter amis) ----------
const REFERRAL_DAMES_REWARD = 50;
const refCodeToUserId = new Map<string, string>();
const userIdToRefCode = new Map<string, string>();
interface ReferralRow { referrerId: string; invitedId: string; invitedUsername: string; credited: boolean }
const referrals: ReferralRow[] = [];

function genRefCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

app.get('/api/referral/code', (req, res) => {
  const userId = (req.query.userId as string)?.trim();
  if (!userId) return res.status(400).json({ error: 'userId required' });
  let code = userIdToRefCode.get(userId);
  if (!code) {
    code = genRefCode();
    while (refCodeToUserId.has(code)) code = genRefCode();
    refCodeToUserId.set(code, userId);
    userIdToRefCode.set(userId, code);
  }
  return res.json({ code });
});

app.post('/api/referral/use', (req, res) => {
  const { refCode, invitedUserId, invitedUsername } = req.body || {};
  const code = String(refCode || '').trim().toUpperCase();
  const invId = String(invitedUserId || '').trim();
  const invUser = String(invitedUsername || '').trim() || invId;
  if (!code || !invId) return res.status(400).json({ error: 'refCode and invitedUserId required' });
  const referrerId = refCodeToUserId.get(code);
  if (!referrerId) return res.status(404).json({ error: 'Code invalide' });
  if (referrerId === invId) return res.status(400).json({ error: 'Tu ne peux pas utiliser ton propre lien' });
  if (referrals.some(r => r.referrerId === referrerId && r.invitedId === invId)) return res.json({ success: true });
  referrals.push({ referrerId, invitedId: invId, invitedUsername: invUser, credited: false });
  return res.json({ success: true });
});

app.get('/api/referral/pending', (req, res) => {
  const userId = (req.query.userId as string)?.trim();
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const list = referrals.filter(r => r.referrerId === userId && !r.credited);
  return res.json({ referrals: list.map(r => ({ invitedId: r.invitedId, invitedUsername: r.invitedUsername })) });
});

app.post('/api/referral/credit', (req, res) => {
  const userId = (req.query.userId as string)?.trim() || (req.body?.userId as string)?.trim();
  if (!userId) return res.status(400).json({ error: 'userId required' });
  referrals.forEach(r => { if (r.referrerId === userId && !r.credited) r.credited = true; });
  return res.json({ success: true });
});

// Types (format Royale Dames: red/white)
interface Player {
  id: string;
  telegramId?: number;
  username: string;
  socketId: string;
  rating: number;
  photoUrl?: string;
}

interface GameRoom {
  id: string;
  players: [Player, Player];
  board: any;
  currentTurn: 'red' | 'white';
  status: 'waiting' | 'active' | 'finished';
  betAmount?: number;
  betCurrency?: 'TON' | 'STARS';
  startTime: number;
  lastMoveTime: number;
  moveHistory: any[];
  chat: { userId: string; username: string; message: string; timestamp: number }[];
  timer: { red: number; white: number };
}

const connectedPlayers = new Map<string, Player>();
const gameRooms = new Map<string, GameRoom>();
const playerToRoom = new Map<string, string>();

// Matchmaking queue: betKey -> Player[]
const matchmakingQueue = new Map<string, Player[]>();

// Salles par code (invitation ami): code -> { host, guest?, betAmount?, betCurrency? }
interface WaitingRoom {
  code: string;
  host: Player;
  betAmount?: number;
  betCurrency?: 'TON' | 'STARS';
  guest?: Player;
}
const waitingRoomsByCode = new Map<string, WaitingRoom>();

// Middleware auth (Telegram initData)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Auth required'));
  try {
    const userData = verifyTelegramInitData(token);
    (socket as any).data.user = userData;
    next();
  } catch {
    next(new Error('Auth invalid'));
  }
});

function verifyTelegramInitData(initData: string): { id: string; telegramId?: number; username: string; photoUrl?: string } {
  if (initData.startsWith('demo_')) {
    if (process.env.NODE_ENV === 'production') throw new Error('Demo auth disabled in production');
    const id = initData.replace('demo_', '');
    return { id: initData, username: id || 'Joueur' };
  }
  const params = new URLSearchParams(initData);
  const userStr = params.get('user');
  if (!userStr) throw new Error('No user');

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (BOT_TOKEN) {
    const hash = params.get('hash');
    if (!hash) throw new Error('No hash');
    params.delete('hash');
    const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');
    const secretKey = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (computedHash !== hash) throw new Error('Invalid hash');
  }

  const user = JSON.parse(userStr);
  return {
    id: `tg_${user.id}`,
    telegramId: user.id,
    username: user.username || user.first_name || 'Joueur',
    photoUrl: user.photo_url
  };
}

function initBoard() {
  const board = Array(10).fill(null).map(() => Array(10).fill(null));
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 4) board[r][c] = { color: 'white', isKing: false };
        else if (r > 5) board[r][c] = { color: 'red', isKing: false };
      }
    }
  }
  return board;
}

function validateMove(board: any, move: any, player: 'red' | 'white'): boolean {
  const { from, to, captures } = move;
  if (!from || !to || from.r == null || to.r == null) return false;
  if (from.r < 0 || from.r > 9 || from.c < 0 || from.c > 9) return false;
  if (to.r < 0 || to.r > 9 || to.c < 0 || to.c > 9) return false;
  if (!board[from.r] || !board[to.r]) return false;
  const piece = board[from.r][from.c];
  if (!piece || piece.color !== player) return false;
  if (board[to.r][to.c]) return false;
  if ((from.r + from.c) % 2 !== 1 || (to.r + to.c) % 2 !== 1) return false;
  const dr = Math.abs(to.r - from.r);
  const dc = Math.abs(to.c - from.c);
  if (dr !== dc) return false;
  const numCaptures = captures?.length ?? 0;
  // Simple move (no capture): non-king can only move 1 step
  if (numCaptures === 0) {
    if (!piece.isKing && dr > 1) return false;
    if (dr === 1) return true;
  }
  // Capture(s): non-king must jump exactly 2 squares per capture (multi-capture allowed)
  if (numCaptures >= 1) {
    if (!piece.isKing && dr !== 2 * numCaptures) return false;
    return true;
  }
  if (piece.isKing) return true;
  return false;
}

function applyMove(board: any, move: any): any {
  const newBoard = board.map((row: any[]) => [...row]);
  const piece = newBoard[move.from.r][move.from.c];
  newBoard[move.to.r][move.to.c] = piece;
  newBoard[move.from.r][move.from.c] = null;
  if (move.captures) {
    for (const cap of move.captures) {
      newBoard[cap.r][cap.c] = null;
    }
  }
  if (piece && piece.color === 'red' && move.to.r === 0) newBoard[move.to.r][move.to.c] = { ...piece, isKing: true };
  if (piece && piece.color === 'white' && move.to.r === 9) newBoard[move.to.r][move.to.c] = { ...piece, isKing: true };
  return newBoard;
}

function checkGameEnd(board: any): { result: string; winner?: 'red' | 'white' } | null {
  let red = 0, white = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const p = board[r][c];
      if (p?.color === 'red') red++;
      else if (p?.color === 'white') white++;
    }
  }
  if (red === 0) return { result: 'checkmate', winner: 'white' };
  if (white === 0) return { result: 'checkmate', winner: 'red' };
  return null;
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

io.on('connection', (socket: Socket) => {
  const user = (socket as any).data.user;
  const player: Player = {
    id: user.id,
    telegramId: user.telegramId,
    username: user.username,
    socketId: socket.id,
    rating: 1200,
    photoUrl: (user as any).photoUrl
  };
  connectedPlayers.set(user.id, player);

  socket.emit('friends:online', Array.from(connectedPlayers.values()).filter(p => p.id !== user.id));
  socket.broadcast.emit('friend:status-changed', { userId: user.id, isOnline: true });

  // Matchmaking : recherche d'adversaire aléatoire
  socket.on('game:search', (data: { betAmount?: number; betCurrency?: 'TON' | 'STARS' }) => {
    const betKey = `${data.betAmount ?? 0}_${data.betCurrency ?? 'USD'}`;
    let queue = matchmakingQueue.get(betKey);
    if (!queue) {
      queue = [];
      matchmakingQueue.set(betKey, queue);
    }
    if (queue.some(p => p.id === player.id)) return;
    queue.push(player);

    if (queue.length >= 2) {
      const p1 = queue.shift()!;
      const p2 = queue.shift()!;
      if (matchmakingQueue.get(betKey)?.length === 0) matchmakingQueue.delete(betKey);
      const players: [Player, Player] = Math.random() > 0.5 ? [p1, p2] : [p2, p1];
      const gameId = generateId();
      const room: GameRoom = {
        id: gameId,
        players,
        board: initBoard(),
        currentTurn: 'red',
        status: 'active',
        betAmount: data.betAmount,
        betCurrency: data.betCurrency,
        startTime: Date.now(),
        lastMoveTime: Date.now(),
        moveHistory: [],
        chat: [],
        timer: { red: 600000, white: 600000 }
      };
      gameRooms.set(gameId, room);
      const s1 = io.sockets.sockets.get(p1.socketId);
      const s2 = io.sockets.sockets.get(p2.socketId);
      if (s1) s1.join(gameId);
      if (s2) s2.join(gameId);
      playerToRoom.set(p1.id, gameId);
      playerToRoom.set(p2.id, gameId);
      const myColor1 = players[0].id === p1.id ? 'red' : 'white';
      const myColor2 = players[0].id === p2.id ? 'red' : 'white';
      io.to(p1.socketId).emit('game:started', { gameId, players: room.players, board: room.board, yourColor: myColor1, betAmount: room.betAmount, betCurrency: room.betCurrency, timer: room.timer });
      io.to(p2.socketId).emit('game:started', { gameId, players: room.players, board: room.board, yourColor: myColor2, betAmount: room.betAmount, betCurrency: room.betCurrency, timer: room.timer });
    } else {
      broadcastMatchSearch(data.betAmount ?? 0, data.betCurrency ?? 'USD', player.username);
    }
  });

  socket.on('game:cancel-search', (data: { betAmount?: number; betCurrency?: 'TON' | 'STARS' }) => {
    const betKey = `${data.betAmount ?? 0}_${data.betCurrency ?? 'USD'}`;
    const queue = matchmakingQueue.get(betKey);
    if (queue) {
      const idx = queue.findIndex(p => p.id === player.id);
      if (idx >= 0) queue.splice(idx, 1);
      if (queue.length === 0) matchmakingQueue.delete(betKey);
    }
  });

  // Salle par code : créer une salle d'invitation
  socket.on('game:create-room', (data: { betAmount?: number; betCurrency?: 'TON' | 'STARS' }) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const wr: WaitingRoom = { code, host: player, betAmount: data.betAmount, betCurrency: data.betCurrency };
    waitingRoomsByCode.set(code, wr);
    socket.emit('game:room-created', { code });
  });

  socket.on('game:join-room', (data: { code: string }) => {
    const code = (data.code || '').toUpperCase().trim();
    const wr = waitingRoomsByCode.get(code);
    if (!wr) {
      socket.emit('error', { message: 'Code de salle invalide ou expiré' });
      return;
    }
    if (wr.host.id === player.id) {
      socket.emit('error', { message: 'Tu es déjà l\'hôte de cette salle' });
      return;
    }
    if (wr.guest) {
      socket.emit('error', { message: 'La salle est déjà complète' });
      return;
    }
    wr.guest = player;
    const players: [Player, Player] = Math.random() > 0.5 ? [wr.host, player] : [player, wr.host];
    const gameId = generateId();
    const room: GameRoom = {
      id: gameId,
      players,
      board: initBoard(),
      currentTurn: 'red',
      status: 'active',
      betAmount: wr.betAmount,
      betCurrency: wr.betCurrency,
      startTime: Date.now(),
      lastMoveTime: Date.now(),
      moveHistory: [],
      chat: [],
      timer: { red: 600000, white: 600000 }
    };
    gameRooms.set(gameId, room);
    waitingRoomsByCode.delete(code);
    const shost = io.sockets.sockets.get(wr.host.socketId);
    if (shost) shost.join(gameId);
    socket.join(gameId);
    playerToRoom.set(wr.host.id, gameId);
    playerToRoom.set(player.id, gameId);
    const myColorHost = players[0].id === wr.host.id ? 'red' : 'white';
    const myColorGuest = players[0].id === player.id ? 'red' : 'white';
    io.to(wr.host.socketId).emit('game:started', { gameId, players: room.players, board: room.board, yourColor: myColorHost, betAmount: room.betAmount, betCurrency: room.betCurrency, timer: room.timer });
    io.to(player.socketId).emit('game:started', { gameId, players: room.players, board: room.board, yourColor: myColorGuest, betAmount: room.betAmount, betCurrency: room.betCurrency, timer: room.timer });
  });

  socket.on('game:invite', (data: { friendId: string; betAmount?: number; betCurrency?: 'TON' | 'STARS' }) => {
    const friend = connectedPlayers.get(data.friendId);
    if (!friend) {
      socket.emit('error', { message: 'Ami non connecté' });
      return;
    }
    const invitation = {
      id: generateId(),
      from: player,
      to: friend,
      betAmount: data.betAmount,
      betCurrency: data.betCurrency,
      timestamp: Date.now()
    };
    io.to(friend.socketId).emit('game:invitation', invitation);
    socket.emit('game:invitation-sent', { invitationId: invitation.id });
  });

  socket.on('game:accept', (data: { invitationId: string; fromUserId: string; betAmount?: number; betCurrency?: 'TON' | 'STARS' }) => {
    const opponent = connectedPlayers.get(data.fromUserId);
    if (!opponent) {
      socket.emit('error', { message: 'Adversaire indisponible' });
      return;
    }

    const players: [Player, Player] = Math.random() > 0.5 ? [player, opponent] : [opponent, player];
    const gameId = generateId();
    const room: GameRoom = {
      id: gameId,
      players,
      board: initBoard(),
      currentTurn: 'red',
      status: 'active',
      betAmount: data.betAmount,
      betCurrency: data.betCurrency,
      startTime: Date.now(),
      lastMoveTime: Date.now(),
      moveHistory: [],
      chat: [],
      timer: { red: 600000, white: 600000 }
    };

    gameRooms.set(gameId, room);
    socket.join(gameId);
    io.sockets.sockets.get(opponent.socketId)?.join(gameId);
    playerToRoom.set(player.id, gameId);
    playerToRoom.set(opponent.id, gameId);

    const myColor = players[0].id === player.id ? 'red' : 'white';
    const opponentColor = players[0].id === opponent.id ? 'red' : 'white';

    io.to(player.socketId).emit('game:started', {
      gameId,
      players: room.players,
      board: room.board,
      yourColor: myColor,
      betAmount: room.betAmount,
      betCurrency: room.betCurrency,
      timer: room.timer
    });
    io.to(opponent.socketId).emit('game:started', {
      gameId,
      players: room.players,
      board: room.board,
      yourColor: opponentColor,
      betAmount: room.betAmount,
      betCurrency: room.betCurrency,
      timer: room.timer
    });
  });

  socket.on('game:decline', (data: { invitationId: string; fromUserId: string }) => {
    const opponent = connectedPlayers.get(data.fromUserId);
    if (opponent) io.to(opponent.socketId).emit('game:invitation-declined', { by: player.username });
  });

  // Spectateur : demande les parties en cours où un ami joue
  socket.on('game:spectatable-request', (data: { friendIds?: string[]; friendUsernames?: string[] }) => {
    const ids = new Set((data.friendIds || []).map((x: string) => x.toLowerCase()));
    const usernames = new Set((data.friendUsernames || []).map((x: string) => x.toLowerCase().replace(/^@/, '')));
    const games: any[] = [];
    for (const [gameId, room] of gameRooms) {
      if (room.status !== 'active') continue;
      const p0 = room.players[0];
      const p1 = room.players[1];
      const match0 = ids.has(p0.id.toLowerCase()) || usernames.has((p0.username || '').toLowerCase());
      const match1 = ids.has(p1.id.toLowerCase()) || usernames.has((p1.username || '').toLowerCase());
      if (match0 || match1) {
        games.push({
          gameId,
          players: room.players,
          board: room.board,
          currentTurn: room.currentTurn,
          betAmount: room.betAmount,
          betCurrency: room.betCurrency,
          startTime: room.startTime,
        });
      }
    }
    socket.emit('spectatable:games', { games });
  });

  // Spectateur : rejoindre une partie en cours
  socket.on('game:spectate', (data: { gameId: string }) => {
    const room = gameRooms.get(data.gameId);
    if (!room || room.status !== 'active') {
      socket.emit('error', { message: 'Partie introuvable ou terminée' });
      return;
    }
    if (room.players[0].id === player.id || room.players[1].id === player.id) {
      socket.emit('error', { message: 'Tu es déjà dans cette partie' });
      return;
    }
    socket.join(room.id);
    socket.emit('game:spectator-state', {
      gameId: room.id,
      players: room.players,
      board: room.board,
      currentTurn: room.currentTurn,
      yourColor: 'red',
      betAmount: room.betAmount,
      betCurrency: room.betCurrency,
      timer: room.timer,
    });
  });

  socket.on('game:move', (data: { gameId: string; move: any }) => {
    const room = gameRooms.get(data.gameId);
    if (!room) {
      socket.emit('error', { message: 'Partie introuvable' });
      return;
    }
    if (!room.players.some(p => p.id === user.id)) {
      socket.emit('error', { message: 'Vous n\'êtes pas un joueur de cette partie' });
      return;
    }
    const isRed = room.players[0].id === user.id;
    const playerColor: 'red' | 'white' = isRed ? 'red' : 'white';
    if (room.currentTurn !== playerColor) {
      socket.emit('error', { message: 'Ce n\'est pas votre tour' });
      return;
    }
    if (!validateMove(room.board, data.move, playerColor)) {
      socket.emit('error', { message: 'Coup invalide' });
      return;
    }

    room.board = applyMove(room.board, data.move);
    room.moveHistory.push({ move: data.move, player: playerColor, timestamp: Date.now() });
    room.currentTurn = playerColor === 'red' ? 'white' : 'red';
    room.lastMoveTime = Date.now();

    const result = checkGameEnd(room.board);
    if (result) {
      room.status = 'finished';
      io.to(room.id).emit('game:ended', {
        result: result.result,
        winner: result.winner,
        finalBoard: room.board,
        moveHistory: room.moveHistory,
        winnings: room.betAmount && result.winner ? { amount: room.betAmount * 1.9, currency: room.betCurrency } : null
      });
      io.in(room.id).socketsLeave(room.id);
      gameRooms.delete(room.id);
      playerToRoom.delete(room.players[0].id);
      playerToRoom.delete(room.players[1].id);
    } else {
      io.to(data.gameId).emit('game:move-made', {
        move: data.move,
        board: room.board,
        currentTurn: room.currentTurn,
        moveHistory: room.moveHistory
      });
    }
  });

  socket.on('game:offer-draw', (data: { gameId: string }) => {
    const room = gameRooms.get(data.gameId);
    if (!room || !room.players.some(p => p.id === user.id)) return;
    const opp = room.players.find(p => p.id !== user.id);
    const oppSocket = opp ? connectedPlayers.get(opp.id)?.socketId : null;
    if (oppSocket) io.to(oppSocket).emit('game:draw-offered', { by: player.username });
  });

  socket.on('game:accept-draw', (data: { gameId: string }) => {
    const room = gameRooms.get(data.gameId);
    if (!room || !room.players.some(p => p.id === user.id)) return;
    room.status = 'finished';
    io.to(room.id).emit('game:ended', { result: 'draw', finalBoard: room.board, moveHistory: room.moveHistory });
    io.in(room.id).socketsLeave(room.id);
    gameRooms.delete(room.id);
    playerToRoom.delete(room.players[0].id);
    playerToRoom.delete(room.players[1].id);
  });

  socket.on('game:resign', (data: { gameId: string }) => {
    const room = gameRooms.get(data.gameId);
    if (!room || !room.players.some(p => p.id === user.id)) return;
    const winner = room.players[0].id === user.id ? 'white' : 'red';
    room.status = 'finished';
    io.to(room.id).emit('game:ended', { result: 'resignation', winner, finalBoard: room.board, moveHistory: room.moveHistory });
    io.in(room.id).socketsLeave(room.id);
    gameRooms.delete(room.id);
    playerToRoom.delete(room.players[0].id);
    playerToRoom.delete(room.players[1].id);
  });

  socket.on('chat:message', (data: { gameId: string; message: string }) => {
    const room = gameRooms.get(data.gameId);
    if (!room) return;
    const sanitized = String(data.message || '').slice(0, 500).replace(/[<>]/g, '');
    if (!sanitized.trim()) return;
    const msg = { userId: user.id, username: player.username, message: sanitized, timestamp: Date.now() };
    room.chat.push(msg);
    io.to(data.gameId).emit('chat:new-message', msg);
  });

  socket.on('chat:emoji', (data: { gameId: string; emoji: string }) => {
    io.to(data.gameId).emit('chat:emoji', { userId: user.id, username: player.username, emoji: data.emoji, timestamp: Date.now() });
  });

  socket.on('disconnect', () => {
    connectedPlayers.delete(user.id);
    io.emit('friend:status-changed', { userId: user.id, isOnline: false });
    for (const [k, q] of matchmakingQueue) {
      const idx = q.findIndex(p => p.id === user.id);
      if (idx >= 0) { q.splice(idx, 1); if (q.length === 0) matchmakingQueue.delete(k); break; }
    }
    for (const [code, wr] of waitingRoomsByCode) {
      if (wr.host.id === user.id) { waitingRoomsByCode.delete(code); break; }
    }
    const gameId = playerToRoom.get(user.id);
    if (gameId) {
      const room = gameRooms.get(gameId);
      if (room) {
        const winner = room.players[0].id === user.id ? 'white' : 'red';
        room.status = 'finished';
        io.to(gameId).emit('game:ended', { result: 'disconnect', winner, finalBoard: room.board });
        io.in(gameId).socketsLeave(gameId);
        gameRooms.delete(gameId);
        playerToRoom.delete(room.players[0].id);
        playerToRoom.delete(room.players[1].id);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🎮 Serveur Royale Dames WebSocket sur le port ${PORT}`);
  startTelegramBot();
  registerRoomCode((code: string) => {
    const wr: WaitingRoom = { code, host: { id: `bot_${code}`, username: 'Bot Invite', socketId: '', rating: 1200 }, betAmount: 0 };
    waitingRoomsByCode.set(code, wr);
  });
});
