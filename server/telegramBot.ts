/**
 * Bot Telegram intégré - Royale Dames
 * Stocke les chat IDs, diffuse les alertes de parties en ligne
 * Plateforme jeux HTML5 : sendGame + answerCallbackQuery(url) — https://core.telegram.org/bots/games
 */
import TelegramBot from 'node-telegram-bot-api';
import { createHmac, timingSafeEqual } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_APP_URL = (process.env.WEB_APP_URL || 'https://royale-dames.vercel.app').replace(/\/$/, '');
/** Short name du jeu créé avec @BotFather /newgame (optionnel). */
const TELEGRAM_GAME_SHORT_NAME = (process.env.TELEGRAM_GAME_SHORT_NAME || '').trim();
const GAME_LAUNCH_TTL_MS = 10 * 60 * 1000;
const CHAT_IDS_FILE = join(process.cwd(), 'chat-ids.json');

let bot: TelegramBot | null = null;
let botUsername: string = '';
let registerRoomCodeFn: ((code: string) => void) | null = null;

export function registerRoomCode(fn: (code: string) => void) {
  registerRoomCodeFn = fn;
}

/** URL signée pour ouvrir le jeu après clic sur « Play » (message Jeu). */
export function buildGameOpenUrl(telegramUserId: number): string {
  if (!BOT_TOKEN) return WEB_APP_URL;
  const ts = Date.now();
  const sig = createHmac('sha256', BOT_TOKEN).update(`${telegramUserId}:${ts}`).digest('hex');
  const q = new URLSearchParams({
    tg_launch: String(telegramUserId),
    tg_ts: String(ts),
    tg_sig: sig,
  });
  return `${WEB_APP_URL}?${q.toString()}`;
}

