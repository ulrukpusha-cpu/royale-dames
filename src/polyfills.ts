/**
 * Polyfills chargés en premier (script séparé dans index.html).
 * Buffer est requis par @tonconnect / @ton en environnement navigateur.
 */
import { Buffer } from 'buffer';

declare global {
  interface Window { Buffer: typeof Buffer; }
}

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = Buffer;
}
