/**
 * Serveur WebSocket multijoueur - Royale Dames
 * Format compatible: red/white, Board Royale Dames 10x10
 */
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || process.env.VITE_WS_CLIENT_URL || 'https://royale-dames.vercel.app';
const PORT = process.env.PORT || 3001;

const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, credentials: true }
});

// Types (format Royale Dames: red/white)
interface Player {
  id: string;
  telegramId?: number;
  username: string;
  socketId: string;
  rating: number;
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

function verifyTelegramInitData(initData: string): { id: string; telegramId?: number; username: string } {
  if (initData.startsWith('demo_')) {
    const id = initData.replace('demo_', '');
    return { id: initData, username: id || 'Joueur' };
  }
  const params = new URLSearchParams(initData);
  const userStr = params.get('user');
  if (!userStr) throw new Error('No user');
  const user = JSON.parse(userStr);
  return {
    id: `tg_${user.id}`,
    telegramId: user.id,
    username: user.username || user.first_name || 'Joueur'
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
  if (!from || !to || !board[from.r] || !board[to.r]) return false;
  const piece = board[from.r][from.c];
  if (!piece || piece.color !== player) return false;
  const target = board[to.r][to.c];
  if (target) return false;
  if ((from.r + from.c) % 2 !== 1 || (to.r + to.c) % 2 !== 1) return false;
  return true;
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
    rating: 1200
  };
  connectedPlayers.set(user.id, player);

  socket.emit('friends:online', Array.from(connectedPlayers.values()).filter(p => p.id !== user.id));

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
    const theirColor = players[0].id === opponent.id ? 'red' : 'white';

    io.to(gameId).emit('game:started', {
      gameId,
      players: room.players,
      board: room.board,
      yourColor: myColor,
      betAmount: room.betAmount,
      betCurrency: room.betCurrency,
      timer: room.timer
    });
  });

  socket.on('game:decline', (data: { invitationId: string; fromUserId: string }) => {
    const opponent = connectedPlayers.get(data.fromUserId);
    if (opponent) io.to(opponent.socketId).emit('game:invitation-declined', { by: player.username });
  });

  socket.on('game:move', (data: { gameId: string; move: any }) => {
    const room = gameRooms.get(data.gameId);
    if (!room) {
      socket.emit('error', { message: 'Partie introuvable' });
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
      gameRooms.delete(room.id);
      playerToRoom.delete(room.players[0].id);
      playerToRoom.delete(room.players[1].id);
      io.to(room.id).emit('game:ended', {
        result: result.result,
        winner: result.winner,
        finalBoard: room.board,
        moveHistory: room.moveHistory,
        winnings: room.betAmount && result.winner ? { amount: room.betAmount * 1.9, currency: room.betCurrency } : null
      });
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
    if (!room) return;
    const opp = room.players.find(p => p.id !== user.id);
    if (opp) io.to(connectedPlayers.get(opp.id)?.socketId!).emit('game:draw-offered', { by: player.username });
  });

  socket.on('game:accept-draw', (data: { gameId: string }) => {
    const room = gameRooms.get(data.gameId);
    if (!room) return;
    room.status = 'finished';
    gameRooms.delete(room.id);
    playerToRoom.delete(room.players[0].id);
    playerToRoom.delete(room.players[1].id);
    io.to(room.id).emit('game:ended', { result: 'draw', finalBoard: room.board, moveHistory: room.moveHistory });
  });

  socket.on('game:resign', (data: { gameId: string }) => {
    const room = gameRooms.get(data.gameId);
    if (!room) return;
    const winner = room.players[0].id === user.id ? 'white' : 'red';
    room.status = 'finished';
    gameRooms.delete(room.id);
    playerToRoom.delete(room.players[0].id);
    playerToRoom.delete(room.players[1].id);
    io.to(room.id).emit('game:ended', { result: 'resignation', winner, finalBoard: room.board, moveHistory: room.moveHistory });
  });

  socket.on('chat:message', (data: { gameId: string; message: string }) => {
    const room = gameRooms.get(data.gameId);
    if (!room) return;
    const msg = { userId: user.id, username: player.username, message: data.message, timestamp: Date.now() };
    room.chat.push(msg);
    io.to(data.gameId).emit('chat:new-message', msg);
  });

  socket.on('chat:emoji', (data: { gameId: string; emoji: string }) => {
    io.to(data.gameId).emit('chat:emoji', { userId: user.id, username: player.username, emoji: data.emoji, timestamp: Date.now() });
  });

  socket.on('disconnect', () => {
    connectedPlayers.delete(user.id);
    const gameId = playerToRoom.get(user.id);
    if (gameId) {
      const room = gameRooms.get(gameId);
      if (room) {
        const winner = room.players[0].id === user.id ? 'white' : 'red';
        room.status = 'finished';
        gameRooms.delete(gameId);
        playerToRoom.delete(room.players[0].id);
        playerToRoom.delete(room.players[1].id);
        io.to(gameId).emit('game:ended', { result: 'disconnect', winner, finalBoard: room.board });
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🎮 Serveur Royale Dames WebSocket sur le port ${PORT}`);
});
