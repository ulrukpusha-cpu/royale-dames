/**
 * Store Zustand pour les paris - Royale Dames
 * Compatible: TON, Stars, historique et statistiques
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Bet {
  id: string;
  gameId: string;
  amount: number;
  currency: 'TON' | 'STARS';
  status: 'pending' | 'won' | 'lost' | 'refunded';
  txHash?: string;
  timestamp: number;
  result?: {
    winnings?: number;
    paidAt?: number;
  };
}

interface BettingState {
  bets: Bet[];
  activeBet: Bet | null;
  totalWagered: { TON: number; STARS: number };
  totalWon: { TON: number; STARS: number };

  addBet: (bet: Bet) => void;
  updateBetStatus: (betId: string, status: Bet['status'], result?: Bet['result']) => void;
  getBetsByGame: (gameId: string) => Bet[];
  getActiveBet: () => Bet | null;
  clearActiveBet: () => void;
  getBettingHistory: () => Bet[];
  getStats: () => {
    totalBets: number;
    wonBets: number;
    lostBets: number;
    winRate: number;
  };
}

export const useBettingStore = create<BettingState>()(
  persist(
    (set, get) => ({
      bets: [],
      activeBet: null,
      totalWagered: { TON: 0, STARS: 0 },
      totalWon: { TON: 0, STARS: 0 },

      addBet: (bet) =>
        set((s) => ({
          bets: [...s.bets, bet],
          activeBet: bet,
          totalWagered: {
            ...s.totalWagered,
            [bet.currency]: s.totalWagered[bet.currency] + bet.amount,
          },
        })),

      updateBetStatus: (betId, status, result) =>
        set((s) => {
          const currency = s.bets.find((b) => b.id === betId)?.currency;
          let newTotalWon = s.totalWon;

          if (status === 'won' && result?.winnings && currency) {
            newTotalWon = {
              ...s.totalWon,
              [currency]: s.totalWon[currency] + result.winnings,
            };
          }

          const updatedBets = s.bets.map((b) =>
            b.id === betId ? { ...b, status, result } : b
          );

          return {
            bets: updatedBets,
            activeBet: s.activeBet?.id === betId ? null : s.activeBet,
            totalWon: newTotalWon,
          };
        }),

      getBetsByGame: (gameId) => get().bets.filter((b) => b.gameId === gameId),

      getActiveBet: () => get().activeBet,

      clearActiveBet: () => set({ activeBet: null }),

      getBettingHistory: () =>
        [...get().bets].sort((a, b) => b.timestamp - a.timestamp),

      getStats: () => {
        const { bets } = get();
        const totalBets = bets.length;
        const wonBets = bets.filter((b) => b.status === 'won').length;
        const lostBets = bets.filter((b) => b.status === 'lost').length;
        const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;
        return { totalBets, wonBets, lostBets, winRate };
      },
    }),
    { name: 'royale-dames-betting' }
  )
);
