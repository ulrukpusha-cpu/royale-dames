/**
 * Plateforme jeux HTML5 Telegram (games.js + TelegramGameProxy)
 * @see https://core.telegram.org/bots/games
 */

declare global {
  interface Window {
    TelegramGameProxy?: {
      initParams: Record<string, string>;
      shareScore: () => void;
    };
  }
}

/** Contexte « message Jeu » + bouton Play (pas seulement Web App). */
export function isTelegramHtml5Game(): boolean {
  return typeof window !== 'undefined' && typeof window.TelegramGameProxy?.shareScore === 'function';
}

/** Lit les paramètres personnels hors préfixes tg* (fragment / initParams). */
export function getTelegramGameInitParams(): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = window.TelegramGameProxy?.initParams;
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) {
      if (k.startsWith('tg')) continue;
      if (v != null && v !== '') out[k] = String(v);
    }
  }
  const hash = window.location.hash?.replace(/^#/, '') || '';
  if (hash) {
    try {
      const hp = new URLSearchParams(hash);
      hp.forEach((v, k) => {
        if (!k.startsWith('tg') && v) out[k] = v;
      });
    } catch {
      /* ignore */
    }
  }
  return out;
}

/** room / ref / mode depuis query, fragment ou initParams jeu. */
export function readLaunchParams(): {
  room: string | null;
  ref: string | null;
  modeOnline: boolean;
  bet: number;
  currency: string;
} {
  if (typeof window === 'undefined') {
    return { room: null, ref: null, modeOnline: false, bet: 0, currency: 'USD' };
  }
  const search = new URLSearchParams(window.location.search || '');
  let room = (search.get('room') || '').trim();
  let ref = (search.get('ref') || '').trim();
  let modeOnline = search.get('mode') === 'online';
  let bet = parseInt(search.get('bet') || '0', 10) || 0;
  let currency = (search.get('currency') || 'USD').toUpperCase();

  const merge = (params: URLSearchParams) => {
    const r = params.get('room')?.trim();
    if (r) room = r;
    const f = params.get('ref')?.trim();
    if (f) ref = f;
    if (params.get('mode') === 'online') modeOnline = true;
    const b = parseInt(params.get('bet') || '', 10);
    if (Number.isFinite(b)) bet = b;
    const c = params.get('currency')?.trim();
    if (c) currency = c.toUpperCase();
  };

  const hash = window.location.hash?.replace(/^#/, '');
  if (hash) {
    try {
      merge(new URLSearchParams(hash));
    } catch {
      /* ignore */
    }
  }

  const gameParams = getTelegramGameInitParams();
  if (gameParams.room) room = gameParams.room;
  if (gameParams.ref) ref = gameParams.ref;
  if (gameParams.mode === 'online') modeOnline = true;
  if (gameParams.bet != null && gameParams.bet !== '') {
    const b = parseInt(gameParams.bet, 10);
    if (Number.isFinite(b)) bet = b;
  }
  if (gameParams.currency) currency = String(gameParams.currency).toUpperCase();

  return {
    room: room ? room.toUpperCase() : null,
    ref: ref ? ref.toUpperCase() : null,
    modeOnline,
    bet,
    currency,
  };
}

/** Partage du score — uniquement après action utilisateur (exigence Telegram). */
export function shareTelegramGameScore(): void {
  try {
    window.TelegramGameProxy?.shareScore?.();
  } catch {
    /* ignore */
  }
}
