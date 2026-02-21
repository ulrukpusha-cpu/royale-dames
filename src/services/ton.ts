import { TonConnect, toUserFriendlyAddress } from '@tonconnect/sdk';
import { beginCell } from '@ton/core';

const MANIFEST_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/tonconnect-manifest.json`
    : 'https://royale-dames.vercel.app/tonconnect-manifest.json';

let connector: TonConnect | null = null;

let restorePromise: Promise<void> | null = null;

function getConnector(): TonConnect {
  if (!connector) {
    connector = new TonConnect({ manifestUrl: MANIFEST_URL });
    restorePromise = connector.restoreConnection().catch(() => {});
  }
  return connector;
}

export async function ensureRestored(): Promise<void> {
  getConnector();
  if (restorePromise) await restorePromise;
}

export type WalletCallbacks = {
  onConnected?: (address: string) => void;
  onDisconnected?: () => void;
};

let callbacks: WalletCallbacks = {};

export function setTonCallbacks(cb: WalletCallbacks) {
  callbacks = { ...callbacks, ...cb };
}

/** Ouvre la sélection de wallet (Tonkeeper, etc.). Appeler connect() avec la source choisie. */
export async function getWallets() {
  return getConnector().getWallets();
}

/** Connecte à un wallet (universalLink + bridgeUrl ou jsBridgeKey). */
export function connectTonWallet(
  source: { universalLink?: string; bridgeUrl?: string } | { jsBridgeKey: string }
): string | void {
  const c = getConnector();
  const link = c.connect(source as any);
  return typeof link === 'string' ? link : undefined;
}

export async function disconnectTonWallet(): Promise<void> {
  const c = getConnector();
  if (c.connected) await c.disconnect();
  callbacks.onDisconnected?.();
}

export function getTonWalletAddress(): string | null {
  const w = getConnector().wallet;
  if (!w) return null;
  return toUserFriendlyAddress(w.account.address);
}

export async function getTonBalance(): Promise<number> {
  const address = getTonWalletAddress();
  if (!address) return 0;
  try {
    const res = await fetch(
      `https://toncenter.com/api/v2/getAddressBalance?address=${encodeURIComponent(address)}`
    );
    const data = await res.json();
    return parseInt(data?.result ?? 0, 10) / 1e9;
  } catch (error) {
    console.error('Erreur récupération solde TON:', error);
    return 0;
  }
}

/** Adresse du contrat de paris (royale-dames-bet.fc). Remplacer après déploiement. */
const BET_CONTRACT = import.meta.env.VITE_TON_BET_CONTRACT || 'VOTRE_ADRESSE_CONTRACT';

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Construit le payload pour place_bet (op 1) du contrat FunC. */
function buildPlaceBetPayload(): string {
  const cell = beginCell().storeUint(1, 32).endCell();
  return uint8ArrayToBase64(cell.toBoc());
}

export async function placeBet(amount: number, gameId: string): Promise<{ success: boolean; txHash?: string }> {
  const c = getConnector();
  if (!c.wallet) return { success: false };
  if (BET_CONTRACT === 'VOTRE_ADRESSE_CONTRACT') {
    console.warn('VITE_TON_BET_CONTRACT non configuré - pari simulé');
    return { success: true, txHash: 'simulated' };
  }

  const nanoAmount = Math.floor(amount * 1e9).toString();
  const payload = buildPlaceBetPayload();

  try {
    const result = await c.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 360,
      messages: [{ address: BET_CONTRACT, amount: nanoAmount, payload }],
    });
    return { success: true, txHash: result.boc };
  } catch (error) {
    console.error('Erreur pari TON:', error);
    return { success: false };
  }
}

export async function withdrawWinnings(amount: number): Promise<boolean> {
  const c = getConnector();
  if (!c.wallet) return false;

  if (BET_CONTRACT === 'VOTRE_ADRESSE_CONTRACT') {
    console.warn('VITE_TON_BET_CONTRACT non configuré - retrait simulé');
    return true;
  }

  const nanoAmount = Math.floor(amount * 1e9);
  const payload = buildPlaceBetPayload();

  try {
    await c.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 360,
      messages: [{ address: BET_CONTRACT, amount: '50000000', payload }],
    });
    return true;
  } catch (error) {
    console.error('Erreur retrait TON:', error);
    return false;
  }
}

export function isTonConnected(): boolean {
  return !!getConnector().wallet;
}

export function subscribeTonStatus(onWallet: (address: string) => void, onDisconnect: () => void) {
  return getConnector().onStatusChange((wallet) => {
    if (wallet) {
      const addr = toUserFriendlyAddress(wallet.account.address);
      onWallet(addr);
      callbacks.onConnected?.(addr);
    } else {
      onDisconnect();
      callbacks.onDisconnected?.();
    }
  });
}
