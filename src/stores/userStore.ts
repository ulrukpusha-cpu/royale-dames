/**
 * Store Zustand pour l'utilisateur - Royale Dames
 * Compatible: Google, Telegram, wallet TON/MetaMask
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  telegramId?: number;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  provider?: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
}

interface UserState {
  user: UserProfile | null;
  isWalletConnected: boolean;
  walletAddress: string | null;
  balance: { TON: number; STARS: number };
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;

  setUser: (userData: { id: string; name: string; username?: string; telegramId?: number; photoUrl?: string; provider?: string } | null) => void;
  updateRating: (newRating: number) => void;
  updateStats: (result: 'win' | 'loss' | 'draw') => void;
  setWalletConnected: (connected: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  updateBalance: (currency: 'TON' | 'STARS', amount: number) => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleVibration: () => void;
  toggleNotifications: () => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isWalletConnected: false,
      walletAddress: null,
      balance: { TON: 0, STARS: 0 },
      soundEnabled: true,
      musicEnabled: false,
      vibrationEnabled: true,
      notificationsEnabled: true,

      setUser: (userData) => {
        if (!userData) {
          set({ user: null });
          return;
        }
        const firstName = userData.name?.split(' ')[0] || userData.name;
        set({
          user: {
            id: userData.id || `tg_${userData.telegramId}`,
            name: userData.name,
            username: userData.username,
            telegramId: userData.telegramId,
            firstName,
            lastName: userData.name?.split(' ').slice(1).join(' '),
            photoUrl: userData.photoUrl,
            provider: userData.provider,
            rating: 1200,
            wins: 0,
            losses: 0,
            draws: 0,
          },
        });
      },

      updateRating: (newRating) =>
        set((s) => ({
          user: s.user ? { ...s.user, rating: newRating } : null,
        })),

      updateStats: (result) =>
        set((s) => {
          if (!s.user) return s;
          const u = { ...s.user };
          if (result === 'win') u.wins++;
          if (result === 'loss') u.losses++;
          if (result === 'draw') u.draws++;
          return { user: u };
        }),

      setWalletConnected: (connected) => set({ isWalletConnected: connected }),
      setWalletAddress: (address) => set({ walletAddress: address }),

      updateBalance: (currency, amount) =>
        set((s) => ({
          balance: { ...s.balance, [currency]: amount },
        })),

      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleMusic: () => set((s) => ({ musicEnabled: !s.musicEnabled })),
      toggleVibration: () => set((s) => ({ vibrationEnabled: !s.vibrationEnabled })),
      toggleNotifications: () => set((s) => ({ notificationsEnabled: !s.notificationsEnabled })),

      logout: () =>
        set({
          user: null,
          isWalletConnected: false,
          walletAddress: null,
          balance: { TON: 0, STARS: 0 },
        }),
    }),
    {
      name: 'royale-dames-user',
      partialize: (s) => ({
        user: s.user,
        soundEnabled: s.soundEnabled,
        musicEnabled: s.musicEnabled,
        vibrationEnabled: s.vibrationEnabled,
        notificationsEnabled: s.notificationsEnabled,
      }),
    }
  )
);
