/**
 * Fournisseurs racine - Royale Dames
 * Initialise Telegram WebApp (expand, couleurs, userStore)
 */
import { useTelegramWebApp } from '@/lib/telegram';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  useTelegramWebApp();
  return <>{children}</>;
}
