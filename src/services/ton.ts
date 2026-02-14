import { TonConnect, toUserFriendlyAddress } from '@tonconnect/sdk';

const MANIFEST_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/tonconnect-manifest.json`
    : 'https://royale-dames.vercel.app/tonconnect-manifest.json';

let connector: TonConnect | null = null;

function getConnector(): TonConnect {
  if (!connector) {
    connector = new TonConnect({ manifestUrl: MANIFEST_URL });
    connector.restoreConnection();
  }
  return connector;
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

export async function placeBet(amount: number, gameId: string): Promise<{ success: boolean; txHash?: string }> {
  const c = getConnector();
  if (!c.wallet) return { success: false };

  const contractAddress = 'VOTRE_ADRESSE_CONTRACT';
  const nanoAmount = Math.floor(amount * 1e9).toString();
  const payload = btoa(JSON.stringify({ action: 'bet', gameId, timestamp: Date.now() }));

  try {
    const result = await c.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 360,
      messages: [{ address: contractAddress, amount: nanoAmount, payload }],
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

  const contractAddress = 'VOTRE_ADRESSE_CONTRACT';
  const userAddress = getTonWalletAddress();
  const nanoAmount = Math.floor(amount * 1e9);
  const payload = btoa(
    JSON.stringify({ action: 'withdraw', toAddress: userAddress, amount: nanoAmount, timestamp: Date.now() })
  );

  try {
    await c.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 360,
      messages: [{ address: contractAddress, amount: '50000000', payload }],
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
