/**
 * Hook multijoueur WebSocket - Royale Dames
 * Compatible avec le projet (pas de stores, user en paramètre)
 */
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export interface MultiplayerPlayer {
  id: string;
  username: string;
  socketId: string;
  rating?: number;
}

export interface MultiplayerGameRoom {
  id: string;
  players: [MultiplayerPlayer, MultiplayerPlayer];
  board: any;
  currentTurn: 'red' | 'white';
  yourColor: 'red' | 'white';
  betAmount?: number;
  betCurrency?: 'TON' | 'STARS';
  timer?: { red: number; white: number };
  chat?: { userId: string; username: string; message: string; timestamp: number }[];
  moveHistory?: any[];
}

export interface MultiplayerMove {
  from: { r: number; c: number };
  to: { r: number; c: number };
  captures: { r: number; c: number }[];
}

export interface UseMultiplayerOptions {
  user: { id: string; name: string; username?: string } | null;
  onRoomCreated?: (code: string) => void;
  onGameStarted?: (data: {
    gameId: string;
    players: [MultiplayerPlayer, MultiplayerPlayer];
    board: any;
    yourColor: 'red' | 'white';
    betAmount?: number;
    betCurrency?: 'TON' | 'STARS';
    timer?: { red: number; white: number };
  }) => void;
  onGameEnded?: (data: { result: string; winner?: string; winnings?: any; yourColor?: 'red' | 'white' }) => void;
}

export interface UseMultiplayerReturn {
  socket: Socket | null;
  isConnected: boolean;
  onlineFriends: MultiplayerPlayer[];
  currentGame: MultiplayerGameRoom | null;
  setCurrentGame: (g: MultiplayerGameRoom | null) => void;
  invitePlayer: (friendId: string, betAmount?: number, betCurrency?: 'TON' | 'STARS') => void;
  acceptInvitation: (invitationId: string, fromUserId: string, betAmount?: number, betCurrency?: 'TON' | 'STARS') => void;
  declineInvitation: (invitationId: string, fromUserId: string) => void;
  searchForMatch: (betAmount?: number, betCurrency?: 'TON' | 'STARS') => void;
  cancelSearch: (betAmount?: number, betCurrency?: 'TON' | 'STARS') => void;
  createRoom: (betAmount?: number, betCurrency?: 'TON' | 'STARS') => void;
  joinRoom: (code: string) => void;
  makeMove: (move: MultiplayerMove) => void;
  sendChatMessage: (message: string) => void;
  offerDraw: () => void;
  acceptDraw: () => void;
  resign: () => void;
}

