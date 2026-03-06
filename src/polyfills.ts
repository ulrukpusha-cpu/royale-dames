/**
 * Polyfills chargés en premier pour le navigateur (avant React / App).
 * Buffer est requis par @tonconnect et autres libs crypto.
 */
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}
