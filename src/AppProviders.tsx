/**
 * Fournisseurs racine - Royale Dames
 * Initialise Telegram WebApp (expand, couleurs, userStore), TonConnect
 */
import React from 'react';
import { useTelegramWebApp } from '@/lib/telegram';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

const manifestUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}/tonconnect-manifest.json`
    : 'https://royale-dames.vercel.app/tonconnect-manifest.json';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  useTelegramWebApp();
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
    </TonConnectUIProvider>
  );
}