export function useMultiplayer({ user, onRoomCreated, onGameStarted, onGameEnded }: UseMultiplayerOptions): UseMultiplayerReturn {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineFriends, setOnlineFriends] = useState<MultiplayerPlayer[]>([]);
  const [currentGame, setCurrentGame] = useState<MultiplayerGameRoom | null>(null);
  const currentGameRef = useRef<MultiplayerGameRoom | null>(null);
  currentGameRef.current = currentGame;

  useEffect(() => {
    if (!user?.id) return;

    const initData = typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData;
    const token = initData && initData.length > 0 ? initData : `demo_${user.id}`;

    const s = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    });

    s.on('disconnect', () => setIsConnected(false));

    s.on('error', (err: { message: string }) => {
      (window as any).Telegram?.WebApp?.showAlert?.(err.message || 'Erreur');
    });

    s.on('friends:online', (friends: MultiplayerPlayer[]) => {
      setOnlineFriends(friends);
    });

    s.on('friend:status-changed', (data: { userId: string; isOnline: boolean }) => {
      setOnlineFriends(prev => {
        if (data.isOnline) return prev.some(f => f.id === data.userId) ? prev : [...prev, { id: data.userId, username: '', socketId: '' }];
        return prev.filter(f => f.id !== data.userId);
      });
    });

    s.on('game:invitation', (invitation: any) => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.showPopup) {
        tg.showPopup({
          title: 'Invitation de jeu',
          message: `${invitation.from?.username || 'Joueur'} vous invite${invitation.betAmount ? ` pour ${invitation.betAmount} ${invitation.betCurrency}` : ''}`,
          buttons: [
            { id: 'accept', type: 'default', text: 'Accepter' },
            { id: 'decline', type: 'cancel', text: 'Refuser' }
          ]
        }, (buttonId: string) => {
          if (buttonId === 'accept') {
            s.emit('game:accept', {
              invitationId: invitation.id,
              fromUserId: invitation.from?.id,
              betAmount: invitation.betAmount,
              betCurrency: invitation.betCurrency
            });
          } else {
            s.emit('game:decline', { invitationId: invitation.id, fromUserId: invitation.from?.id });
          }
        });
      }
    });

    s.on('game:invitation-sent', () => {
      (window as any).Telegram?.WebApp?.showAlert?.('Invitation envoyée !');
    });

    s.on('game:room-created', (data: { code: string }) => {
      onRoomCreated?.(data.code);
    });

    s.on('game:invitation-declined', (data: { by: string }) => {
      (window as any).Telegram?.WebApp?.showAlert?.(`${data.by} a refusé votre invitation`);
    });

    s.on('game:started', (data: any) => {
      const room: MultiplayerGameRoom = {
        id: data.gameId,
        players: data.players,
        board: data.board,
        currentTurn: 'red',
        yourColor: data.yourColor,
        betAmount: data.betAmount,
        betCurrency: data.betCurrency,
        timer: data.timer,
        chat: [],
        moveHistory: []
      };
      setCurrentGame(room);
      currentGameRef.current = room;
      onGameStarted?.(data);
    });

    s.on('game:move-made', (data: { move: any; board: any; currentTurn: string; moveHistory: any[] }) => {
      setCurrentGame(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          board: data.board,
          currentTurn: data.currentTurn as 'red' | 'white',
          moveHistory: data.moveHistory || prev.moveHistory || []
        };
      });
    });

    s.on('game:ended', (data: { result: string; winner?: string; winnings?: any }) => {
      const gc = currentGameRef.current;
      onGameEnded?.({ ...data, yourColor: gc?.yourColor });
      setCurrentGame(null);
      currentGameRef.current = null;
    });

    s.on('game:draw-offered', (data: { by: string }) => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.showPopup) {
        tg.showPopup({
          title: 'Match nul proposé',
          message: `${data.by} propose un match nul`,
          buttons: [
            { id: 'accept', type: 'default', text: 'Accepter' },
            { id: 'decline', type: 'cancel', text: 'Refuser' }
          ]
        }, (buttonId: string) => {
          if (buttonId === 'accept' && currentGameRef.current) {
            s.emit('game:accept-draw', { gameId: currentGameRef.current.id });
          }
        });
      }
    });

    s.on('chat:new-message', (msg: any) => {
      setCurrentGame(prev => prev ? { ...prev, chat: [...(prev.chat || []), msg] } : prev);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [user?.id]);

  const invitePlayer = (friendId: string, betAmount?: number, betCurrency?: 'TON' | 'STARS') => {
    socketRef.current?.emit('game:invite', { friendId, betAmount, betCurrency });
  };

  const searchForMatch = (betAmount?: number, betCurrency?: 'TON' | 'STARS') => {
    socketRef.current?.emit('game:search', { betAmount, betCurrency: betCurrency || 'USD' });
  };

  const cancelSearch = (betAmount?: number, betCurrency?: 'TON' | 'STARS') => {
    socketRef.current?.emit('game:cancel-search', { betAmount, betCurrency: betCurrency || 'USD' });
  };

  const createRoom = (betAmount?: number, betCurrency?: 'TON' | 'STARS') => {
    socketRef.current?.emit('game:create-room', { betAmount, betCurrency });
  };

  const joinRoom = (code: string) => {
    socketRef.current?.emit('game:join-room', { code: code?.trim().toUpperCase() });
  };

  const acceptInvitation = (invitationId: string, fromUserId: string, betAmount?: number, betCurrency?: 'TON' | 'STARS') => {
    socketRef.current?.emit('game:accept', { invitationId, fromUserId, betAmount, betCurrency });
  };

  const declineInvitation = (invitationId: string, fromUserId: string) => {
    socketRef.current?.emit('game:decline', { invitationId, fromUserId });
  };

  const makeMove = (move: MultiplayerMove) => {
    if (!currentGame) return;
    socketRef.current?.emit('game:move', { gameId: currentGame.id, move });
  };

  const sendChatMessage = (message: string) => {
    if (!currentGame) return;
    socketRef.current?.emit('chat:message', { gameId: currentGame.id, message });
  };

  const offerDraw = () => {
    if (!currentGame) return;
    socketRef.current?.emit('game:offer-draw', { gameId: currentGame.id });
  };

  const acceptDraw = () => {
    if (!currentGame) return;
    socketRef.current?.emit('game:accept-draw', { gameId: currentGame.id });
  };

  const resign = () => {
    if (!currentGame) return;
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.showPopup) {
      tg.showPopup({
        title: 'Abandonner',
        message: 'Êtes-vous sûr ?',
        buttons: [
          { id: 'yes', type: 'destructive', text: 'Oui' },
          { id: 'no', type: 'cancel', text: 'Non' }
        ]
      }, (buttonId: string) => {
        if (buttonId === 'yes' && currentGame) {
          socketRef.current?.emit('game:resign', { gameId: currentGame.id });
        }
      });
    } else {
      socketRef.current?.emit('game:resign', { gameId: currentGame.id });
    }
  };

  return {
    socket,
    isConnected,
    onlineFriends,
    currentGame,
    setCurrentGame,
    invitePlayer,
    acceptInvitation,
    declineInvitation,
    searchForMatch,
    cancelSearch,
    createRoom,
    joinRoom,
    makeMove,
    sendChatMessage,
    offerDraw,
    acceptDraw,
    resign
  };
}