export function verifyGameLaunchToken(userId: number, ts: number, sig: string): boolean {
  if (!BOT_TOKEN || !Number.isFinite(userId) || !Number.isFinite(ts)) return false;
  const now = Date.now();
  if (now - ts > GAME_LAUNCH_TTL_MS || ts > now + 120_000) return false;
  const expected = createHmac('sha256', BOT_TOKEN).update(`${userId}:${ts}`).digest('hex');
  try {
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function submitTelegramGameScore(telegramUserId: number, score: number, force = false): Promise<boolean> {
  if (!bot) return false;
  try {
    await bot.setGameScore(telegramUserId, score, { chat_id: telegramUserId, force });
    return true;
  } catch (e) {
    console.warn('setGameScore Telegram:', e);
    return false;
  }
}

function loadChatIds(): number[] {
  try {
    if (existsSync(CHAT_IDS_FILE)) {
      const data = JSON.parse(readFileSync(CHAT_IDS_FILE, 'utf-8'));
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.warn('Erreur lecture chat-ids:', e);
  }
  return [];
}

function saveChatId(chatId: number) {
  const ids = loadChatIds();
  if (!ids.includes(chatId)) {
    ids.push(chatId);
    try {
      writeFileSync(CHAT_IDS_FILE, JSON.stringify(ids, null, 2));
    } catch (e) {
      console.warn('Erreur sauvegarde chat-ids:', e);
    }
  }
}

function removeChatId(chatId: number) {
  const ids = loadChatIds().filter(id => id !== chatId);
  try {
    writeFileSync(CHAT_IDS_FILE, JSON.stringify(ids, null, 2));
  } catch (e) {
    console.warn('Erreur suppression chat-id:', e);
  }
}

/** Lance le bot et retourne true si OK */
export function startTelegramBot(): boolean {
  if (!BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN manquant - alertes bot désactivées');
    return false;
  }
  bot = new TelegramBot(BOT_TOKEN, { polling: true });

  bot.getMe().then((me) => {
    botUsername = me.username || '';
    if (botUsername) console.log('Bot Telegram @' + botUsername + ' (liens t.me actives)');
  }).catch(() => {});

  bot.onText(/\/start(?:\s+(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    saveChatId(chatId);
    const payload = match?.[1]?.trim() || '';

    const webAppUrlForPayload = (): string => {
      if (!payload) return WEB_APP_URL;
      if (payload.startsWith('ref_')) return `${WEB_APP_URL}?ref=${encodeURIComponent(payload.slice(4))}`;
      if (payload.startsWith('room_')) return `${WEB_APP_URL}?room=${encodeURIComponent(payload.slice(5))}`;
      return `${WEB_APP_URL}?ref=${encodeURIComponent(payload)}`;
    };

    // Liens profonds (room / ref) : Web App avec URL dédiée (inchangé).
    if (payload) {
      bot!.sendMessage(
        chatId,
        'Bienvenue dans ROYALE DAMES 🎯\n\nTu peux ouvrir la web app ou générer un lien d’invitation pour jouer avec un ami.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎲 Ouvrir Royale Dames', web_app: { url: webAppUrlForPayload() } }],
              [{ text: '🤝 Inviter un ami', callback_data: 'invite_friend' }],
            ],
          },
        }
      );
      return;
    }

    // Sans payload : message « Jeu » BotFather si configuré (1re ligne = lancer le jeu).
    if (TELEGRAM_GAME_SHORT_NAME) {
      bot!.sendGame(chatId, TELEGRAM_GAME_SHORT_NAME, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Jouer', callback_game: {} }],
            [{ text: '🤝 Inviter un ami', callback_data: 'invite_friend' }],
          ],
        },
      }).catch((err) => console.error('sendGame:', err));
      return;
    }

    bot!.sendMessage(
      chatId,
      'Bienvenue dans ROYALE DAMES 🎯\n\nTu peux ouvrir la web app ou générer un lien d’invitation pour jouer avec un ami.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎲 Ouvrir Royale Dames', web_app: { url: WEB_APP_URL } }],
            [{ text: '🤝 Inviter un ami', callback_data: 'invite_friend' }],
          ],
        },
      }
    );
  });

  bot.on('callback_query', async (query) => {
    // Clic « Play » sur un message Jeu (HTML5) : ouvrir l’URL du jeu pour cet utilisateur.
    if (query.game_short_name) {
      const uid = query.from.id;
      const url = buildGameOpenUrl(uid);
      await bot!.answerCallbackQuery(query.id, { url }).catch((e) => console.warn('answerCallbackQuery game:', e));
      return;
    }

    if (!query.message) return;
    const chatId = query.message.chat.id;
    if (query.data === 'invite_friend') {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      registerRoomCodeFn?.(code);
      const inviteUrl = botUsername ? `https://t.me/${botUsername}?start=room_${code}` : `${WEB_APP_URL}/?room=${code}`;
      await bot!.answerCallbackQuery(query.id).catch(() => {});
      bot!.sendMessage(
        chatId,
        `Lien pour inviter un ami (ouvre le bot puis le jeu) :\n\n${inviteUrl}\n\nEnvoie ce lien. Quand il clique, le jeu s'ouvre dans Telegram, il est connecte.`
      );
    }
  });

  console.log('Bot Telegram lancé (alertes parties en ligne activées)');
  return true;
}

/**
 * Diffuse un message à tous les utilisateurs ayant démarré le bot
 * Quand quelqu'un clique "En ligne" avec une mise
 */
export function broadcastMatchSearch(
  betAmount: number,
  betCurrency: string,
  username?: string
): void {
  if (!bot) return;
  const ids = loadChatIds();
  if (ids.length === 0) return;

  const mise = betAmount > 0
    ? (betCurrency === 'USD' ? `${betAmount} $` : `${betAmount} ${betCurrency}`)
    : 'sans mise';

  const message = `🎮 *Partie en ligne disponible !*\n\n` +
    `Un joueur cherche un adversaire • Mise : *${mise}*\n\n` +
    `Rejoins vite pour ne pas le rater ! 👇`;

  const params = new URLSearchParams({
    mode: 'online',
    bet: String(betAmount || 0),
    currency: betCurrency || 'USD',
  });

  const joinUrl = `${WEB_APP_URL}?${params.toString()}`;

  const keyboard = {
    inline_keyboard: [
      [{ text: '🎲 Rejoindre la partie', web_app: { url: joinUrl } }]
    ]
  };

  ids.forEach((chatId) => {
    bot!.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }).catch((err) => {
      if (err?.response?.body?.description?.includes('blocked') ||
          err?.response?.body?.description?.includes('deactivated')) {
        removeChatId(chatId);
      }
    });
  });
}
