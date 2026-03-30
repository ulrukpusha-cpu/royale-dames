import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { readLaunchParams, isTelegramHtml5Game, shareTelegramGameScore } from '@/lib/telegramGameProxy';
const TonBettingPanel = lazy(() => import('@/components/TonBettingPanel').then(m => ({ default: m.TonBettingPanel })));
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import {
  Trophy,
  User, 
  Wallet, 
  Smartphone, 
  Monitor, 
  Globe, 
  Play, 
  Users, 
  LogOut,
  MessageSquare,
  BookOpen,
  X,
  Volume2,
  VolumeX,
  Eye,
  Tv,
  Palette,
  Check,
  Share2,
  Copy,
  UserPlus,
  Pause,
  Crown,
  Plus,
  History,
  Minus,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';

// --- THEMES & STYLES CONFIGURATION ---

const THEMES = {
  tabac: {
    id: 'tabac',
    name: 'Club Privé',
    bg: '#2b1d16',
    bgGradient: 'radial-gradient(circle at 50% 50%, #4a332a 0%, #1e120d 100%)',
    panel: 'rgba(43, 29, 22, 0.95)',
    panelBorder: '1px solid rgba(197, 160, 89, 0.3)',
    text: '#e6d5ac', // Parchment color
    textDim: '#a68e74',
    gold: '#c5a059', // Antique gold
    goldDim: '#8a6e3e',
    accent: '#d35400', // Burnt orange
    success: '#27ae60',
    boardLight: '#deb887', // Burlywood
    boardDark: '#5d4037', // Sienna
    buttonShadow: '#5c4524',
    fontMain: "'Cinzel', serif",
    fontBody: "'Inter', sans-serif"
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Dark',
    bg: '#0f1014',
    bgGradient: 'radial-gradient(circle at 50% 50%, #1a1c24 0%, #000 100%)',
    panel: 'rgba(26, 28, 36, 0.95)',
    panelBorder: '1px solid rgba(255, 255, 255, 0.1)',
    text: '#e0e0e0',
    textDim: '#888',
    gold: '#ffd700',
    goldDim: '#b8860b',
    accent: '#3498db',
    success: '#2ecc71',
    boardLight: '#cbaa87',
    boardDark: '#4a2c20',
    buttonShadow: '#665c24',
    fontMain: "'Cinzel', serif",
    fontBody: "'Inter', sans-serif"
  },
  royal: {
    id: 'royal',
    name: 'Royal Blue',
    bg: '#0a1024',
    bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    panel: 'rgba(15, 23, 42, 0.9)',
    panelBorder: '1px solid rgba(148, 163, 184, 0.2)',
    text: '#f1f5f9',
    textDim: '#94a3b8',
    gold: '#38bdf8', // Light blue acting as highlight
    goldDim: '#0284c7',
    accent: '#818cf8',
    success: '#34d399',
    boardLight: '#e2e8f0',
    boardDark: '#334155',
    buttonShadow: '#0369a1',
    fontMain: "'Cinzel', serif",
    fontBody: "'Inter', sans-serif"
  },
  nature: {
    id: 'nature',
    name: 'Zen Garden',
    bg: '#1c2e1c',
    bgGradient: 'linear-gradient(to bottom, #1a2f1a, #0d1a0d)',
    panel: 'rgba(20, 40, 20, 0.8)',
    panelBorder: '1px solid rgba(100, 160, 100, 0.3)',
    text: '#d4e6d4',
    textDim: '#8fa88f',
    gold: '#90be6d',
    goldDim: '#5a8a3e',
    accent: '#43aa8b',
    success: '#4d908e',
    danger: '#e63946',
    boardLight: '#e9edc9',
    boardDark: '#577590',
    buttonShadow: '#3a6b4f',
    fontMain: "'Inter', sans-serif",
    fontBody: "'Inter', sans-serif"
  }
};

const PIECE_SKINS = {
  classic: { name: 'Classique', type: 'solid' },
  wood: { name: 'Ébène & Ivoire', type: 'wood' },
  marble: { name: 'Marbre', type: 'marble' },
  neon: { name: 'Néon', type: 'glow' }
};

// --- AI DIFFICULTY ---
type AIDifficulty = 'easy' | 'medium' | 'hard';

// --- STYLES GENERATOR ---
const getStyles = (theme: any) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'var(--tg-viewport-height, 100vh)',
    minHeight: 'var(--tg-viewport-height, 100vh)',
    width: '100vw',
    backgroundColor: '#000',
    backgroundImage: theme.bgGradient,
    color: theme.text,
    fontFamily: theme.fontBody,
  },
  header: {
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    minHeight: '44px',
    flexShrink: 0,
    background: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(5px)',
    borderBottom: theme.panelBorder,
    zIndex: 10,
  },
  logo: {
    fontFamily: theme.fontMain,
    fontSize: '16px',
    fontWeight: 900,
    color: theme.gold,
    textShadow: `0 2px 10px ${theme.goldDim}`,
    letterSpacing: '1.5px',
    textTransform: 'uppercase'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    position: 'relative',
    overflowY: 'auto',
  },
  // New "Tactile" Button Style
  button: {
    background: `linear-gradient(180deg, ${theme.gold} 0%, ${theme.goldDim} 100%)`,
    border: 'none',
    borderTop: `1px solid rgba(255,255,255,0.4)`,
    padding: '12px 24px',
    borderRadius: '10px',
    color: '#2a1a08', // Dark brown text for contrast on gold
    fontWeight: '800',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: `0 4px 0 ${theme.buttonShadow}, 0 8px 8px rgba(0,0,0,0.3)`, // 3D effect
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textTransform: 'uppercase',
    fontFamily: theme.fontMain,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonActive: {
    transform: 'translateY(3px)',
    boxShadow: `0 1px 0 ${theme.buttonShadow}, 0 2px 2px rgba(0,0,0,0.3)`,
  },
  secondaryButton: {
    background: 'rgba(0,0,0,0.2)',
    border: `1px solid ${theme.textDim}`,
    color: theme.textDim,
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '8px',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  panel: {
    background: theme.panel,
    padding: '20px',
    borderRadius: '20px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.05)',
    border: theme.panelBorder,
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
  },
  input: {
    width: '100%',
    padding: '10px',
    margin: '8px 0',
    borderRadius: '8px',
    border: `1px solid ${theme.textDim}`,
    background: 'rgba(0,0,0,0.3)',
    color: theme.text,
    fontSize: '14px',
    fontFamily: theme.fontBody
  },
  chip: {
    padding: '6px 12px',
    borderRadius: '20px',
    background: 'rgba(0,0,0,0.2)',
    border: `1px solid rgba(255,255,255,0.05)`,
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '600'
  },
  chipActive: {
    background: theme.gold,
    color: '#2a1a08',
    border: `1px solid ${theme.gold}`
  }
});

// --- GAME LOGIC (10x10 International Draughts) ---
const BOARD_SIZE = 10;

type Piece = { color: 'red' | 'white'; isKing: boolean } | null;
type Board = Piece[][];
type Position = { r: number; c: number };
type Move = {
    from: Position;
    to: Position;
    captures: Position[]; // List of captured piece positions
    isPromotion?: boolean;
};

// 20 pieces per side, on dark squares (rows 0-3 for white, 6-9 for red)
const INITIAL_BOARD: Board = Array(BOARD_SIZE).fill(null).map((_, r) => 
  Array(BOARD_SIZE).fill(null).map((_, c) => {
    if ((r + c) % 2 === 1) {
      if (r < 4) return { color: 'white', isKing: false };
      if (r > 5) return { color: 'red', isKing: false };
    }
    return null;
  })
);

// --- HELPER COMPONENT FOR BUTTONS ---
const TactileButton = ({ onClick, style, children, theme, disabled, variant }: any) => {
  const [isActive, setIsActive] = useState(false);
  const s = getStyles(theme);

  const variantStyle = variant === 'secondary' ? s.secondaryButton
    : variant === 'danger' ? { background: 'linear-gradient(180deg, #e74c3c 0%, #c0392b 100%)', color: '#fff', border: 'none', borderTop: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 0 #922b21, 0 8px 8px rgba(0,0,0,0.3)' }
    : {};

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        ...s.button,
        ...variantStyle,
        ...style,
        ...(isActive ? s.buttonActive : {}),
        ...(disabled ? { opacity: 0.7, cursor: 'not-allowed' } : {})
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      onMouseLeave={() => setIsActive(false)}
      onTouchStart={() => setIsActive(true)}
      onTouchEnd={() => setIsActive(false)}
    >
      {children}
    </button>
  );
};

// CAPTURED PIECES DISPLAY
const CapturedPieces = ({ count, color, theme }: { count: number; color: string; theme: any }) => {
  if (count === 0) return null;
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginTop: '2px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: '12px', height: '12px', borderRadius: '50%',
          background: color === 'red' ? '#c0392b' : '#ecf0f1',
          border: `1px solid ${color === 'red' ? '#922b21' : '#bdc3c7'}`,
          opacity: 0.7
        }} />
      ))}
    </div>
  );
};

// PLAYER TIMER
const PlayerTimer = ({ time, theme, isActive }: { time: number; theme: any; isActive: boolean }) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const isLow = time < 30;
  return (
    <div style={{
      background: isActive ? `linear-gradient(135deg, ${theme.gold}, ${theme.goldDim})` : 'rgba(0,0,0,0.3)',
      color: isActive ? '#1a1a1a' : theme.text,
      padding: '6px 12px', borderRadius: '8px',
      fontFamily: "'Courier New', monospace", fontWeight: 'bold', fontSize: '16px',
      minWidth: '60px', textAlign: 'center',
      border: isLow && isActive ? '1px solid #e74c3c' : '1px solid transparent',
      animation: isLow && isActive ? 'pulse-timer 1s ease-in-out infinite' : 'none'
    }}>
      {`${minutes}:${seconds.toString().padStart(2, '0')}`}
    </div>
  );
};

// 2. HELPER FOR RULE BUTTONS
const RuleButton = ({ label, value, isSelected, onClick, theme }: any) => {
  const [isPressed, setIsPressed] = useState(false);
  const r = parseInt(theme.gold.slice(1, 3), 16);
  const g = parseInt(theme.gold.slice(3, 5), 16);
  const b = parseInt(theme.gold.slice(5, 7), 16);

  return (
    <button
      onClick={() => onClick(value)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        flex: 1,
        padding: '10px',
        borderRadius: '10px',
        background: isSelected ? `rgba(${r}, ${g}, ${b}, 0.2)` : 'rgba(0,0,0,0.2)',
        border: isSelected ? `1px solid ${theme.gold}` : '1px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy pop effect
        transform: isPressed ? 'scale(0.96)' : 'scale(1)',
        outline: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: theme.fontBody
      }}
    >
      <div style={{
        fontWeight: 'bold', 
        fontSize: '13px', 
        color: isSelected ? theme.gold : theme.textDim,
        transition: 'color 0.2s'
      }}>
        {label}
      </div>
    </button>
  );
};

// --- COMPONENTS ---

// 0. SPLASH SCREEN — GIF + barre de chargement 0–100% en 8 secondes
const SplashScreen = ({ onComplete, theme }: { onComplete: () => void; theme: any }) => {
  const [progress, setProgress] = useState(0);
  const [imgError, setImgError] = useState(false);
  const s = getStyles(theme);

  useEffect(() => {
    const duration = 8000; // 8 secondes
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (p >= 100) {
        onComplete();
        return;
      }
      requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [onComplete]);

  const splashSrc = `${String((import.meta as any).env?.BASE_URL ?? '/').replace(/\/+$/, '')}/splash.webm`;
  return (
    <div style={{ ...s.container, position: 'relative', background: '#000', padding: 0 }}>
      {/* Animation plein écran (webm/gif) */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {!imgError ? (
          <video
            src={splashSrc}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: theme.bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={80} color={theme.gold} />
          </div>
        )}
      </div>
      {/* Barre de chargement en bas */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 24px 32px' }}>
        <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${theme.goldDim}, ${theme.gold})`, borderRadius: 4, transition: 'width 0.15s linear' }} />
        </div>
        <span style={{ fontSize: 14, color: theme.gold, fontWeight: 700 }}>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

const LOGO_SRC = `${String((import.meta as any).env?.BASE_URL ?? '/').replace(/\/+$/, '')}/logo.png`;

// 0.5 PAGE D'ACCUEIL — Menu et Atelier (logo Tabac Dames)
const AccueilScreen = ({ onMenu, onAtelier, theme }: { onMenu: () => void; onAtelier: () => void; theme: any }) => {
  const s = getStyles(theme);
  const [logoError, setLogoError] = useState(false);
  return (
    <div style={s.main}>
      <div style={{ ...s.panel, animation: 'fadeIn 0.6s ease-out' }}>
        <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
          {!logoError ? (
            <img
              src={LOGO_SRC}
              alt="Dame Tabac"
              style={{ height: '72px', width: 'auto', display: 'block' }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `radial-gradient(circle at 30% 30%, ${theme.gold}, ${theme.goldDim})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={36} color="#2a1a08" />
            </div>
          )}
        </div>
        <h1 style={{ ...s.logo, fontSize: '28px', marginBottom: '6px' }}>ROYAL DAMES</h1>
        <p style={{ color: theme.textDim, marginBottom: '32px', fontSize: '12px', letterSpacing: '0.5px' }}>LE CERCLE DES STRATÈGES</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TactileButton theme={theme} onClick={onMenu} style={{ width: '100%' }}>
            MENU
          </TactileButton>
          <TactileButton theme={theme} onClick={onAtelier} style={{ width: '100%' }}>
            ATELIER
          </TactileButton>
        </div>

        <div style={{ marginTop: '24px', fontSize: '10px', color: theme.textDim, opacity: 0.7 }}>
          En entrant, vous acceptez les règles du club et la politique de jeu responsable.
        </div>
      </div>
    </div>
  );
};

// 0.6 PAGE ATELIER — Thèmes, pions, chrono (depuis le bouton Atelier de l'accueil)
const AtelierScreen = ({ onMenu, onBack, theme, currentTheme, setTheme, currentSkin, setSkin, timerEnabled, setTimerEnabled, timerSeconds, setTimerSeconds }: any) => {
  const s = getStyles(theme);
  const [pendingChange, setPendingChange] = useState<{ type: 'theme' | 'skin', value: any } | null>(null);
  const effectiveTheme = pendingChange?.type === 'theme' ? pendingChange.value : currentTheme;
  const effectiveSkin = pendingChange?.type === 'skin' ? pendingChange.value : currentSkin;
  const handleThemeClick = (t: any) => { if (t.id !== currentTheme.id) setPendingChange({ type: 'theme', value: t }); };
  const handleSkinClick = (key: string) => { if (key !== currentSkin) setPendingChange({ type: 'skin', value: key }); };
  return (
    <div style={s.main}>
      <div style={{ ...s.panel, maxWidth: '420px', textAlign: 'left' }}>
        <h2 style={{ fontFamily: theme.fontMain, color: theme.gold, marginBottom: '16px', fontSize: '18px' }}>Atelier</h2>

        <h3 style={{ fontFamily: theme.fontMain, color: theme.gold, borderBottom: `1px solid ${theme.textDim}`, paddingBottom: '6px', marginBottom: '12px', fontSize: '14px' }}>Chronomètre</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
          <span style={{ fontSize: '13px', color: theme.text }}>Activer</span>
          <button onClick={() => setTimerEnabled?.(!timerEnabled)} style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: timerEnabled ? theme.gold : 'rgba(255,255,255,0.2)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 2, left: timerEnabled ? 24 : 2, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', transition: 'left 0.2s' }} />
          </button>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: theme.textDim, marginBottom: '8px' }}>Temps par joueur</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[60, 120, 180, 300, 420].map(sec => (
              <button key={sec} onClick={() => setTimerSeconds?.(sec)} style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: timerSeconds === sec ? theme.gold : 'rgba(0,0,0,0.3)', color: timerSeconds === sec ? '#2a1a08' : theme.textDim, fontWeight: 'bold', fontSize: '12px' }}>
                {sec === 60 ? '1 min' : sec === 120 ? '2 min' : sec === 180 ? '3 min' : sec === 300 ? '5 min' : '7 min'}
              </button>
            ))}
          </div>
        </div>

        <h3 style={{ fontFamily: theme.fontMain, color: theme.gold, borderBottom: `1px solid ${theme.textDim}`, paddingBottom: '6px', marginBottom: '12px', fontSize: '14px' }}>Thème</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
          {Object.values(THEMES).map((t: any) => {
            const isSelected = t.id === effectiveTheme.id;
            return (
              <div
                key={t.id}
                onClick={() => handleThemeClick(t)}
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: isSelected ? `1px solid ${theme.gold}` : '1px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: t.bgGradient, border: '2px solid rgba(255,255,255,0.2)' }} />
                <span style={{ fontSize: '11px', color: isSelected ? theme.gold : theme.textDim, fontWeight: 'bold' }}>{t.name}</span>
              </div>
            );
          })}
        </div>

        <h3 style={{ fontFamily: theme.fontMain, color: theme.gold, borderBottom: `1px solid ${theme.textDim}`, paddingBottom: '6px', marginBottom: '12px', fontSize: '14px' }}>Finition des pions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          {Object.entries(PIECE_SKINS).map(([key, skin]: any) => {
            const isSelected = effectiveSkin === key;
            return (
              <div
                key={key}
                onClick={() => handleSkinClick(key)}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.2)',
                  border: isSelected ? `1px solid ${theme.gold}` : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: key === 'wood' ? '#8b4513' : key === 'marble' ? '#bdc3c7' : key === 'neon' ? theme.accent : '#d63031' }} />
                <span style={{ fontSize: '12px', color: isSelected ? theme.text : theme.textDim }}>{skin.name}</span>
                {isSelected && <Check size={14} color={theme.gold} style={{ marginLeft: 'auto' }} />}
              </div>
            );
          })}
        </div>

        {pendingChange && (
          <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(197,160,89,0.1)', borderRadius: '10px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => setPendingChange(null)} style={{ ...s.secondaryButton, margin: 0 }}>Annuler</button>
            <button onClick={() => { if (pendingChange.type === 'theme') setTheme(pendingChange.value); else setSkin(pendingChange.value); setPendingChange(null); }} style={{ ...s.button, margin: 0, padding: '8px 16px' }}>Appliquer</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
          <TactileButton theme={theme} onClick={onBack} variant="secondary" style={{ width: '100%' }}>← Retour accueil</TactileButton>
          <TactileButton theme={theme} onClick={onMenu} style={{ width: '100%' }}>Menu</TactileButton>
        </div>
      </div>
    </div>
  );
};

// 1. MAIN MENU / DASHBOARD
// --- DEPOSIT MODAL (MOBILE MONEY - WAVE) ---
const DepositModal = ({ theme, onClose, onSuccess, user }: any) => {
  const s = getStyles(theme);
  const [amount, setAmount] = useState(10);
  const [provider, setProvider] = useState<string | null>('wave');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1);
  const WAVE_CHECKOUT_URL = (import.meta as any).env?.VITE_WAVE_CHECKOUT_URL as string | undefined;
  const externalId = user?.id;
  const PROVIDERS = [
    { id: 'wave', name: 'Wave', color: '#1b84f2', textColor: '#fff' }
  ];
  const handleDeposit = async () => {
    setStep(3);
    try {
      if (WAVE_CHECKOUT_URL) {
        const resp = await fetch(WAVE_CHECKOUT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, phone, external_id: externalId }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          const errMsg = data?.error || 'Erreur serveur';
          throw new Error(errMsg);
        }
        const isRealWave = data.redirectUrl != null && !data.simulated;
        if (data.redirectUrl) {
          window.open(data.redirectUrl, '_blank');
        }
        if (data.simulated) {
          setTimeout(() => { onSuccess(amount); }, 2000);
        } else {
          (window as any).Telegram?.WebApp?.showAlert?.('Paiement initié. Votre solde sera crédité après confirmation par Wave.');
          setTimeout(() => onClose(), 2500);
        }
        return;
      }
      setTimeout(() => { onSuccess(amount); }, 2000);
    } catch (e) {
      console.error(e);
      (window as any).Telegram?.WebApp?.showAlert?.(e instanceof Error ? e.message : 'Erreur lors du paiement Wave. Réessayez.');
    }
  };
  return (
    <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', padding: '20px'}}>
      <div style={{...s.panel, maxWidth: '360px', position: 'relative', animation: 'scaleIn 0.3s'}}>
        <button onClick={onClose} style={{position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer'}}><X size={20} /></button>
        <h2 style={{color: theme.text, fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}><Smartphone size={20} color={theme.gold} /> Wave Mobile Money</h2>
        {step === 1 && (
          <>
            <div style={{marginBottom: '20px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <TactileButton variant="secondary" theme={theme} onClick={() => setAmount(Math.max(5, amount - 5))} style={{padding: '10px', width: '40px'}}><Minus size={16} /></TactileButton>
                <div style={{flex: 1, background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '12px', color: theme.gold, fontSize: '20px', fontWeight: 'bold', textAlign: 'center'}}>${amount}</div>
                <TactileButton variant="secondary" theme={theme} onClick={() => setAmount(amount + 5)} style={{padding: '10px', width: '40px'}}><Plus size={16} /></TactileButton>
              </div>
            </div>
            <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'center'}}>
              {PROVIDERS.map(p => (
                <div
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  style={{
                    minWidth: '120px',
                    maxWidth: '180px',
                    width: '60%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: provider === p.id ? p.color : 'rgba(255,255,255,0.05)',
                    border: provider === p.id ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                    color: provider === p.id ? p.textColor : theme.textDim,
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  {p.name}
                </div>
              ))}
            </div>
            <TactileButton theme={theme} disabled={!provider} onClick={() => setStep(2)} style={{width: '100%'}}>CONTINUER</TactileButton>
          </>
        )}
        {step === 2 && (
          <>
            <input type="tel" placeholder="07 12 34 56 78" value={phone} onChange={(e) => setPhone(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${theme.textDim}`, color: theme.text, fontSize: '16px', marginBottom: '20px', boxSizing: 'border-box'}} />
            <TactileButton theme={theme} disabled={phone.length < 8} onClick={handleDeposit} style={{width: '100%'}}>PAYER ${amount}</TactileButton>
          </>
        )}
        {step === 3 && (
          <div style={{padding: '20px 0', textAlign: 'center'}}>
            <Loader2 size={40} color={theme.gold} style={{animation: 'spin 1s linear infinite', marginBottom: '16px'}} />
            <div style={{color: theme.textDim}}>Traitement en cours...</div>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = ({ initialTab = 'play', user, wallet, setWallet, history, onPlay, onSpectate, onLogout, currentTheme, setTheme, currentSkin, setSkin, friends = [], addFriend, removeFriend, onlineFriends = [], invitePlayer, isConnectedMultiplayer = false, spectatableGames = [], requestSpectatableGames, spectateGame, onSpectateFriendMatch, onSpectateDemo, onJoinRoom, timerEnabled, setTimerEnabled, timerSeconds, setTimerSeconds, referralCode = '' }: any) => {
  const [tonConnectUI] = useTonConnectUI();
  const tonAddress = useTonAddress();
  const [currency, setCurrency] = useState<'USD' | 'ETH'>('USD');
  const [betAmount, setBetAmount] = useState(10);
  const [rules, setRules] = useState<'standard' | 'international'>('international'); 
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [tab, setTab] = useState<'play' | 'bonus' | 'historique' | 'coffre' | 'amis'>(initialTab);
  const [balanceMode, setBalanceMode] = useState<'TON' | 'DAMES' | 'Fiat'>('TON');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showTonBetting, setShowTonBetting] = useState(false);
  const [connectedWallets, setConnectedWallets] = useState<{ metamask?: string; ton?: string }>({});
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [roomCodeToJoin, setRoomCodeToJoin] = useState('');
  const [showSpectateModal, setShowSpectateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  
  const [pendingChange, setPendingChange] = useState<{ type: 'theme' | 'skin', value: any } | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const openTelegramFriend = (username: string) => {
    try {
      if (!username) return;
      const clean = username.replace(/^@/, '');
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://royale-dames.vercel.app';
      const text = encodeURIComponent('Rejoins-moi pour une partie de dames sur ROYALE DAMES !');
      const url = `https://t.me/${clean}?text=${text}%0A${encodeURIComponent(baseUrl)}`;
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.openTelegramLink) tg.openTelegramLink(url);
      else window.open(url, '_blank');
    } catch {
      // ignore
    }
  };

  const handleOpenSpectateModal = () => {
    setShowSpectateModal(true);
    const ids = friends.map((f: any) => f.id).filter(Boolean);
    const usernames = friends.map((f: any) => f.username || f.id).filter(Boolean);
    requestSpectatableGames?.(ids, usernames);
  };

  const handleAddFriend = () => {
    addFriend?.(newFriendUsername);
    setNewFriendUsername('');
  };

  const connectMetaMask = async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      alert('Installe MetaMask (metamask.io) pour te connecter.');
      return;
    }
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      setConnectedWallets(prev => ({ ...prev, metamask: accounts[0] }));
      setShowWalletModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const connectTON = async () => {
    try {
      await tonConnectUI?.openModal();
      setShowWalletModal(false);
    } catch (e) {
      console.error(e);
      (window as any).Telegram?.WebApp?.showAlert?.('Erreur ouverture du modal TON');
    }
  };

  useEffect(() => {
    if (tonAddress) {
      setConnectedWallets(prev => ({ ...prev, ton: 'tonconnect' }));
    }
  }, [tonAddress]);

  const s = getStyles(currentTheme);
  const avatarUrl = (user && (user as any).photoUrl) as string | undefined;
  const shortTonAddress = tonAddress ? `${tonAddress.slice(0, 6)}...${tonAddress.slice(-4)}` : null;

  const handleThemeClick = (t: any) => {
    if (t.id === currentTheme.id) return;
    setPendingChange({ type: 'theme', value: t });
  };

  const handleSkinClick = (key: string) => {
    if (key === currentSkin) return;
    setPendingChange({ type: 'skin', value: key });
  };

  const confirmChange = () => {
    if (pendingChange) {
      if (pendingChange.type === 'theme') {
        setTheme(pendingChange.value);
      } else {
        setSkin(pendingChange.value);
      }
      setPendingChange(null);
    }
  };

  const cancelChange = () => {
    setPendingChange(null);
  };

  return (
    <div style={s.main}>
      <div style={{...s.panel, maxWidth: '500px'}}>
        
        {/* TOP BAR */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${currentTheme.textDim}20`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <div style={{width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', background: `linear-gradient(135deg, ${currentTheme.gold}, ${currentTheme.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.2)', boxShadow: `0 0 15px ${currentTheme.gold}40`}}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : (
                <User color="#fff" size={20} />
              )}
            </div>
            <div style={{textAlign: 'left'}}>
              <div style={{fontWeight: '900', fontSize: '15px', color: currentTheme.text}}>{user.name}</div>
              <div style={{color: currentTheme.textDim, fontSize: '10px', fontWeight: 'bold'}}>{wallet.dames?.toLocaleString() ?? 0} $Dames</div>
            </div>
          </div>
          <TactileButton variant="secondary" theme={currentTheme} onClick={onLogout} style={{padding: '8px 12px', minWidth: 'auto', height: 'auto'}}><LogOut size={14} /></TactileButton>
        </div>

        {/* TABS — Jeu, Bonus, Amis (Atelier reste sur la page d'accueil) */}
        <div style={{display: 'flex', gap: '6px', marginBottom: '16px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '14px'}}>
          {[
            {id: 'play', icon: <Play size={14} />, label: 'Jeu'},
            {id: 'bonus', icon: <Crown size={14} />, label: 'Bonus'},
            {id: 'amis', icon: <Users size={14} />, label: 'Amis'},
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{
              flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
              background: tab === t.id ? currentTheme.gold : 'transparent',
              color: tab === t.id ? '#2a1a08' : currentTheme.textDim,
              fontWeight: 'bold', fontSize: '11px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              transition: 'all 0.2s'
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {tab === 'play' && (
          <div style={{animation: 'fadeIn 0.3s'}}>
            {/* Solde Disponible — TON / $Dames / Fiat */}
            <div style={{background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', marginBottom: '16px', border: `1px solid ${currentTheme.textDim}10`}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                <span style={{color: currentTheme.textDim, fontSize: '10px', textTransform: 'uppercase'}}>Solde Disponible</span>
              </div>
              <div style={{display: 'flex', gap: '6px', marginBottom: '12px'}}>
                {(['TON', 'DAMES', 'Fiat'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setBalanceMode(mode === 'DAMES' ? 'DAMES' : mode === 'Fiat' ? 'Fiat' : 'TON')}
                    style={{
                      flex: 1, padding: '6px 8px', borderRadius: '10px', border: 'none',
                      background: balanceMode === mode ? currentTheme.gold : 'rgba(0,0,0,0.3)',
                      color: balanceMode === mode ? '#2a1a08' : currentTheme.textDim,
                      fontWeight: 'bold', fontSize: '10px', cursor: 'pointer', textTransform: 'uppercase',
                      transition: 'all 0.2s'
                    }}
                  >
                    {mode === 'DAMES' ? '$Dames' : mode}
                  </button>
                ))}
              </div>
              {balanceMode === 'TON' && (
                <>
                  <div style={{fontSize: '24px', fontWeight: '900', fontFamily: currentTheme.fontMain, color: currentTheme.text, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                    <Crown size={20} /> {wallet.crypto?.toLocaleString() ?? 0} TON
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px'}}>
                    <TactileButton
                      theme={currentTheme}
                      onClick={() => {
                        if (connectedWallets.ton) {
                          setShowTonBetting(true);
                          setShowWalletModal(true);
                        } else {
                          setShowWalletModal(true);
                        }
                      }}
                      style={{flexDirection: 'column', gap: '6px', padding: '12px 4px', fontSize: '9px', height: 'auto', minHeight: '60px', background: `linear-gradient(135deg, ${currentTheme.success || '#27ae60'} 0%, ${(currentTheme.success || '#27ae60')}dd 100%)`, boxShadow: '0 4px 0 rgba(0,0,0,0.2)'}}
                    >
                      <Plus size={16} /> <span>RECHARGER</span>
                    </TactileButton>
                    <TactileButton variant="secondary" theme={currentTheme} style={{flexDirection: 'column', gap: '6px', padding: '12px 4px', fontSize: '9px', height: 'auto', minHeight: '60px'}}>
                      <ArrowUpRight size={16} /> <span>RETRAIT</span>
                    </TactileButton>
                    <TactileButton
                      variant="secondary"
                      theme={currentTheme}
                      onClick={() => {
                        setShowTonBetting(false);
                        setShowWalletModal(true);
                      }}
                      style={{flexDirection: 'column', gap: '6px', padding: '12px 4px', fontSize: '9px', height: 'auto', minHeight: '60px'}}
                    >
                      <Wallet size={16} /> <span>WALLET</span>
                    </TactileButton>
                  </div>
                </>
              )}
              {balanceMode === 'DAMES' && (
                <>
                  <div style={{fontSize: '24px', fontWeight: '900', fontFamily: currentTheme.fontMain, color: currentTheme.text, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                    <Crown size={20} /> {wallet.dames?.toLocaleString() ?? 0} $Dames
                  </div>
                  <div style={{display: 'flex', gap: '8px'}}>
                    <TactileButton theme={currentTheme} style={{flex: 1, flexDirection: 'column', gap: '6px', padding: '12px 4px', fontSize: '10px', height: 'auto', minHeight: '60px'}}>
                      <span>CONVERTIR</span>
                    </TactileButton>
                  </div>
                </>
              )}
              {balanceMode === 'Fiat' && (
                <>
                  <div style={{fontSize: '24px', fontWeight: '900', fontFamily: currentTheme.fontMain, color: currentTheme.text, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                    ${wallet.usd.toLocaleString()} XOF
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                    <TactileButton theme={currentTheme} onClick={() => setShowDepositModal(true)} style={{flexDirection: 'column', gap: '6px', padding: '12px 4px', fontSize: '9px', height: 'auto', minHeight: '60px', background: `linear-gradient(135deg, ${currentTheme.success || '#27ae60'} 0%, ${(currentTheme.success || '#27ae60')}dd 100%)`, boxShadow: '0 4px 0 rgba(0,0,0,0.2)'}}>
                      <Plus size={16} /> <span>RECHARGER</span>
                    </TactileButton>
                    <TactileButton variant="secondary" theme={currentTheme} style={{flexDirection: 'column', gap: '6px', padding: '12px 4px', fontSize: '9px', height: 'auto', minHeight: '60px'}}>
                      <ArrowUpRight size={16} /> <span>RETRAIT</span>
                    </TactileButton>
                  </div>
                </>
              )}
            </div>

            {/* Mise */}
            <div style={{display: 'flex', gap: '10px', marginBottom: '16px'}}>
              <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '12px'}}>
                <TactileButton variant="secondary" theme={currentTheme} onClick={() => setBetAmount(Math.max(5, betAmount - 5))} style={{padding: '8px', minWidth: '32px', height: '32px'}}><Minus size={14} /></TactileButton>
                <div style={{flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '16px', fontFamily: currentTheme.fontMain}}>${betAmount}</div>
                <TactileButton variant="secondary" theme={currentTheme} onClick={() => setBetAmount(betAmount + 5)} style={{padding: '8px', minWidth: '32px', height: '32px'}}><Plus size={14} /></TactileButton>
              </div>
            </div>

            {/* Niveau IA (Solo) */}
            <div style={{marginBottom: '16px'}}>
              <div style={{fontSize: '10px', textTransform: 'uppercase', color: currentTheme.textDim, marginBottom: '6px', fontWeight: 'bold'}}>Niveau IA (Solo)</div>
              <div style={{display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px'}}>
                {([['easy', 'Novice'], ['medium', 'Pro'], ['hard', 'Master']] as [AIDifficulty, string][]).map(([key, label]) => (
                  <button key={key} onClick={() => setAiDifficulty(key)} style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                    background: aiDifficulty === key ? currentTheme.gold : 'transparent',
                    color: aiDifficulty === key ? '#2a1a08' : currentTheme.textDim,
                    fontWeight: 'bold', fontSize: '10px', cursor: 'pointer', textTransform: 'uppercase',
                    transition: 'all 0.2s'
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px'}}>
              <TactileButton theme={currentTheme} onClick={() => onPlay('solo', betAmount, currency, rules, aiDifficulty)} style={{flexDirection: 'column', padding: '16px 10px', gap: '8px'}}>
                <Monitor size={24} /><span>SOLO</span>
              </TactileButton>
              <TactileButton theme={currentTheme} onClick={() => onPlay('multi', betAmount, currency, rules)} style={{flexDirection: 'column', padding: '16px 10px', gap: '8px'}}>
                <Globe size={24} /><span>LIGNE</span>
              </TactileButton>
            </div>

            <TactileButton theme={currentTheme} onClick={() => onPlay('friend', betAmount, currency, rules)} style={{width: '100%', gap: '8px', marginBottom: '12px'}}>
              <UserPlus size={18} /><span>PARTIE PRIVEE</span>
            </TactileButton>

            <TactileButton variant="secondary" theme={currentTheme} onClick={handleOpenSpectateModal} style={{width: '100%', padding: '12px', color: currentTheme.gold}}>
              <Eye size={16} /> <span>REGARDER UNE PARTIE (LIVE)</span>
            </TactileButton>

            {/* Modal spectateur : matches amis ou démo */}
            {showSpectateModal && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.9)', zIndex: 120,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
              }}>
                <div style={{
                  background: currentTheme.panel || 'rgba(26,28,36,0.95)',
                  borderRadius: 16,
                  padding: 24,
                  maxWidth: 400,
                  width: '100%',
                  border: `1px solid ${currentTheme.gold}`,
                  maxHeight: '80vh',
                  overflow: 'auto'
                }}>
                  <h3 style={{fontFamily: currentTheme.fontMain, color: currentTheme.gold, marginBottom: 8, fontSize: 18}}>Assister à un duel</h3>
                  <p style={{color: currentTheme.textDim, fontSize: 12, marginBottom: 20}}>
                    Sélectionne une partie où un ami est en train de jouer.
                  </p>
                  {spectatableGames.length === 0 ? (
                    <div style={{marginBottom: 20}}>
                      <div style={{color: currentTheme.textDim, fontSize: 14, padding: 20, textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 10}}>
                        Aucun match ami en cours
                      </div>
                      <p style={{color: currentTheme.textDim, fontSize: 12, marginTop: 12, textAlign: 'center'}}>
                        Ou regarde une démo IA vs IA
                      </p>
                      <button
                        onClick={() => { setShowSpectateModal(false); onSpectateDemo?.(); }}
                        style={{
                          width: '100%', padding: 14, marginTop: 8, borderRadius: 10,
                          background: currentTheme.gold, color: '#2a1a08', fontWeight: 'bold',
                          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                        }}
                      >
                        <Tv size={18} /> Voir une démo
                      </button>
                    </div>
                  ) : (
                    <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                      {spectatableGames.map((g: any) => (
                        <button
                          key={g.gameId}
                          onClick={() => { setShowSpectateModal(false); onSpectateFriendMatch?.(g.gameId); }}
                          style={{
                            padding: 14, borderRadius: 10, border: `1px solid ${currentTheme.textDim}40`,
                            background: 'rgba(0,0,0,0.2)', color: currentTheme.text, textAlign: 'left',
                            cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4
                          }}
                        >
                          <span style={{fontWeight: 'bold', fontSize: 14}}>
                            @{(g.players?.[0]?.username || 'Joueur1')} vs @{(g.players?.[1]?.username || 'Joueur2')}
                          </span>
                          {g.betAmount != null && g.betAmount > 0 && (
                            <span style={{fontSize: 11, color: currentTheme.textDim}}>
                              Mise : {g.betAmount} {g.betCurrency || 'USD'}
                            </span>
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => { setShowSpectateModal(false); onSpectateDemo?.(); }}
                        style={{
                          padding: 10, borderRadius: 8, border: `1px dashed ${currentTheme.textDim}`,
                          background: 'transparent', color: currentTheme.textDim, fontSize: 12,
                          cursor: 'pointer', marginTop: 8
                        }}
                      >
                        Ou voir une démo IA
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setShowSpectateModal(false)}
                    style={{
                      width: '100%', padding: 12, marginTop: 16, borderRadius: 10,
                      background: 'rgba(255,255,255,0.1)', border: `1px solid ${currentTheme.textDim}`, color: currentTheme.text,
                      cursor: 'pointer'
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {tab === 'bonus' && (() => {
          const DAILY_KEY = `royale-dames-daily-${user?.id || 'anon'}`;
          const stored = (() => { try { return JSON.parse(localStorage.getItem(DAILY_KEY) || '{}'); } catch { return {}; } })();
          const today = new Date().toDateString();
          const lastClaim = stored.lastClaim || '';
          const streak = stored.streak || 0;
          const alreadyClaimed = lastClaim === today;
          const DAILY_REWARDS = [10, 20, 30, 50, 75, 100, 200];

          const claimDaily = () => {
            if (alreadyClaimed) return;
            const newStreak = (lastClaim === new Date(Date.now() - 86400000).toDateString()) ? Math.min(streak + 1, 6) : 0;
            const reward = DAILY_REWARDS[newStreak];
            localStorage.setItem(DAILY_KEY, JSON.stringify({ lastClaim: today, streak: newStreak }));
            setWallet?.(prev => ({ ...prev, dames: (prev.dames || 0) + reward }));
            alert(`+${reward} $Dames collectes !`);
          };

          const QUESTS = [
            { id: 'q1', title: 'Premiere victoire', desc: 'Gagne 1 partie', reward: 100, check: () => (wallet.dames || 0) > 500 },
            { id: 'q2', title: 'Joueur assidu', desc: 'Joue 3 parties', reward: 50, check: () => false },
            { id: 'q3', title: 'Invite un ami', desc: 'Cree une partie privee', reward: 75, check: () => false },
            { id: 'q4', title: 'Spectateur', desc: 'Regarde une partie en direct', reward: 30, check: () => false },
            { id: 'q5', title: 'Maitre stratege', desc: 'Bats le Bot Master', reward: 200, check: () => false },
          ];

          return (
            <div style={{animation: 'fadeIn 0.3s'}}>
              {/* DAILY CHECK-IN */}
              <div style={{background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', marginBottom: '16px', border: `1px solid ${currentTheme.gold}30`}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px'}}>
                  <div style={{fontSize: '14px', fontWeight: '900', color: currentTheme.text, fontFamily: currentTheme.fontMain}}>Connexion Quotidienne</div>
                  <div style={{fontSize: '10px', color: currentTheme.gold, fontWeight: 'bold'}}>Jour {Math.min(streak + 1, 7)}/7</div>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '14px'}}>
                  {DAILY_REWARDS.map((reward, i) => {
                    const isPast = i < streak || (i === streak && alreadyClaimed);
                    const isCurrent = i === streak && !alreadyClaimed;
                    return (
                      <div key={i} style={{
                        padding: '6px 2px', borderRadius: '10px', textAlign: 'center',
                        background: isPast ? `${currentTheme.gold}30` : (isCurrent ? `${currentTheme.gold}15` : 'rgba(0,0,0,0.2)'),
                        border: isCurrent ? `2px solid ${currentTheme.gold}` : (isPast ? `1px solid ${currentTheme.gold}40` : '1px solid rgba(255,255,255,0.05)'),
                        opacity: isPast ? 0.6 : 1,
                        position: 'relative'
                      }}>
                        <div style={{fontSize: '8px', color: currentTheme.textDim, fontWeight: 'bold', marginBottom: '2px'}}>J{i + 1}</div>
                        <div style={{fontSize: '10px', fontWeight: '900', color: isPast ? currentTheme.textDim : currentTheme.gold}}>
                          {isPast ? <Check size={12} /> : `+${reward}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <TactileButton
                  theme={currentTheme}
                  disabled={alreadyClaimed}
                  onClick={claimDaily}
                  style={{
                    width: '100%', padding: '12px',
                    background: alreadyClaimed ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${currentTheme.gold}, ${currentTheme.accent})`,
                    opacity: alreadyClaimed ? 0.5 : 1
                  }}
                >
                  {alreadyClaimed ? 'Deja collecte aujourd\'hui' : `Collecter +${DAILY_REWARDS[Math.min(streak, 6)]} $Dames`}
                </TactileButton>
              </div>

              {/* QUETES */}
              <div style={{background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', border: `1px solid rgba(255,255,255,0.05)`}}>
                <div style={{fontSize: '14px', fontWeight: '900', color: currentTheme.text, fontFamily: currentTheme.fontMain, marginBottom: '12px'}}>Quetes</div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {QUESTS.map(q => {
                    const done = q.check();
                    return (
                      <div key={q.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px', borderRadius: '12px',
                        background: done ? `${currentTheme.gold}10` : 'rgba(0,0,0,0.15)',
                        border: done ? `1px solid ${currentTheme.gold}30` : '1px solid rgba(255,255,255,0.05)',
                        opacity: done ? 0.6 : 1
                      }}>
                        <div style={{flex: 1}}>
                          <div style={{fontSize: '12px', fontWeight: '700', color: currentTheme.text, marginBottom: '2px'}}>{q.title}</div>
                          <div style={{fontSize: '10px', color: currentTheme.textDim}}>{q.desc}</div>
                        </div>
                        <div style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                          background: done ? currentTheme.gold : 'rgba(0,0,0,0.3)',
                          color: done ? '#1a1a1a' : currentTheme.gold,
                          display: 'flex', alignItems: 'center', gap: '4px',
                          whiteSpace: 'nowrap'
                        }}>
                          {done ? <Check size={12} /> : <Crown size={10} />}
                          {done ? 'Fait' : `+${q.reward}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {tab === 'historique' && (
          <div style={{textAlign: 'left', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px'}}>
             <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: `1px solid ${currentTheme.textDim}`, paddingBottom: '6px'}}>
                <History size={18} color={currentTheme.gold} />
                <h3 style={{margin: 0, fontFamily: currentTheme.fontMain, color: currentTheme.gold, fontSize: '16px'}}>Derniers Matchs</h3>
             </div>
             
             <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
               {history.length === 0 ? (
                 <div style={{textAlign: 'center', color: currentTheme.textDim, fontSize: '13px', fontStyle: 'italic', padding: '20px'}}>
                   Aucune partie enregistrée.
                 </div>
               ) : (
                 history.map((game: any) => (
                   <div key={game.id} style={{
                       display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                       padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px',
                       borderLeft: `4px solid ${game.result === 'win' ? currentTheme.success : (game.result === 'draw' ? currentTheme.textDim : '#d63031')}`,
                       boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                   }}>
                      <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                         <div style={{
                           width: '32px', height: '32px', borderRadius: '50%',
                           background: game.result === 'win' ? `${currentTheme.success}20` : (game.result === 'draw' ? 'rgba(255,255,255,0.1)' : '#d6303120'),
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           border: `1px solid ${game.result === 'win' ? currentTheme.success : (game.result === 'draw' ? currentTheme.textDim : '#d63031')}`
                         }}>
                            {game.result === 'win' ? <Trophy size={16} color={currentTheme.success} /> : (game.result === 'draw' ? <Minus size={16} color={currentTheme.textDim} /> : <X size={16} color="#d63031" />)}
                         </div>
                         <div>
                            <div style={{fontSize: '13px', fontWeight: 'bold', color: currentTheme.text}}>
                              {game.mode}
                            </div>
                            <div style={{fontSize: '11px', color: currentTheme.textDim}}>
                              {game.date}
                            </div>
                         </div>
                      </div>
                      
                      <div style={{textAlign: 'right'}}>
                        <div style={{
                          fontSize: '14px', 
                          fontWeight: 'bold', 
                          fontFamily: currentTheme.fontMain,
                          color: game.result === 'win' ? currentTheme.success : (game.result === 'draw' ? currentTheme.textDim : currentTheme.textDim)
                        }}>
                          {game.result === 'win' ? '+' : (game.result === 'lose' ? '-' : '')}
                          {game.currency === 'USD' ? '$' : 'Ξ'}
                          {game.amount}
                        </div>
                        <div style={{fontSize: '10px', color: currentTheme.textDim, textTransform: 'uppercase'}}>
                          {game.result === 'win' ? 'GAIN' : (game.result === 'lose' ? 'PERTE' : 'EGALITÉ')}
                        </div>
                      </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        )}

        {tab === 'amis' && (
          <div style={{textAlign: 'left'}}>
            <h3 style={{fontFamily: currentTheme.fontMain, color: currentTheme.gold, borderBottom: `1px solid ${currentTheme.textDim}`, paddingBottom: '6px', marginBottom: '12px', fontSize: '16px'}}>👥 Mes amis</h3>
            <p style={{color: currentTheme.textDim, fontSize: '12px', marginBottom: '16px'}}>Ajoute des amis par leur @username pour les inviter à jouer.</p>

            {/* Inviter amis (parrainage) — partager le jeu, gagner $DAMES, invité ajouté en ami */}
            {referralCode && (
              <div style={{marginBottom: '20px', padding: '12px', background: 'linear-gradient(135deg, rgba(197,160,89,0.15) 0%, rgba(0,0,0,0.2) 100%)', borderRadius: '10px', border: `1px solid ${currentTheme.gold}40`}}>
                <div style={{fontSize: '11px', color: currentTheme.gold, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px'}}>🎁 Inviter des amis (parrainage)</div>
                <p style={{color: currentTheme.textDim, fontSize: '12px', marginBottom: '10px'}}>Partage le lien à des amis qui ne connaissent pas le jeu. Quand ils cliquent, le bot Telegram s'ouvre puis le jeu (ils sont connectés). Tu gagnes <strong style={{color: currentTheme.gold}}>50 $DAMES</strong> et ils sont ajoutés à ta liste d'amis.</p>
                <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center'}}>
                  <input
                    readOnly
                    value={(() => { const bot = (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME; return bot ? `https://t.me/${bot}?start=ref_${referralCode}` : (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname || ''}?ref=${referralCode}` : `?ref=${referralCode}`); })()}
                    style={{flex: '1 1 120px', minWidth: 0, padding: '8px 10px', borderRadius: '8px', border: `1px solid ${currentTheme.textDim}40`, background: 'rgba(0,0,0,0.2)', color: currentTheme.text, fontSize: '12px', fontFamily: 'monospace'}}
                  />
                  <button
                    onClick={() => {
                      const bot = (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME;
                      const url = bot ? `https://t.me/${bot}?start=ref_${referralCode}` : (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname || ''}?ref=${referralCode}` : '');
                      if (url && navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(() => (window as any).Telegram?.WebApp?.showAlert?.('Lien copié !'));
                      else (window as any).Telegram?.WebApp?.showAlert?.(url || '');
                    }}
                    style={{padding: '8px 12px', borderRadius: '8px', border: 'none', background: currentTheme.gold, color: '#2a1a08', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0}}
                  >
                    <Copy size={14} /> Copier
                  </button>
                  <button
                    onClick={() => {
                      const bot = (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME;
                      const url = bot ? `https://t.me/${bot}?start=ref_${referralCode}` : (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname || ''}?ref=${referralCode}` : '');
                      const text = encodeURIComponent('Joue aux dames avec moi sur Royale Dames ! 🎮');
                      const tg = (window as any).Telegram?.WebApp;
                      if (tg?.switchInlineQuery) tg.switchInlineQuery?.(text + ' ' + url, ['users', 'groups', 'channels']);
                      else if (navigator.share) navigator.share({ title: 'Royale Dames', text: text.replace(/%20/g, ' '), url }).catch(() => {});
                      else if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(() => (window as any).Telegram?.WebApp?.showAlert?.('Lien copié !'));
                    }}
                    style={{padding: '8px 12px', borderRadius: '8px', border: `1px solid ${currentTheme.gold}`, background: 'transparent', color: currentTheme.gold, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0}}
                  >
                    <Share2 size={14} /> Partager
                  </button>
                </div>
              </div>
            )}

            {/* Rejoindre une salle par code */}
            <div style={{marginBottom: '20px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: `1px solid ${currentTheme.textDim}30`, minWidth: 0, overflow: 'hidden'}}>
              <div style={{fontSize: '11px', color: currentTheme.textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px'}}>Rejoindre une salle privée</div>
              <div style={{display: 'flex', gap: '8px', minWidth: 0, flexWrap: 'wrap'}}>
                <input
                  type="text"
                  placeholder="Code (ex: 8USIJG)"
                  value={roomCodeToJoin}
                  onChange={e => setRoomCodeToJoin(e.target.value.toUpperCase().trim())}
                  onKeyDown={e => e.key === 'Enter' && onJoinRoom?.(roomCodeToJoin)}
                  style={{
                    flex: '1 1 80px', minWidth: 0, padding: '10px 12px', borderRadius: '10px', border: `1px solid ${currentTheme.textDim}40`,
                    background: 'rgba(0,0,0,0.2)', color: currentTheme.text, fontSize: '14px', fontFamily: 'monospace', letterSpacing: '2px'
                  }}
                />
                <button
                  onClick={() => onJoinRoom?.(roomCodeToJoin)}
                  disabled={!roomCodeToJoin || roomCodeToJoin.length < 4}
                  style={{
                    flexShrink: 0, padding: '10px 12px', borderRadius: '10px', border: 'none', background: currentTheme.gold, color: '#2a1a08',
                    fontWeight: 'bold', cursor: roomCodeToJoin?.length >= 4 ? 'pointer' : 'not-allowed', opacity: roomCodeToJoin?.length >= 4 ? 1 : 0.6,
                    display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontSize: '13px'
                  }}
                >
                  <UserPlus size={16} /> Rejoindre
                </button>
              </div>
            </div>

            <div style={{display: 'flex', gap: '8px', marginBottom: '20px', minWidth: 0}}>
              <input
                type="text"
                placeholder="@username"
                value={newFriendUsername}
                onChange={e => setNewFriendUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                style={{
                  flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: '10px', border: `1px solid ${currentTheme.textDim}40`,
                  background: 'rgba(0,0,0,0.2)', color: currentTheme.text, fontSize: '14px'
                }}
              />
              <button
                onClick={handleAddFriend}
                style={{
                  padding: '10px 14px', borderRadius: '10px', border: 'none', background: currentTheme.gold, color: '#2a1a08',
                  fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0
                }}
              >
                <UserPlus size={18} /> Ajouter
              </button>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px'}}>
              {friends.length === 0 ? (
                <div style={{color: currentTheme.textDim, fontSize: '13px', fontStyle: 'italic', padding: '20px', textAlign: 'center'}}>
                  Aucun ami. Ajoute un @username ci-dessus.
                </div>
              ) : (
                friends.map(f => (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', gap: '8px', minWidth: 0,
                    background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: `1px solid ${currentTheme.textDim}30`
                  }}>
                    <span style={{color: currentTheme.text, fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flexShrink: 1}}>@{f.username}</span>
                    <div style={{display: 'flex', gap: '6px', flexShrink: 0, minWidth: 0}}>
                      {(() => {
                        const onlineFriend = onlineFriends?.find((of: any) => 
                          of.username?.toLowerCase() === f.username?.toLowerCase() || of.id === f.id
                        );
                        const isOnline = !!onlineFriend && isConnectedMultiplayer;
                        return isOnline ? (
                          <button
                            onClick={() => invitePlayer?.(onlineFriend.id, betAmount, currency === 'ETH' ? 'TON' : undefined)}
                            style={{
                              padding: '6px 10px', borderRadius: '8px', border: 'none', background: currentTheme.success, color: 'white',
                              fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
                            }}
                          >
                            <Play size={12} /> Inviter
                          </button>
                        ) : (
                          <button
                            onClick={() => openTelegramFriend(f.username)}
                            style={{
                              padding: '6px 10px', borderRadius: '8px', border: 'none', background: currentTheme.gold, color: '#2a1a08',
                              fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
                            }}
                          >
                            <Play size={12} /> Inviter
                          </button>
                        );
                      })()}
                      <button
                        onClick={() => removeFriend?.(f.id)}
                        style={{
                          padding: '6px', borderRadius: '8px', border: `1px solid ${currentTheme.textDim}60`, background: 'transparent',
                          color: currentTheme.textDim, cursor: 'pointer', flexShrink: 0
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'coffre' && (
          <div style={{textAlign: 'left'}}>
            <h3 style={{fontFamily: currentTheme.fontMain, color: currentTheme.gold, borderBottom: `1px solid ${currentTheme.textDim}`, paddingBottom: '6px', marginBottom: '12px', fontSize: '16px'}}>Coffre sécurisé</h3>
            <p style={{color: currentTheme.textDim, fontSize: '12px', marginBottom: '20px'}}>Gère ton portefeuille et recharge ton solde.</p>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px'}}>
              <TactileButton theme={currentTheme} onClick={() => setShowDepositModal(true)} style={{flexDirection: 'column', gap: '6px', padding: '14px 4px', fontSize: '10px', height: 'auto', minHeight: '60px', background: `linear-gradient(135deg, ${currentTheme.success || '#27ae60'}, ${(currentTheme.success || '#27ae60')}dd)`, boxShadow: '0 4px 0 rgba(0,0,0,0.2)'}}>
                <Plus size={18} /> <span>RECHARGER</span>
              </TactileButton>
              <TactileButton theme={currentTheme} variant="secondary" style={{flexDirection: 'column', gap: '6px', padding: '14px 4px', fontSize: '10px', height: 'auto', minHeight: '60px'}}>
                <ArrowUpRight size={18} /> <span>RETRAIT</span>
              </TactileButton>
              <TactileButton theme={currentTheme} onClick={() => setShowWalletModal(true)} variant="secondary" style={{flexDirection: 'column', gap: '6px', padding: '14px 4px', fontSize: '10px', height: 'auto', minHeight: '60px'}}>
                <Wallet size={18} /> <span>WALLET</span>
              </TactileButton>
            </div>
            <div style={{padding: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '12px'}}>
              <div style={{fontSize: '11px', color: currentTheme.textDim, textTransform: 'uppercase', marginBottom: '4px'}}>Historique rapide</div>
              <div style={{fontSize: '12px', color: currentTheme.text, opacity: 0.6, fontStyle: 'italic'}}>Aucune transaction récente</div>
            </div>
            <div style={{padding: '12px', background: 'rgba(197, 160, 89, 0.1)', borderRadius: '10px', fontSize: '11px', color: currentTheme.textDim, fontStyle: 'italic'}}>
              Paiements sécurisés via Orange Money et MTN MoMo.
            </div>
          </div>
        )}

      </div>

      {/* DEPOSIT MODAL */}
      {showDepositModal && (
        <DepositModal
          theme={currentTheme}
          user={user}
          onClose={() => setShowDepositModal(false)}
          onSuccess={(amount: number) => {
            setShowDepositModal(false);
            setWallet?.(prev => ({ ...prev, usd: (prev.usd || 0) + amount }));
          }}
        />
      )}

      {/* WALLET CONNECT MODAL */}
      {showWalletModal && !showTonBetting && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 115,
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{...s.panel, maxWidth: '340px', border: `1px solid ${currentTheme.gold}`, animation: 'scaleIn 0.3s', position: 'relative'}}>
            <button onClick={() => setShowWalletModal(false)} style={{position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: currentTheme.textDim, cursor: 'pointer'}}><X size={18} /></button>

            {connectedWallets.ton ? (
              <>
                <div style={{width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #0098ea, #0077c8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(0,152,234,0.4)'}}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user?.name || 'Profil'} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    <User size={28} color="#fff" />
                  )}
                </div>
                <h3 style={{margin: '0 0 8px 0', fontFamily: currentTheme.fontMain, color: currentTheme.text, fontSize: '18px', textAlign: 'center'}}>Profil crypto</h3>
                <p style={{color: currentTheme.textDim, marginBottom: '16px', fontSize: '12px', textAlign: 'center'}}>
                  Wallet TON connecté pour les paris et rechargements.
                </p>
                <div style={{marginBottom: '12px', padding: '10px', borderRadius: '10px', background: 'rgba(0,152,234,0.08)', fontSize: '12px', color: currentTheme.text}}>
                  <div style={{fontWeight: 'bold', marginBottom: 4}}>Adresse TON</div>
                  <div style={{fontFamily: 'monospace', fontSize: '11px', opacity: 0.9}}>
                    {shortTonAddress || 'Adresse non disponible'}
                  </div>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', marginBottom: '16px'}}>
                  <div style={{padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)'}}>
                    <div style={{color: currentTheme.textDim, marginBottom: 4}}>Solde TON</div>
                    <div style={{fontWeight: 'bold'}}>{wallet.crypto?.toLocaleString() ?? 0} TON</div>
                  </div>
                  <div style={{padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)'}}>
                    <div style={{color: currentTheme.textDim, marginBottom: 4}}>$Dames</div>
                    <div style={{fontWeight: 'bold'}}>{wallet.dames?.toLocaleString() ?? 0} $Dames</div>
                  </div>
                  <div style={{padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)'}}>
                    <div style={{color: currentTheme.textDim, marginBottom: 4}}>Amis ajoutés</div>
                    <div style={{fontWeight: 'bold'}}>{friends?.length ?? 0}</div>
                  </div>
                </div>
                <TactileButton
                  theme={currentTheme}
                  onClick={() => { setShowWalletModal(false); }}
                  style={{width: '100%', padding: '12px'}}
                >
                  Fermer
                </TactileButton>
              </>
            ) : (
              <>
                <div style={{width: '60px', height: '60px', margin: '0 auto 16px', borderRadius: '50%', background: 'linear-gradient(135deg, #0098ea, #0077c8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(0,152,234,0.4)'}}>
                  <Wallet size={28} color="#fff" />
                </div>
                <h3 style={{margin: '0 0 8px 0', fontFamily: currentTheme.fontMain, color: currentTheme.text, fontSize: '18px', textAlign: 'center'}}>Connecter Wallet</h3>
                <p style={{color: currentTheme.textDim, marginBottom: '24px', fontSize: '12px', textAlign: 'center'}}>Connectez votre portefeuille TON pour les paris en crypto.</p>
                <TactileButton
                  theme={currentTheme}
                  onClick={connectTON}
                  style={{
                    width: '100%', padding: '16px',
                    background: 'linear-gradient(135deg, #0098ea 0%, #0077c8 100%)',
                    boxShadow: '0 4px 0 #005a8a, 0 8px 20px rgba(0,152,234,0.3)',
                    color: '#fff', fontSize: '14px', gap: '10px'
                  }}
                >
                  <Wallet size={20} />
                  {connectedWallets.ton ? 'Wallet Connecte' : 'Connecter TON Wallet'}
                </TactileButton>
                {connectedWallets.ton && (
                  <div style={{marginTop: '12px', padding: '10px', background: 'rgba(0,152,234,0.1)', borderRadius: '10px', textAlign: 'center', fontSize: '11px', color: '#0098ea', fontWeight: 'bold'}}>
                    Wallet connecte avec succes
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TON BETTING MODAL */}
      {showWalletModal && showTonBetting && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 115,
          backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowTonBetting(false)} style={{
              position: 'absolute', top: '-36px', right: 0,
              background: 'transparent', border: 'none', color: currentTheme.textDim,
              cursor: 'pointer', fontSize: '12px'
            }}>← Retour</button>
            <Suspense fallback={<div style={{ color: currentTheme.textDim, padding: 24 }}>Chargement...</div>}>
              <TonBettingPanel
                gameId={`demo-${Date.now()}`}
                theme={currentTheme}
                onBetPlaced={() => { setShowTonBetting(false); setShowWalletModal(false); }}
                onCancel={() => setShowTonBetting(false)}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {pendingChange && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 120,
          backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{...s.panel, maxWidth: '350px', border: `1px solid ${currentTheme.gold}`}}>
            <h3 style={{margin: '0 0 12px 0', fontFamily: currentTheme.fontMain, color: currentTheme.gold, fontSize: '18px'}}>
              Appliquer ces changements ?
            </h3>
            <p style={{color: currentTheme.textDim, marginBottom: '20px', fontSize: '14px'}}>
              {pendingChange.type === 'theme' 
                ? `Passer au thème "${pendingChange.value.name}" ?`
                : `Utiliser la finition "${(PIECE_SKINS as any)[pendingChange.value].name}" ?`
              }
            </p>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
               <button 
                 onClick={cancelChange} 
                 style={{...s.secondaryButton, marginTop: 0, flex: 1}}
               >
                 Non
               </button>
               <TactileButton 
                 theme={currentTheme}
                 onClick={confirmChange} 
                 style={{marginTop: 0, flex: 1, padding: '10px'}}
               >
                 Oui
               </TactileButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// 3. GAME LOBBY - Attente réelle d'un adversaire (pas de démarrage vs IA)
const GameLobby = ({ onMatchFound, onCancel, theme, isConnected = false, searchForMatch, cancelSearch, betAmount = 0, currency = 'USD' }: any) => {
  const s = getStyles(theme);
  const betCurrency = currency === 'ETH' ? 'TON' : undefined;

  useEffect(() => {
    if (isConnected) searchForMatch?.(betAmount, betCurrency);
    return () => cancelSearch?.(betAmount, betCurrency);
  }, [isConnected, betAmount, betCurrency]);

  return (
    <div style={s.main}>
      <div style={s.panel}>
        <div style={{margin: '20px auto', width: '50px', height: '50px', border: `3px solid ${theme.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}} />
        <h2 style={{fontFamily: theme.fontMain, color: theme.gold, fontSize: '20px'}}>Recherche d'adversaire...</h2>
        {isConnected ? (
          <p style={{color: theme.textDim, fontSize: '12px', marginBottom: '20px'}}>En attente d'un adversaire réel. La partie ne démarrera que lorsqu'un autre joueur sera trouvé.</p>
        ) : (
          <p style={{color: theme.textDim, fontSize: '12px', marginBottom: '8px'}}>Serveur multijoueur non connecté.</p>
        )}
        <p style={{color: theme.textDim, fontSize: '11px', fontStyle: 'italic', marginBottom: '20px'}}>Pour jouer vs l'IA, annule et choisis le mode SOLO.</p>
        <button onClick={onCancel} style={s.secondaryButton}>Annuler</button>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// 3.5 FRIEND LOBBY - Salle par code (pas de démarrage vs IA)
const FriendLobby = ({ onMatchFound, onCancel, theme, code: guestCode, serverCode, createRoom, joinRoom, betAmount = 0, currency = 'USD', friends = [], user }: any) => {
  const s = getStyles(theme);
  const isGuest = !!guestCode;
  const code = isGuest ? guestCode : serverCode;
  const [copied, setCopied] = useState(false);
  const betCurrency = currency === 'ETH' ? 'TON' : undefined;

  useEffect(() => {
    if (isGuest) {
      joinRoom?.(guestCode);
    } else {
      createRoom?.(betAmount, betCurrency);
    }
  }, [isGuest, guestCode, betAmount, betCurrency]);

  const telegramBot = (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://royale-dames.vercel.app';
  const joinUrl = code ? (telegramBot ? `https://t.me/${telegramBot}?start=room_${code}` : `${baseUrl}?room=${code}`) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const text = encodeURIComponent(`Rejoins-moi pour une partie de dames ! Code : ${code}\n${joinUrl}`);
      const url = `https://t.me/share/url?url=${encodeURIComponent(joinUrl)}&text=${text}`;
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(url);
        return;
      }
      if ((navigator as any).share) {
        await (navigator as any).share({
          title: 'Royale Dames - Duel',
          text: `Rejoins-moi pour une partie ! Code : ${code}\n${joinUrl}`,
          url: joinUrl
        });
        return;
      }
      handleCopy();
    } catch (err) {
      console.log('Error sharing', err);
      handleCopy();
    }
  };

  const shareToTelegram = (username?: string) => {
    const text = encodeURIComponent(`Rejoins-moi pour une partie de dames ! Code : ${code}\n${joinUrl}`);
    const url = username
      ? `https://t.me/${username}?text=${text}`
      : `https://t.me/share/url?url=${encodeURIComponent(joinUrl)}&text=${text}`;
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.openTelegramLink?.(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div style={s.main}>
      <div style={s.panel}>
        <h2 style={{fontFamily: theme.fontMain, color: theme.gold, marginBottom: '6px', fontSize: '20px'}}>
          {isGuest ? 'REJOINDRE LA SALLE' : 'SALLE PRIVÉE'}
        </h2>
        {isGuest ? (
          <p style={{color: theme.textDim, marginBottom: '24px', fontSize: '13px'}}>Connexion à la salle en cours. La partie démarrera quand l'hôte sera prêt.</p>
        ) : (
          <p style={{color: theme.textDim, marginBottom: '24px', fontSize: '13px'}}>Partage ce code avec ton ami pour commencer. La partie ne démarre que lorsque ton ami rejoint.</p>
        )}
        
        {code && (
          <div style={{
             background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', 
             border: `1px solid ${theme.gold}`, marginBottom: '20px',
             display: 'flex', flexDirection: 'column', gap: '6px'
          }}>
             <div style={{fontSize: '24px', fontWeight: '900', letterSpacing: '4px', color: 'white', fontFamily: 'monospace'}}>
               {code}
             </div>
             <div style={{fontSize: '10px', color: theme.textDim}}>CODE DE LA SALLE</div>
          </div>
        )}

        {!isGuest && code && (
          <div style={{display: 'flex', gap: '10px', marginBottom: friends.length ? '16px' : '24px'}}>
             <button onClick={handleCopy} style={{...s.secondaryButton, flex: 1, marginTop: 0, background: copied ? theme.success : 'rgba(0,0,0,0.2)', color: copied ? '#fff' : theme.textDim, border: copied ? '1px solid transparent' : s.secondaryButton.border}}>
               {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copié !' : 'Copier'}
             </button>
             <button onClick={handleShare} style={{...s.secondaryButton, flex: 1, marginTop: 0}}>
               <Share2 size={16} /> Partager
             </button>
          </div>
        )}

        {!code && !isGuest && (
          <div style={{marginBottom: '20px', color: theme.textDim, fontSize: '13px'}}>Création de la salle...</div>
        )}

        {friends.length > 0 && !isGuest && (
          <div style={{marginBottom: '20px'}}>
            <div style={{fontSize: '11px', color: theme.textDim, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px'}}>Inviter un ami de ma liste</div>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
              {friends.map((f: { id: string; username: string }) => (
                <button
                  key={f.id}
                  onClick={() => shareToTelegram(f.username)}
                  style={{
                    padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.gold}60`, background: 'rgba(0,0,0,0.2)',
                    color: theme.gold, fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <MessageSquare size={14} /> @{f.username}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: theme.textDim, fontSize: '12px', fontStyle: 'italic'}}>
           <div style={{width: '8px', height: '8px', borderRadius: '50%', background: theme.accent, animation: 'pulse 1.5s infinite'}} />
           En attente de l'ami...
        </div>

        <button onClick={onCancel} style={{...s.secondaryButton, marginTop: '30px', width: '100%'}}>Annuler</button>
      </div>
      <style>{`@keyframes pulse { 0% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.5; transform: scale(1); } }`}</style>
    </div>
  );
};

// 4. GAME BOARD (The core)
const BoardGame = ({ mode, bet, currency, rules, onGameOver, user, isSpectator = false, theme, skin, timerEnabled = true, initialTimerSeconds = 300, multiplayerBoard, multiplayerTurn, onMultiplayerMove, multiplayerMyColor, multiplayerResign, multiplayerPlayers, difficulty = 'medium' as AIDifficulty }: any) => {
  const isMultiplayer = !!(multiplayerBoard && onMultiplayerMove);
  const [board, setBoard] = useState<Board>(multiplayerBoard || INITIAL_BOARD);
  const [turn, setTurn] = useState<'red' | 'white'>(multiplayerTurn || 'red');
  const [selected, setSelected] = useState<Position | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<Position | null>(null);

  // validMoves is now a list of Move objects
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  
  const [lastMovedPos, setLastMovedPos] = useState<Position | null>(null);
  const [capturedAnim, setCapturedAnim] = useState<{r: number; c: number; piece: Piece; id: number}[]>([]);
  const [animatingMove, setAnimatingMove] = useState<{from: Position; to: Position; piece: Piece} | null>(null);
  const [ghostTarget, setGhostTarget] = useState(false);
  const [winner, setWinner] = useState<'red' | 'white' | 'draw' | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showGuideAide, setShowGuideAide] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Timer (configurable depuis Atelier)
  const [redTime, setRedTime] = useState(initialTimerSeconds);
  const [whiteTime, setWhiteTime] = useState(initialTimerSeconds);
  
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredMoves, setHoveredMoves] = useState<Move[]>([]);

  // Sync multiplayer board/turn from props
  useEffect(() => {
    if (multiplayerBoard) setBoard(multiplayerBoard);
  }, [multiplayerBoard]);
  useEffect(() => {
    if (multiplayerTurn !== undefined) setTurn(multiplayerTurn);
  }, [multiplayerTurn]);

  // Timer (actif seulement si timerEnabled)
  useEffect(() => {
    if (!timerEnabled || winner || isPaused) return;
    const timer = setInterval(() => {
      if (turn === 'white') {
        setWhiteTime(t => {
          const next = Math.max(0, t - 1);
          if (next === 0) setWinner('red');
          return next;
        });
      } else {
        setRedTime(t => {
          const next = Math.max(0, t - 1);
          if (next === 0) setWinner('white');
          return next;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [timerEnabled, turn, winner, isPaused]);
  
  // --- RULES ENGINE (Internal) ---
  
  const isValidPos = (r: number, c: number) => r >= 0 && c >= 0 && r < BOARD_SIZE && c < BOARD_SIZE;

  // Simulate a capture on a temporary board to continue searching
  const applyCapture = (tempBoard: Board, from: Position, to: Position, captured: Position) => {
      const p = tempBoard[from.r][from.c];
      tempBoard[to.r][to.c] = p;
      tempBoard[from.r][from.c] = null;
      // In International Draughts, we don't remove piece immediately in loop, but we mark it as captured so we don't jump it twice.
      // However, simplified simulation: we remove it from board for pathfinding to avoid jumping same piece twice in one chain.
      tempBoard[captured.r][captured.c] = null;
      return tempBoard;
  };

  const getCapturesForPiece = (b: Board, piece: Piece, r: number, c: number): Move[] => {
      if (!piece) return [];
      const moves: Move[] = [];
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

      const search = (cr: number, cc: number, currentBoard: Board, currentPath: Position[], captured: Position[]) => {
          let foundContinuation = false;

          dirs.forEach(([dr, dc]) => {
              if (piece.isKing) {
                  // Flying King Logic
                  // Look along diagonal
                  for (let dist = 1; dist < BOARD_SIZE; dist++) {
                      const tr = cr + dr * dist;
                      const tc = cc + dc * dist;
                      if (!isValidPos(tr, tc)) break;

                      const target = currentBoard[tr][tc];
                      if (target) {
                          if (target.color === piece.color) break; // Blocked by friend
                          // Found enemy. Now look for landing spots AFTER enemy
                          // Must ensure we haven't already captured this specific piece in this sequence
                          // (In our simplified logic, it's removed from currentBoard, so valid check is implicitly done)
                          
                          for (let landDist = dist + 1; landDist < BOARD_SIZE; landDist++) {
                              const lr = cr + dr * landDist;
                              const lc = cc + dc * landDist;
                              if (!isValidPos(lr, lc)) break;
                              if (currentBoard[lr][lc]) break; // Blocked by another piece

                              // Valid Landing Spot
                              foundContinuation = true;
                              
                              // Create new board state for recursion
                              const nextBoard = currentBoard.map(row => [...row]);
                              // Remove captured piece for next step validation
                              nextBoard[tr][tc] = null; 
                              // Move king temporarily
                              nextBoard[lr][lc] = piece;
                              nextBoard[cr][cc] = null;

                              search(lr, lc, nextBoard, [...currentPath, {r: lr, c: lc}], [...captured, {r: tr, c: tc}]);
                          }
                          break; // Only one enemy per direction can be the start of a jump
                      }
                  }
              } else {
                  // Pawn Logic (Forward AND Backward capture allowed in International)
                  const tr = cr + dr * 2;
                  const tc = cc + dc * 2;
                  const mr = cr + dr;
                  const mc = cc + dc;

                  if (isValidPos(tr, tc)) {
                      const mid = currentBoard[mr][mc];
                      if (mid && mid.color !== piece.color && !currentBoard[tr][tc]) {
                          foundContinuation = true;
                          const nextBoard = currentBoard.map(row => [...row]);
                          nextBoard[mr][mc] = null;
                          nextBoard[tr][tc] = piece;
                          nextBoard[cr][cc] = null;
                          search(tr, tc, nextBoard, [...currentPath, {r: tr, c: tc}], [...captured, {r: mr, c: mc}]);
                      }
                  }
              }
          });

          if (!foundContinuation && currentPath.length > 0) {
              // End of chain
               moves.push({
                   from: {r, c},
                   to: currentPath[currentPath.length - 1],
                   captures: captured
               });
          }
      };

      search(r, c, b.map(row => [...row]), [], []);
      return moves;
  };

  const getSimpleMovesForPiece = (b: Board, piece: Piece, r: number, c: number): Move[] => {
      if (!piece) return [];
      const moves: Move[] = [];
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

      dirs.forEach(([dr, dc]) => {
          // Pawn direction check
          if (!piece.isKing) {
              if (piece.color === 'red' && dr !== -1) return;
              if (piece.color === 'white' && dr !== 1) return;
          }

          if (piece.isKing) {
              // Flying King
              for (let i = 1; i < BOARD_SIZE; i++) {
                  const tr = r + dr * i;
                  const tc = c + dc * i;
                  if (!isValidPos(tr, tc) || b[tr][tc]) break;
                  moves.push({ from: {r,c}, to: {r: tr, c: tc}, captures: [] });
              }
          } else {
              // Simple Pawn
              const tr = r + dr;
              const tc = c + dc;
              if (isValidPos(tr, tc) && !b[tr][tc]) {
                  moves.push({ from: {r,c}, to: {r: tr, c: tc}, captures: [] });
              }
          }
      });
      return moves;
  };

  // MAIN LOGIC: Get all legal moves enforcing Max Capture (Quantity Rule)
  const getAllLegalMoves = (b: Board, player: 'red' | 'white'): Move[] => {
      let captureMoves: Move[] = [];
      let simpleMoves: Move[] = [];

      for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
              const p = b[r][c];
              if (p && p.color === player) {
                  captureMoves = [...captureMoves, ...getCapturesForPiece(b, p, r, c)];
                  simpleMoves = [...simpleMoves, ...getSimpleMovesForPiece(b, p, r, c)];
              }
          }
      }

      if (captureMoves.length > 0) {
          // Find max capture length
          const maxCaptures = Math.max(...captureMoves.map(m => m.captures.length));
          // Filter moves that have max length
          return captureMoves.filter(m => m.captures.length === maxCaptures);
      }
      return simpleMoves;
  };
  
  // Calculate moves on turn change
  useEffect(() => {
     if (!winner) {
         const legalMoves = getAllLegalMoves(board, turn);
         setValidMoves(legalMoves);
         
         // Auto check loss condition
         if (legalMoves.length === 0) {
            if (!aiThinking && !isSpectator) {
                 // Game Over Logic if no moves
                 setWinner(turn === 'red' ? 'white' : 'red');
            }
         }
     }
  }, [board, turn, winner]);

  const s = getStyles(theme);

  // --- SOUND SYSTEM ---
  const playSound = (type: 'select' | 'move' | 'capture' | 'promote' | 'win' | 'lose') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      const playTone = (freq: number, wave: OscillatorType, startTime: number, duration: number, vol: number = 0.1) => {
         const osc = ctx.createOscillator();
         const gain = ctx.createGain();
         osc.type = wave;
         osc.frequency.setValueAtTime(freq, startTime);
         
         osc.connect(gain);
         gain.connect(ctx.destination);
         
         gain.gain.setValueAtTime(0, startTime);
         gain.gain.linearRampToValueAtTime(vol, startTime + 0.02); // Attack
         gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Release
         
         osc.start(startTime);
         osc.stop(startTime + duration);
      };

      switch (type) {
        case 'select':
          playTone(600, 'sine', now, 0.1, 0.05);
          break;
        case 'move':
          playTone(300, 'sine', now, 0.15, 0.1);
          break;
        case 'capture':
          // Custom snap sound
          const oscC = ctx.createOscillator();
          const gainC = ctx.createGain();
          oscC.type = 'sawtooth';
          oscC.frequency.setValueAtTime(150, now);
          oscC.frequency.linearRampToValueAtTime(80, now + 0.1);
          oscC.connect(gainC);
          gainC.connect(ctx.destination);
          gainC.gain.setValueAtTime(0.1, now);
          gainC.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          oscC.start(now);
          oscC.stop(now + 0.1);
          break;
        case 'promote':
          playTone(400, 'triangle', now, 0.3);
          playTone(600, 'triangle', now + 0.15, 0.5);
          break;
        case 'win':
          // Major Fanfare (C - E - G - C) - Célébration discrète
          [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
             playTone(f, 'triangle', now + i * 0.12, 0.6, 0.15);
          });
          break;
        case 'lose':
           // Sad Descent (G - F# - F - E) - Mélancolique
           [392.00, 369.99, 349.23, 329.63].forEach((f, i) => {
              playTone(f, 'sawtooth', now + i * 0.25, 0.6, 0.08);
           });
           break;
      }
    } catch (e) { console.error(e); }
  };


  // --- CAPTURED PIECES INDICATOR (Updated for 20 pieces) ---
  const redCount = board.flat().filter(p => p?.color === 'red').length;
  const whiteCount = board.flat().filter(p => p?.color === 'white').length;
  const redLost = 20 - redCount; 
  const whiteLost = 20 - whiteCount;

  // --- END GAME EFFECTS ---
  const EndGameEffects = ({ type }: { type: 'win' | 'lose' }) => {
    // Win Animation
    if (type === 'win') {
      return (
        <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0}}>
           {/* Dynamic Background Gradient Pulse */}
           <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(circle, ${theme.gold}20 0%, transparent 70%)`,
              animation: 'bg-pulse 4s ease-in-out infinite'
           }} />

           {/* Rotating Light Beams (Enhanced) */}
           <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '200vmax', height: '200vmax',
              background: `conic-gradient(from 0deg, transparent 0deg, ${theme.gold}40 10deg, transparent 20deg, transparent 40deg, ${theme.gold}40 50deg, transparent 60deg, transparent 80deg, ${theme.gold}40 90deg, transparent 100deg, transparent 120deg, ${theme.gold}40 130deg, transparent 140deg, transparent 160deg, ${theme.gold}40 170deg, transparent 180deg, transparent 200deg, ${theme.gold}40 210deg, transparent 220deg, transparent 240deg, ${theme.gold}40 250deg, transparent 260deg, transparent 280deg, ${theme.gold}40 290deg, transparent 300deg, transparent 320deg, ${theme.gold}40 330deg, transparent 340deg)`,
              animation: 'spin-rays 25s linear infinite',
              opacity: 0.6,
              mixBlendMode: 'overlay' 
           }} />
           
           {/* Floating Particles/Dust */}
           {Array.from({ length: 30 }).map((_, i) => (
             <div key={`dust-${i}`} style={{
                position: 'absolute', 
                left: `${Math.random() * 100}%`, 
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`, 
                height: `${Math.random() * 4 + 2}px`,
                borderRadius: '50%',
                backgroundColor: theme.gold,
                boxShadow: `0 0 10px ${theme.gold}`,
                animation: `float-particle ${Math.random() * 5 + 3}s linear infinite`,
                animationDelay: `${Math.random() * -5}s`,
                opacity: Math.random() * 0.5 + 0.2
             }} />
           ))}
        </div>
      );
    } 
    return null;
  };
  
  // --- HAPTIC FEEDBACK ---
  const triggerHaptic = (type: 'select' | 'move' | 'capture' | 'promote') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        switch (type) {
            case 'select': navigator.vibrate(15); break;
            case 'move': navigator.vibrate(40); break;
            case 'capture': navigator.vibrate(70); break;
            case 'promote': navigator.vibrate([50, 50, 50]); break;
        }
    }
  };

  const handleSquareClick = (r: number, c: number) => {
    if (animatingMove) return;
    if (isPaused) return;
    if (isSpectator) return;
    if (winner) return;
    if (isMultiplayer && turn !== multiplayerMyColor) return;
    if (!isMultiplayer && mode !== 'local' && turn === 'white') return;

    const clickedPiece = board[r][c];

    // Select piece
    if (clickedPiece && clickedPiece.color === turn) {
        // Check if this piece has valid moves in the current "Quantité" context
        const hasValidMoves = validMoves.some(m => m.from.r === r && m.from.c === c);
        
        if (hasValidMoves) {
            playSound('select');
            triggerHaptic('select');
            setSelected({ r, c });
        }
        return;
    }

    // Move piece
    if (selected && !clickedPiece) {
      const move = validMoves.find(m => m.from.r === selected.r && m.from.c === selected.c && m.to.r === r && m.to.c === c);

      if (move) {
        if (isMultiplayer && onMultiplayerMove) {
          onMultiplayerMove({ from: move.from, to: move.to, captures: move.captures });
          setSelected(null);
          playSound('move');
        } else {
          executeMove(move);
        }
      }
    }
  };

  const executeMove = (move: Move) => {
    const movingPiece = board[move.from.r][move.from.c];
    if (!movingPiece) return;

    const isCapture = move.captures.length > 0;

    if (isCapture) {
        playSound('capture');
        triggerHaptic('capture');
    } else {
        playSound('move');
        triggerHaptic('move');
    }

    setAnimatingMove({ from: move.from, to: move.to, piece: movingPiece });
    requestAnimationFrame(() => setGhostTarget(true));

    setTimeout(() => {
      const newBoard = board.map(row => row.map(p => p ? {...p} : null));
      newBoard[move.to.r][move.to.c] = movingPiece;
      newBoard[move.from.r][move.from.c] = null;

      if (move.captures.length > 0) {
        const capAnims = move.captures.map(c => ({
          r: c.r, c: c.c, piece: board[c.r][c.c], id: Math.random()
        }));
        setCapturedAnim(ca => [...ca, ...capAnims]);
        setTimeout(() => {
          setCapturedAnim(ca => ca.filter(x => !capAnims.some(y => y.id === x.id)));
        }, 600);
      }

      move.captures.forEach(pos => { newBoard[pos.r][pos.c] = null; });

      let promoted = false;
      if ((movingPiece.color === 'red' && move.to.r === 0) || (movingPiece.color === 'white' && move.to.r === BOARD_SIZE - 1)) {
        if (!movingPiece.isKing) {
          newBoard[move.to.r][move.to.c] = { ...movingPiece, isKing: true };
          promoted = true;
        }
      }

      if (promoted) {
        playSound('promote');
        triggerHaptic('promote');
      }

      setBoard(newBoard);
      setLastMovedPos(move.to);
      setSelected(null);
      setAnimatingMove(null);
      setGhostTarget(false);
      setTurn(prev => prev === 'red' ? 'white' : 'red');
    }, 400);
  };

  const checkDanger = (b: Board, pos: Position, enemyColor: 'red' | 'white'): boolean => {
    const diags: [number, number][] = [[-1,-1], [-1,1], [1,-1], [1,1]];
    for (const [dr, dc] of diags) {
      const er = pos.r + dr, ec = pos.c + dc;
      const lr = pos.r - dr, lc = pos.c - dc;
      if (er >= 0 && er < BOARD_SIZE && ec >= 0 && ec < BOARD_SIZE && lr >= 0 && lr < BOARD_SIZE && lc >= 0 && lc < BOARD_SIZE) {
        const p = b[er][ec];
        if (p && p.color === enemyColor && !b[lr][lc]) return true;
      }
    }
    return false;
  };

  const getAIMove = (moves: Move[], diff: AIDifficulty): Move | null => {
    if (moves.length === 0) return null;
    if (diff === 'easy') return moves[Math.floor(Math.random() * moves.length)];
    if (diff === 'medium') {
      const centerMoves = moves.filter(m => m.to.c > 2 && m.to.c < 7);
      if (centerMoves.length > 0) return centerMoves[Math.floor(Math.random() * centerMoves.length)];
      return moves[Math.floor(Math.random() * moves.length)];
    }
    const scoredMoves = moves.map(move => {
      let score = 0;
      const piece = board[move.from.r][move.from.c];
      score += move.captures.length * 10;
      if (move.to.r === BOARD_SIZE - 1 && piece?.color === 'white' && !piece?.isKing) score += 50;
      if (move.to.r === 0 && piece?.color === 'red' && !piece?.isKing) score += 50;
      if (move.from.r === 0 || move.from.r === BOARD_SIZE - 1) score -= 3;
      if (checkDanger(board, move.to, turn === 'white' ? 'red' : 'white')) score -= 20;
      if (move.to.c > 2 && move.to.c < 7) score += 3;
      return { ...move, score };
    });
    scoredMoves.sort((a, b) => (b.score || 0) - (a.score || 0));
    return scoredMoves[0];
  };

  // AI & Spectator Logic
  useEffect(() => {
    if (isPaused) return;

    if (animatingMove) return;

    if ((isSpectator && !winner) || (mode === 'solo' && turn === 'white' && !winner) || ((mode === 'multi' || mode === 'friend') && !isMultiplayer && turn === 'white' && !winner)) {
       
       if (validMoves.length === 0) return;

       setAiThinking(true);
       const thinkTime = difficulty === 'easy' ? 600 : (difficulty === 'hard' ? 2000 : 900);
       const apiBase = (() => {
         try {
           const u = import.meta.env.VITE_WS_URL || '';
           return u ? new URL(u).origin : (typeof window !== 'undefined' ? window.location.origin : '');
         } catch { return ''; }
       })();

       const timer = setTimeout(() => {
          if (difficulty === 'hard' && apiBase) {
            fetch(`${apiBase}/api/ai/suggest`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ moves: validMoves }),
            })
              .then(r => r.ok ? r.json() : Promise.reject())
              .then((data: { move?: Move }) => {
                const move = data?.move && validMoves.some(m => m.from.r === data.move!.from.r && m.from.c === data.move!.from.c && m.to.r === data.move!.to.r && m.to.c === data.move!.to.c) ? data.move : getAIMove(validMoves, 'hard');
                if (move) executeMove(move);
              })
              .catch(() => {
                const move = getAIMove(validMoves, 'hard');
                if (move) executeMove(move);
              })
              .finally(() => setAiThinking(false));
          } else {
            const move = getAIMove(validMoves, difficulty);
            if (move) executeMove(move);
            setAiThinking(false);
          }
       }, thinkTime);

       return () => clearTimeout(timer);
    }
  }, [turn, mode, winner, isSpectator, isPaused, validMoves, animatingMove, difficulty]); 
  
  // Trigger Win/Loss Sound when winner state changes
  useEffect(() => {
    if (winner) {
        if (winner === 'red' && !isSpectator) playSound('win');
        else if (winner === 'white' && !isSpectator) playSound('lose');
    }
  }, [winner, isSpectator]);


  // Determine Opponent Name
  const aiName = difficulty === 'easy' ? 'Bot Novice' : (difficulty === 'hard' ? 'GrandMaster Bot' : 'Bot Pro');
  const opponentName = isSpectator 
    ? "Match en direct" 
    : (mode === 'solo' ? aiName : (mode === 'friend' ? "Ami Invité" : (mode === 'local' ? "Joueur 2" : "Adversaire en ligne")));

  const isFlipped = isMultiplayer && multiplayerMyColor === 'white';
  const topColor: 'red' | 'white' = isFlipped ? 'red' : 'white';
  const bottomColor: 'red' | 'white' = isFlipped ? 'white' : 'red';
  const topTime = isFlipped ? redTime : whiteTime;
  const bottomTime = isFlipped ? whiteTime : redTime;
  const topName = isSpectator ? 'Match en direct' : opponentName;
  const bottomName = isSpectator ? 'SPECTATEUR' : user.name;
  // Multijoueur: players[0] = rouge, players[1] = blanc
  const topPlayer = isMultiplayer && multiplayerPlayers?.length === 2 ? multiplayerPlayers[topColor === 'red' ? 0 : 1] : null;
  const bottomPlayer = isMultiplayer && multiplayerPlayers?.length === 2 ? multiplayerPlayers[bottomColor === 'red' ? 0 : 1] : null;

  const handlePieceHover = (r: number, c: number) => {
    if (isSpectator || winner || aiThinking || isPaused) return;
    if (isMultiplayer && turn !== multiplayerMyColor) return;
    if (mode === 'solo' && turn === 'white') return;
    const p = board[r][c];
    if (p && p.color === turn) {
      const moves = getAllLegalMoves(board, turn).filter(m => m.from.r === r && m.from.c === c);
      setHoveredMoves(moves);
    } else {
      setHoveredMoves([]);
    }
  };

  const getPieceStyle = (color: string, isKing: boolean, isSelected: boolean): React.CSSProperties => {
    const isRed = color === 'red';
    const shadowY = isFlipped ? -4 : 4;
    const shadowYSel = isFlipped ? -15 : 15;
    const lightPos = isFlipped ? '70% 70%' : '30% 30%';
    const base: React.CSSProperties = {
      width: '75%', height: '75%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s',
      transform: isSelected ? 'translateZ(10px) scale(1.1)' : 'translateZ(2px)',
      zIndex: isSelected ? 20 : 5, transformStyle: 'preserve-3d',
      animation: isSelected ? 'float-piece 2s ease-in-out infinite' : 'none',
    };
    if (skin === 'wood') {
      const bc = isRed ? '#4a332a' : '#e6d5ac';
      const rc = isRed ? '#2b1d16' : '#c5a059';
      base.background = `radial-gradient(circle at ${lightPos}, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 25%), repeating-radial-gradient(circle at 50% 50%, ${bc} 0px, ${bc} 2px, ${rc} 3px, ${rc} 4px)`;
      base.border = `1px solid ${isRed ? '#1a120b' : '#a68e74'}`;
      base.boxShadow = isSelected ? `0 ${shadowYSel}px 15px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.5)` : `0 ${shadowY}px 4px rgba(0,0,0,0.4), inset 0 0 5px rgba(0,0,0,0.3)`;
    } else if (skin === 'marble') {
      const bc = isRed ? '#333' : '#f0f0f0';
      const vc = isRed ? '#111' : '#ccc';
      base.background = `radial-gradient(circle at ${lightPos}, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 20%), radial-gradient(circle at 50% 50%, ${bc}, ${vc})`;
      base.border = `1px solid ${isRed ? '#000' : '#fff'}`;
      base.boxShadow = isSelected ? `0 ${shadowYSel}px 20px rgba(0,0,0,0.6), inset 2px 2px 10px rgba(255,255,255,0.2)` : `0 ${shadowY}px 6px rgba(0,0,0,0.5), inset 2px 2px 5px rgba(255,255,255,0.3)`;
    } else if (skin === 'neon') {
      const nc = isRed ? (theme.danger || '#e74c3c') : theme.gold;
      base.background = '#000';
      base.border = `2px solid ${nc}`;
      base.boxShadow = isSelected ? `0 0 20px ${nc}, inset 0 0 10px ${nc}` : `0 0 10px ${nc}, inset 0 0 5px ${nc}`;
    } else {
      base.background = isRed ? `radial-gradient(circle at ${lightPos}, #e74c3c, #c0392b)` : `radial-gradient(circle at ${lightPos}, #ecf0f1, #bdc3c7)`;
      base.boxShadow = isSelected ? `0 ${shadowYSel * 0.6}px 10px rgba(0,0,0,0.4)` : `0 ${shadowY * 0.5}px 3px rgba(0,0,0,0.3)`;
    }
    return base;
  };

  return (
    <div style={{...s.main, justifyContent: 'flex-start', perspective: '1200px'}}>
       <style>
         {`
           @keyframes pulse-gold {
             0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); transform: scale(1.1); }
             70% { box-shadow: 0 0 0 6px rgba(255, 215, 0, 0); transform: scale(1.15); }
             100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); transform: scale(1.1); }
           }
           @keyframes land-piece {
             0% { transform: scale(1.4); }
             60% { transform: scale(0.95); }
             100% { transform: scale(1); }
           }
           @keyframes fade-in-dot {
              0% { opacity: 0; transform: scale(0); }
              100% { opacity: 1; transform: scale(1); }
           }
           @keyframes breathe-glow {
             0% { filter: brightness(1); box-shadow: 0 0 0 rgba(255,215,0,0); }
             50% { filter: brightness(1.25); box-shadow: 0 0 8px rgba(255,215,0,0.4); }
             100% { filter: brightness(1); box-shadow: 0 0 0 rgba(255,215,0,0); }
           }
           @keyframes pulse-dot { 0% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.3); opacity: 1; } 100% { transform: scale(1); opacity: 0.6; } }
           @keyframes float-piece { 0%, 100% { transform: translateZ(10px) scale(1.1); } 50% { transform: translateZ(14px) scale(1.1); } }
           @keyframes jump-arc { 0% { transform: translateZ(2px); } 50% { transform: translateZ(60px) scale(1.1); } 100% { transform: translateZ(2px); } }
           @keyframes vanish-piece { 0% { transform: translateZ(2px) scale(1); opacity: 1; } 50% { transform: translateZ(20px) scale(1.2) rotate(15deg); opacity: 0.8; } 100% { transform: translateZ(5px) scale(0); opacity: 0; } }
         `}
       </style>

      {/* HUD BAR */}
      <div style={{width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0'}}>
        <TactileButton variant="glass" theme={theme} onClick={() => setShowQuitConfirm(true)} style={{padding: '8px 12px'}}><LogOut size={16} /></TactileButton>
        <div style={{textAlign: 'center'}}>
          <div style={{fontSize: '12px', fontWeight: 'bold', color: theme.textDim}}>POT TOTAL</div>
          <div style={{fontSize: '18px', fontWeight: '900', color: theme.gold}}>{bet * 2} $Dames</div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <button onClick={() => setSoundEnabled(!soundEnabled)} style={{background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          {!winner && (
            <button onClick={() => setIsPaused(true)} style={{background: 'none', border: 'none', color: theme.gold, cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
              <Pause size={12} />
            </button>
          )}
        </div>
      </div>

      {isSpectator && (
        <div style={{
          background: theme.danger, color: '#fff', width: '100%', maxWidth: '420px',
          padding: '4px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold',
          borderRadius: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
        }}>
          <Eye size={12} /> MODE SPECTATEUR (EN DIRECT)
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {isPaused && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 100,
          backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{...s.panel, maxWidth: '300px', border: `1px solid ${theme.gold}`}}>
             <h2 style={{fontFamily: theme.fontMain, color: theme.gold, margin: '0 0 20px 0', fontSize: '24px'}}>PAUSE</h2>
             
             <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
               <TactileButton theme={theme} onClick={() => setIsPaused(false)} style={{padding: '10px'}}>
                  <Play size={18} /> Reprendre
               </TactileButton>
               
               <button onClick={() => setShowRules(true)} style={{...s.secondaryButton, margin: 0, border: `1px solid ${theme.textDim}`}}>
                  <BookOpen size={18} /> Règles
               </button>
               
               <button onClick={() => setShowQuitConfirm(true)} style={{...s.secondaryButton, margin: 0, color: theme.accent, borderColor: theme.accent}}>
                  <LogOut size={18} /> {isSpectator ? 'Quitter' : 'Abandonner'}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* TOP PLAYER — photo de profil uniquement + pièces capturées */}
      <div style={{
        width: '100%', maxWidth: '420px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '12px', 
        marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px',
        border: turn === topColor ? `1px solid ${theme.gold}` : '1px solid transparent',
        opacity: turn === topColor ? 1 : 0.6, transition: 'all 0.3s'
      }}>
        <div style={{width: '36px', height: '36px', flexShrink: 0, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${topColor === 'red' ? '#c0392b' : '#ecf0f1'}`, overflow: 'hidden'}} title={topPlayer?.username || topName}>
          {topPlayer?.photoUrl ? (
            <img src={topPlayer.photoUrl} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          ) : isSpectator ? <Tv size={18} color="#333" /> : (mode === 'solo' ? <Monitor size={18} color="#333" /> : <User size={18} color="#333" />)}
        </div>
        {(aiThinking || (isSpectator && !winner)) && <span style={{fontSize: '10px', color: theme.gold}}>...</span>}
        <div style={{flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center'}}>
          <CapturedPieces count={topColor === 'red' ? whiteLost : redLost} color={topColor === 'red' ? 'white' : 'red'} theme={theme} />
        </div>
        {timerEnabled ? <PlayerTimer time={topTime} theme={theme} isActive={turn === topColor} /> : <div style={{minWidth: '60px', textAlign: 'center', fontSize: '12px', color: theme.textDim}}>—:—</div>}
      </div>

      {/* EXIT/QUIT CONFIRMATION MODAL */}
      {showQuitConfirm && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 110,
          backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{...s.panel, textAlign: 'center', maxWidth: '350px', border: `1px solid ${theme.accent}`}}>
            <h3 style={{margin: '0 0 12px 0', fontFamily: theme.fontMain, color: isSpectator ? theme.text : theme.accent, fontSize: '18px'}}>
              {isSpectator ? 'Quitter le mode spectateur ?' : 'Abandonner la partie ?'}
            </h3>
            <p style={{color: theme.textDim, marginBottom: '20px', fontSize: '14px'}}>
              {isSpectator 
                ? 'Vous allez retourner au menu principal.' 
                : `En abandonnant, vous perdez votre mise de ${bet} $Dames.`
              }
            </p>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
               <button 
                 onClick={() => setShowQuitConfirm(false)} 
                 style={{...s.secondaryButton, marginTop: 0, flex: 1}}
               >
                 Annuler
               </button>
               <TactileButton 
                 theme={theme}
                 onClick={() => {
                    setShowQuitConfirm(false);
                    if (isMultiplayer && multiplayerResign) {
                      multiplayerResign();
                    } else {
                      onGameOver(isSpectator ? null : 'white'); 
                    }
                 }} 
                 style={{background: 'linear-gradient(180deg, #c0392b 0%, #8e1c14 100%)', boxShadow: '0 4px 0 #58100b', color: 'white', marginTop: 0, flex: 1, padding: '10px'}}
               >
                 {isSpectator ? 'Quitter' : 'Abandonner'}
               </TactileButton>
            </div>
          </div>
        </div>
      )}

      {/* RULES OVERLAY */}
      {showRules && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 105,
          backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{...s.panel, textAlign: 'left', maxWidth: '400px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
               <h3 style={{margin: 0, fontFamily: theme.fontMain, color: theme.gold, fontSize: '18px'}}>Règles Internationales (10x10)</h3>
               <button onClick={() => setShowRules(false)} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}><X size={20} /></button>
            </div>
            <ul style={{fontSize: '13px', lineHeight: '1.5', color: theme.text, paddingLeft: '20px', margin: 0}}>
                <li style={{marginBottom: '8px'}}>
                    <strong>Pions :</strong> Déplacement 1 case avant. Prise avant ET arrière.
                </li>
                <li style={{marginBottom: '8px'}}>
                    <strong style={{color: theme.accent}}>Quantité :</strong> La prise est obligatoire. Vous DEVEZ choisir la suite qui capture le plus de pièces.
                </li>
                <li style={{marginBottom: '8px'}}>
                    <strong style={{color: theme.gold}}>Dames Volantes :</strong> Traversent tout le plateau. Prise à distance.
                </li>
                <li style={{marginBottom: '8px'}}>
                    <strong>Action push :</strong> Vous pouvez aussi glisser-déposer un pion vers une case valide (au lieu de clic case puis clic destination).
                </li>
            </ul>
            <TactileButton theme={theme} onClick={() => setShowRules(false)} style={{width: '100%', justifyContent: 'center', marginTop: '20px'}}>Compris</TactileButton>
          </div>
        </div>
      )}

      {/* WINNER OVERLAY */}
      {winner && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 100,
          backdropFilter: 'blur(5px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden' // Ensure effects don't spill out if using viewport units oddly
        }}>
          {/* End Game Effects */}
          <EndGameEffects type={(!isSpectator && winner === 'red') ? 'win' : 'lose'} />

          {/* Content Container (z-index higher than effects) */}
          <div style={{zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'scale-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'}}>
            <Trophy size={56} color={theme.gold} style={{
              marginBottom: '16px', 
              filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))',
              animation: winner === 'red' ? 'pulse-gold 2s infinite' : 'none'
            }} />
            
            <h1 style={{
              fontFamily: theme.fontMain, 
              fontSize: '40px', 
              color: theme.gold, 
              margin: 0,
              animation: winner === 'red' ? 'text-glow 2s infinite' : 'none',
              textShadow: winner === 'red' ? `0 0 20px ${theme.accent}` : 'none'
            }}>
              {isSpectator 
                 ? (winner === 'red' ? 'ROUGES GAGNENT' : 'BLANCS GAGNENT')
                 : (winner === 'red' ? 'VICTOIRE !' : 'DÉFAITE')
              }
            </h1>
            <p style={{marginTop: '8px', fontSize: '16px'}}>
               {isSpectator 
                 ? 'La partie est terminée.' 
                 : (winner === 'red' ? `Vous avez gagné ${bet > 0 ? `${bet * 2} $Dames + ` : ''}50 $Dames !` : 'Meilleure chance la prochaine fois.')
               }
            </p>
            {!isSpectator && winner === 'red' && isTelegramHtml5Game() && (
              <TactileButton
                theme={theme}
                onClick={() => shareTelegramGameScore()}
                style={{ marginTop: '16px', background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)', color: theme.text, border: `1px solid ${theme.gold}60` }}
              >
                <Share2 size={18} /> Partager mon score
              </TactileButton>
            )}
            <TactileButton theme={theme} onClick={() => onGameOver(winner)} style={{marginTop: '24px'}}>
               Retour Menu
            </TactileButton>
          </div>
          <style>{`
             @keyframes text-glow {
               0% { transform: scale(1); text-shadow: 0 0 10px ${theme.gold}; }
               50% { transform: scale(1.1); text-shadow: 0 0 30px ${theme.gold}, 0 0 10px ${theme.accent}; }
               100% { transform: scale(1); text-shadow: 0 0 10px ${theme.gold}; }
             }
             @keyframes scale-in {
               from { transform: scale(0.8); opacity: 0; }
               to { transform: scale(1); opacity: 1; }
             }
          `}</style>
        </div>
      )}

      {/* 3D BOARD WRAPPER */}
      <div 
        ref={boardContainerRef}
        style={{
          width: '100%', maxWidth: '420px', aspectRatio: '1/1',
          position: 'relative', transformStyle: 'preserve-3d',
          transform: `rotateX(25deg) rotateZ(${isFlipped ? 180 : 0}deg) scale(0.9)`,
          marginTop: '10px', marginBottom: '20px',
          transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
          cursor: 'default'
        }}
      >
        {/* Board Base/Thickness with Bevel */}
        <div style={{
          position: 'absolute', inset: -12,
          background: 'linear-gradient(to bottom, #3e2723, #1a120b)',
          transform: 'translateZ(-15px)',
          boxShadow: '0 40px 60px rgba(0,0,0,0.7), 0 10px 20px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.8)',
          borderRadius: '16px', border: `1px solid ${theme.gold}40`
        }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '16px',
            border: `4px solid ${theme.gold}`,
            boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.2), inset -2px -2px 5px rgba(0,0,0,0.5)',
            opacity: 0.8
          }} />
        </div>

        {/* Grid Surface */}
        <div style={{
          width: '100%', height: '100%', background: theme.boardDark,
          backgroundImage: theme.boardTexture, borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
          transformStyle: 'preserve-3d',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
          position: 'relative'
        }}>
          {/* COORDINATES */}
          {Array.from({length: BOARD_SIZE}).map((_, i) => (
            <React.Fragment key={`coord-${i}`}>
              <div style={{position: 'absolute', top: '-18px', left: `${i * 10}%`, width: '10%', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: theme.textDim, transform: isFlipped ? 'rotateZ(180deg)' : 'none'}}>{['A','B','C','D','E','F','G','H','I','J'][i]}</div>
              <div style={{position: 'absolute', bottom: '-18px', left: `${i * 10}%`, width: '10%', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: theme.textDim, transform: isFlipped ? 'rotateZ(180deg)' : 'none'}}>{['A','B','C','D','E','F','G','H','I','J'][i]}</div>
              <div style={{position: 'absolute', left: '-18px', top: `${i * 10}%`, height: '10%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: theme.textDim, transform: isFlipped ? 'rotateZ(180deg)' : 'none'}}>{i + 1}</div>
              <div style={{position: 'absolute', right: '-18px', top: `${i * 10}%`, height: '10%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: theme.textDim, transform: isFlipped ? 'rotateZ(180deg)' : 'none'}}>{i + 1}</div>
            </React.Fragment>
          ))}

          {board.map((row, r) => row.map((piece, c) => {
            const isDark = (r + c) % 2 === 1;
            const isSelected = selected?.r === r && selected?.c === c;
            const isTarget = selected && validMoves.some(m => m.from.r === selected.r && m.from.c === selected.c && m.to.r === r && m.to.c === c);
            const isHoverMove = hoveredMoves.some(m => m.to.r === r && m.to.c === c);
            const canSelect = piece?.color === turn && validMoves.some(m => m.from.r === r && m.from.c === c);
            const isLastMove = lastMovedPos?.r === r && lastMovedPos?.c === c;
            const isBeingAnimated = animatingMove && animatingMove.from.r === r && animatingMove.from.c === c;

            const handleDragStart = (e: React.DragEvent) => {
              if (!canSelect || isSpectator) return;
              setDraggedFrom({ r, c });
              e.dataTransfer.setData('application/json', JSON.stringify({ r, c }));
              e.dataTransfer.effectAllowed = 'move';
            };
            const handleDrop = (e: React.DragEvent) => {
              e.preventDefault();
              setDraggedFrom(null);
              if (animatingMove || isPaused || winner) return;
              if (isMultiplayer && turn !== multiplayerMyColor) return;
              try {
                const from = JSON.parse(e.dataTransfer.getData('application/json')) as { r: number; c: number };
                const move = validMoves.find(m => m.from.r === from.r && m.from.c === from.c && m.to.r === r && m.to.c === c);
                if (move) {
                  if (isMultiplayer && onMultiplayerMove) {
                    onMultiplayerMove({ from: move.from, to: move.to, captures: move.captures });
                    setSelected(null);
                    playSound('move');
                  } else {
                    executeMove(move);
                  }
                }
              } catch (_) {}
            };
            const isDropTarget = !piece && draggedFrom && validMoves.some(m => m.from.r === draggedFrom.r && m.from.c === draggedFrom.c && m.to.r === r && m.to.c === c);
            const handleDragOver = (e: React.DragEvent) => {
              if (isDropTarget || isTarget) e.preventDefault();
              e.dataTransfer.dropEffect = (isDropTarget || isTarget) ? 'move' : 'none';
            };

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleSquareClick(r, c)}
                onMouseEnter={() => handlePieceHover(r, c)}
                onMouseLeave={() => setHoveredMoves([])}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                style={{
                  width: '100%', height: '100%',
                  background: isDark ? 'rgba(0,0,0,0.2)' : theme.boardLight,
                  backgroundImage: isDark ? 'none' : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.05) 100%)',
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transformStyle: 'preserve-3d',
                  boxShadow: isDark
                    ? 'inset 3px 3px 8px rgba(0,0,0,0.6), inset -1px -1px 4px rgba(255,255,255,0.05)'
                    : 'inset 1px 1px 0px rgba(255,255,255,0.6), inset -1px -1px 2px rgba(0,0,0,0.1)',
                  borderRadius: '2px',
                  cursor: (canSelect || isTarget) && !isSpectator ? 'pointer' : 'default'
                }}
              >
                {isTarget && !piece && (
                  <div style={{
                    width: '30%', height: '30%', borderRadius: '50%',
                    background: theme.success,
                    boxShadow: `0 0 10px ${theme.success}`,
                    animation: 'pulse-dot 1.5s infinite ease-in-out',
                    transform: 'translateZ(1px)'
                  }} />
                )}
                {isHoverMove && !isTarget && !isSpectator && (
                  <div style={{
                    width: '20%', height: '20%', borderRadius: '50%',
                    background: theme.gold, opacity: 0.6,
                    boxShadow: `0 0 8px ${theme.gold}`,
                    transform: 'translateZ(1px)'
                  }} />
                )}
                {piece && !isBeingAnimated && (
                  <div
                    draggable={canSelect && !isSpectator}
                    onDragStart={handleDragStart}
                    onDragEnd={() => setDraggedFrom(null)}
                    style={{
                    ...getPieceStyle(piece.color, piece.isKing, isSelected),
                    animation: isSelected
                      ? 'float-piece 2s ease-in-out infinite'
                      : (canSelect && !isSpectator
                          ? 'breathe-glow 2.5s infinite ease-in-out'
                          : (isLastMove ? 'land-piece 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none'))
                  }}>
                    {piece.isKing && <Crown size={14} color={piece.color === 'red' ? '#fff' : '#333'} style={{filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))', transform: isFlipped ? 'rotateZ(180deg)' : 'none'}} />}
                  </div>
                )}
              </div>
            );
          }))}

          {/* CAPTURED PIECES ANIMATION */}
          {capturedAnim.map((ca) => (
            <div key={ca.id} style={{
              left: `${ca.c * 10}%`, top: `${ca.r * 10}%`,
              position: 'absolute', pointerEvents: 'none', zIndex: 50,
              width: '10%', height: '10%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'vanish-piece 0.6s ease-out forwards',
              transformStyle: 'preserve-3d'
            }}>
              {ca.piece && (
                <div style={getPieceStyle(ca.piece.color, ca.piece.isKing, false)}>
                  {ca.piece.isKing && <Crown size={14} color={ca.piece.color === 'red' ? '#fff' : '#333'} style={{transform: isFlipped ? 'rotateZ(180deg)' : 'none'}} />}
                </div>
              )}
            </div>
          ))}

          {/* Ghost Piece for Jump Animation */}
          {animatingMove && (
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: `${100/BOARD_SIZE}%`, height: `${100/BOARD_SIZE}%`,
              transform: `translate3d(${(ghostTarget ? animatingMove.to.c : animatingMove.from.c) * 100}%, ${(ghostTarget ? animatingMove.to.r : animatingMove.from.r) * 100}%, 0)`,
              transition: 'transform 0.4s ease-in-out',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', zIndex: 100, transformStyle: 'preserve-3d'
            }}>
              <div style={{ animation: 'jump-arc 0.4s ease-in-out forwards', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', transformStyle: 'preserve-3d' }}>
                <div style={getPieceStyle(animatingMove.piece.color, animatingMove.piece.isKing, true)}>
                  {animatingMove.piece.isKing && <Crown size={14} color={animatingMove.piece.color === 'red' ? '#fff' : '#333'} style={{transform: isFlipped ? 'rotateZ(180deg)' : 'none'}} />}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM PLAYER — photo de profil uniquement + pièces capturées */}
      <div style={{
        width: '100%', maxWidth: '420px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '12px',
        marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px',
        border: turn === bottomColor ? `1px solid ${theme.gold}` : '1px solid transparent',
        opacity: turn === bottomColor ? 1 : 0.6, transition: 'all 0.3s'
      }}>
        <div style={{width: '36px', height: '36px', flexShrink: 0, borderRadius: '50%', background: theme.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${bottomColor === 'red' ? '#c0392b' : '#ecf0f1'}`, overflow: 'hidden'}} title={bottomPlayer?.username || bottomName}>
          {bottomPlayer?.photoUrl ? (
            <img src={bottomPlayer.photoUrl} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          ) : (
            <User size={18} color="#000" />
          )}
        </div>
        <div style={{flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center'}}>
          <CapturedPieces count={bottomColor === 'red' ? whiteLost : redLost} color={bottomColor === 'red' ? 'white' : 'red'} theme={theme} />
        </div>
        {timerEnabled ? <PlayerTimer time={bottomTime} theme={theme} isActive={turn === bottomColor} /> : <div style={{minWidth: '60px', textAlign: 'center', fontSize: '12px', color: theme.textDim}}>—:—</div>}
      </div>

      {/* Bouton Aide — Guide du jeu (police et couleur visibles) */}
      <button
        onClick={() => setShowGuideAide(true)}
        style={{
          width: '100%', maxWidth: '420px', marginTop: '12px', padding: '12px 16px',
          background: `linear-gradient(180deg, ${theme.gold} 0%, ${theme.goldDim} 100%)`,
          color: '#1a1a08',
          border: `2px solid ${theme.goldDim}`, borderRadius: '10px',
          fontSize: '16px', fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          fontFamily: "'Inter', sans-serif",
          boxShadow: `0 4px 0 ${theme.buttonShadow || '#5c4524'}`
        }}
      >
        <BookOpen size={20} /> AIDE
      </button>

      {/* Modal Guide Aide (plateau) */}
      {showGuideAide && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 105,
          backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{...s.panel, textAlign: 'left', maxWidth: '400px', border: `1px solid ${theme.gold}`}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
              <h3 style={{margin: 0, fontFamily: theme.fontMain, color: theme.gold, fontSize: '18px'}}>Guide — Règles internationales (10×10)</h3>
              <button onClick={() => setShowGuideAide(false)} style={{background: 'none', border: 'none', color: theme.text, cursor: 'pointer'}}><X size={20} /></button>
            </div>
            <ul style={{fontSize: '13px', lineHeight: '1.6', color: theme.text, paddingLeft: '20px', margin: 0}}>
              <li style={{marginBottom: '8px'}}><strong>Pions :</strong> Déplacement 1 case en diagonale. Prise avant ET arrière.</li>
              <li style={{marginBottom: '8px'}}><strong style={{color: theme.accent}}>Quantité :</strong> La prise est obligatoire. Vous devez choisir la suite qui capture le plus de pièces.</li>
              <li style={{marginBottom: '8px'}}><strong style={{color: theme.gold}}>Dames :</strong> Traversent toute la diagonale. Prise à distance.</li>
            </ul>
            <TactileButton theme={theme} onClick={() => setShowGuideAide(false)} style={{width: '100%', justifyContent: 'center', marginTop: '16px'}}>Fermer</TactileButton>
          </div>
        </div>
      )}

    </div>
  );
};

// 5. MAIN APP CONTROLLER
const App = () => {
  const WALLET_KEY = 'royale-dames-wallet';
  const loadWallet = () => {
    try {
      const s = localStorage.getItem(WALLET_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed && typeof parsed.usd === 'number' && typeof parsed.dames === 'number') return parsed;
      }
    } catch (_) {}
    return { usd: 0, crypto: 0, dames: 500 };
  };
  const [view, setView] = useState<'splash' | 'accueil' | 'atelier' | 'dashboard' | 'lobby' | 'friend_lobby' | 'game'>('splash');
  const [initialTab, setInitialTab] = useState<'play' | 'bonus' | 'amis'>('play');
  const [user, setUser] = useState<any>(null);
  const [wallet, setWalletState] = useState(loadWallet);
  const setWallet = (updater: React.SetStateAction<{ usd: number; crypto: number; dames: number }>) => {
    setWalletState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem(WALLET_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };
  const [gameConfig, setGameConfig] = useState<any>(null);
  const [pendingAutoMatch, setPendingAutoMatch] = useState<{ bet: number; currency: 'USD' | 'ETH' } | null>(null);
  
  // Customization States
  const [currentTheme, setCurrentTheme] = useState(THEMES.tabac);
  const [currentSkin, setCurrentSkin] = useState('wood');
  
  // Game History State
  const [history, setHistory] = useState([
    { id: '1', date: 'Aujourd\'hui', mode: 'Solo', result: 'win', amount: 20, currency: 'USD' },
    { id: '2', date: 'Hier', mode: 'En ligne', result: 'lose', amount: 0.05, currency: 'ETH' },
    { id: '3', date: '12 Oct', mode: 'Solo', result: 'win', amount: 10, currency: 'USD' },
  ]);

  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(300);

  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return readLaunchParams().room;
  });
  const [friendRoomCode, setFriendRoomCode] = useState<string | null>(null);

  const FRIENDS_KEY = `royale-dames-friends-${user?.id || 'anon'}`;
  const [friends, setFriends] = useState<{ id: string; username: string; name: string }[]>([]);
  const [referralCode, setReferralCode] = useState<string>('');
  const apiBase = (() => {
    try {
      const u = import.meta.env.VITE_WS_URL || '';
      return u ? new URL(u).origin : (typeof window !== 'undefined' ? window.location.origin : '');
    } catch { return ''; }
  })();
  useEffect(() => {
    if (!user?.id) return;
    try {
      const s = localStorage.getItem(`royale-dames-friends-${user.id}`);
      setFriends(s ? JSON.parse(s) : []);
    } catch { setFriends([]); }
  }, [user?.id]);
  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(`royale-dames-friends-${user.id}`, JSON.stringify(friends));
  }, [friends, user?.id]);

  // Récupérer le code de parrainage (pour le lien "Inviter amis")
  useEffect(() => {
    if (!user?.id || !apiBase) return;
    fetch(`${apiBase}/api/referral/code?userId=${encodeURIComponent(user.id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => data?.code && setReferralCode(data.code))
      .catch(() => {});
  }, [user?.id, apiBase]);

  // Stocker ref si présent dans l'URL / fragment / initParams jeu (invité pas encore connecté)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ref = readLaunchParams().ref;
    if (ref) localStorage.setItem('royale-dames-pending-ref', ref);
  }, []);

  // Quand l'utilisateur est connecté : utiliser le code parrain s'il y en a un (invité)
  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id || !apiBase) return;
    const refFromUrl = readLaunchParams().ref;
    const refStored = localStorage.getItem('royale-dames-pending-ref')?.trim().toUpperCase();
    const refToUse = refFromUrl || refStored;
    if (!refToUse) return;
    fetch(`${apiBase}/api/referral/code?userId=${encodeURIComponent(user.id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(my => my?.code === refToUse ? null : refToUse)
      .then(refCode => {
        if (!refCode) return;
        return fetch(`${apiBase}/api/referral/use`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refCode, invitedUserId: user.id, invitedUsername: user.username || user.name || user.id }),
        });
      })
      .then(res => {
        if (res?.ok) {
          localStorage.removeItem('royale-dames-pending-ref');
          const u = new URL(window.location.href);
          u.searchParams.delete('ref');
          window.history.replaceState(null, '', u.pathname + u.search + u.hash);
        }
      })
      .catch(() => {});
  }, [user?.id, user?.username, user?.name, apiBase]);

  // Récupérer parrainages en attente : crédit $DAMES + ajout automatique en amis
  useEffect(() => {
    if (!user?.id || !apiBase) return;
    fetch(`${apiBase}/api/referral/pending?userId=${encodeURIComponent(user.id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list = data?.referrals || [];
        if (list.length === 0) return;
        const REWARD = 50;
        setFriends(prev => {
          const next = [...prev];
          list.forEach((r: { invitedId: string; invitedUsername: string }) => {
            const un = (r.invitedUsername || r.invitedId).trim().replace(/^@/, '');
            if (un && un.length >= 2 && !next.some(f => f.username?.toLowerCase() === un.toLowerCase())) next.push({ id: r.invitedId, username: un, name: `@${un}` });
          });
          return next;
        });
        setWalletState(prev => ({ ...prev, dames: (prev.dames || 0) + REWARD * list.length }));
        return fetch(`${apiBase}/api/referral/credit?userId=${encodeURIComponent(user.id)}`, { method: 'POST' }).then(() => list.length);
      })
      .then(n => { if (typeof n === 'number' && n > 0) (window as any).Telegram?.WebApp?.showAlert?.(`🎉 ${n} ami(s) parrainé(s) ! Tu as reçu ${n * 50} $DAMES.`); })
      .catch(() => {});
  }, [user?.id, apiBase]);

  const addFriend = (u: string) => {
    const un = u.trim().replace(/^@/, '');
    if (!un || un.length < 3) return;
    if (friends.some(f => f.username.toLowerCase() === un.toLowerCase())) return;
    setFriends(prev => [...prev, { id: un, username: un, name: `@${un}` }]);
  };
  const removeFriend = (id: string) => {
    setFriends(prev => prev.filter(f => f.id !== id));
  };

  const multiplayer = useMultiplayer({
    user,
    onRoomCreated: (code) => setFriendRoomCode(code),
    onSpectatorJoined: () => {
      setGameConfig({ mode: 'spectator', bet: 0, currency: 'USD', rules: 'international', isSpectator: true });
      setView('game');
    },
    onGameStarted: (data) => {
      setGameConfig({
        mode: 'multi',
        bet: data.betAmount || 0,
        currency: data.betCurrency || 'USD',
        rules: 'international',
        isSpectator: false,
        multiplayerGameId: data.gameId,
        multiplayerBoard: data.board,
        multiplayerYourColor: data.yourColor,
        multiplayerPlayers: data.players
      });
      setView('game');
    },
    onGameEnded: (data) => {
      const msg = data.winner
        ? (data.winner === data.yourColor ? '🎉 Victoire !' : '😞 Défaite')
        : '🤝 Match nul';
      if (data.winnings) (window as any).Telegram?.WebApp?.showAlert?.(`${msg}\n\n💰 ${data.winnings.amount} ${data.winnings.currency}`);
      else (window as any).Telegram?.WebApp?.showAlert?.(msg);
      setView('dashboard');
    }
  });

  // Paramètres lancement (bot, Web App, message Jeu) : partie en ligne
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const { modeOnline, bet, currency: rawCurrency } = readLaunchParams();
      if (!modeOnline) return;
      const currency: 'USD' | 'ETH' = rawCurrency.toUpperCase() === 'TON' ? 'ETH' : 'USD';
      setPendingAutoMatch({ bet, currency });
    } catch {
      // ignore
    }
  }, []);

  // Jeton signé après clic « Play » sur un message Jeu (setGameScore côté serveur)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search || '');
    const uid = params.get('tg_launch');
    const ts = params.get('tg_ts');
    const sig = params.get('tg_sig');
    if (uid && ts && sig) {
      sessionStorage.setItem('royale-dames-tg-launch', JSON.stringify({ tg_launch: uid, tg_ts: ts, tg_sig: sig }));
      params.delete('tg_launch');
      params.delete('tg_ts');
      params.delete('tg_sig');
      const clean = window.location.pathname + (params.toString() ? `?${params}` : '') + (window.location.hash || '');
      window.history.replaceState(null, '', clean);
    }
  }, []);

  // Plein écran dans Telegram Web App
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.ready();
      tg.enableClosingConfirmation?.();
    }
  }, []);

  const handleLogin = (provider: string, userData?: { id: string; name: string; username?: string; photoUrl?: string }) => {
    const u = userData || { id: '123', name: 'Player One' };
    setUser({ ...u, provider });
    if (pendingRoomCode) {
      setGameConfig({ mode: 'friend', bet: 0, currency: 'USD', rules: 'international', difficulty: 'medium', isSpectator: false });
      setView('friend_lobby');
    } else if (pendingAutoMatch) {
      setView('dashboard');
      handlePlay('multi', pendingAutoMatch.bet, pendingAutoMatch.currency, 'international');
      setPendingAutoMatch(null);
    } else {
      setView('dashboard');
    }
  };

  const goToAccueil = () => setView('accueil');
  const goToDashboard = (tab: 'play' | 'atelier' | 'bonus' | 'amis' = 'play') => {
    setInitialTab(tab === 'atelier' ? 'play' : tab);
    const tg = (window as any).Telegram?.WebApp;
    const u = tg?.initDataUnsafe?.user;
    if (u && !user) {
      const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Joueur';
      handleLogin('telegram', { id: String(u.id), name, username: u.username, photoUrl: u.photo_url });
    } else if (!user) {
      handleLogin('telegram', { id: 'guest', name: 'Joueur', username: undefined });
    } else {
      setView('dashboard');
    }
  };

  // Récupérer le retour Google OAuth (hash avec access_token)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash?.includes('access_token')) {
      const params = new URLSearchParams(hash.slice(1));
      const token = params.get('access_token');
      if (token) {
        fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(profile => {
            handleLogin('google', { id: profile.id, name: profile.name || profile.email, photoUrl: (profile as any).picture });
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          })
          .catch(() => {});
      }
    }
  }, []);

  // Auto-login Telegram déjà géré dans goToDashboard (accueil -> menu)

  const handlePlay = (mode: string, bet: number, currency: string, rules: string, difficulty: AIDifficulty = 'medium') => {
    let usedCurrency = currency;

    if (currency === 'USD' && wallet.usd >= bet && bet > 0) {
      setWallet(prev => ({ ...prev, usd: prev.usd - bet }));
    } else if (currency === 'ETH' && wallet.crypto >= bet && bet > 0) {
      setWallet(prev => ({ ...prev, crypto: prev.crypto - bet }));
    } else if ((wallet.dames || 0) >= bet) {
      usedCurrency = 'DAMES';
      if (bet > 0) {
        setWallet(prev => ({ ...prev, dames: (prev.dames || 0) - bet }));
      }
    } else {
      return alert("Fonds insuffisants. Rechargez votre solde ou complétez des quêtes pour gagner des $Dames.");
    }
    
    setGameConfig({ mode, bet, currency: usedCurrency, rules, difficulty, isSpectator: false });
    
    if (mode === 'multi') {
      setView('lobby');
    } else if (mode === 'friend') {
      setView('friend_lobby');
    } else {
      setView('game');
    }
  };

  const handleSpectate = () => {
     setGameConfig({ mode: 'spectator', bet: 0, currency: 'USD', rules: 'international', isSpectator: true });
     setView('game');
  };

  const handleMatchFound = () => {
    setView('game');
  };

  const handleGameOver = (winner: string) => {
    if (!gameConfig) { setView('dashboard'); return; }
    if (gameConfig.isSpectator) {
      setView('dashboard');
      return;
    }

    if (gameConfig.mode === 'solo' && winner === 'red' && apiBase) {
      const diff = gameConfig.difficulty || 'medium';
      const bonus = diff === 'hard' ? 25 : diff === 'medium' ? 10 : 0;
      const score = 100 + bonus;
      const body: Record<string, unknown> = { score };
      const initData = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp?.initData;
      if (initData) body.initData = initData;
      try {
        const raw = sessionStorage.getItem('royale-dames-tg-launch');
        if (raw) Object.assign(body, JSON.parse(raw));
      } catch {
        /* ignore */
      }
      fetch(`${apiBase}/api/telegram/game-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((r) => {
          if (r.ok) sessionStorage.removeItem('royale-dames-tg-launch');
        })
        .catch(() => {});
    }

    const bet = gameConfig.bet || 0;
    const cur = gameConfig.currency;
    if (winner === 'red') {
      setWallet(prev => ({
        ...prev,
        usd: cur === 'USD' ? prev.usd + bet * 2 : prev.usd,
        crypto: cur === 'ETH' ? prev.crypto + bet * 2 : prev.crypto,
        dames: (prev.dames || 0) + (cur === 'DAMES' ? bet * 2 : 0) + 50
      }));
    } else if (winner === 'draw') {
      setWallet(prev => ({
        ...prev,
        usd: cur === 'USD' ? prev.usd + bet : prev.usd,
        crypto: cur === 'ETH' ? prev.crypto + bet : prev.crypto,
        dames: (prev.dames || 0) + (cur === 'DAMES' ? bet : 0) + 10
      }));
    }
    
    // Add to history
    if (gameConfig.mode !== 'local') {
       const newEntry = {
          id: Date.now().toString(),
          date: 'Aujourd\'hui',
          mode: gameConfig.mode === 'solo' ? 'Solo' : (gameConfig.mode === 'multi' ? 'En ligne' : 'Ami'),
          result: winner === 'red' ? 'win' : (winner === 'white' ? 'lose' : 'draw'),
          amount: gameConfig.bet,
          currency: gameConfig.currency
       };
       setHistory(prev => [newEntry, ...prev]);
    }

    setView('dashboard');
  };

  return (
    <div style={getStyles(currentTheme).container}>
      {view === 'splash' && <SplashScreen onComplete={() => setView('accueil')} theme={currentTheme} />}
      {view === 'accueil' && (
        <AccueilScreen
          onMenu={() => goToDashboard('play')}
          onAtelier={() => setView('atelier')}
          theme={currentTheme}
        />
      )}
      {view === 'atelier' && (
        <AtelierScreen
          onMenu={() => goToDashboard('play')}
          onBack={() => setView('accueil')}
          theme={currentTheme}
          currentTheme={currentTheme}
          setTheme={setCurrentTheme}
          currentSkin={currentSkin}
          setSkin={setCurrentSkin}
          timerEnabled={timerEnabled}
          setTimerEnabled={setTimerEnabled}
          timerSeconds={timerSeconds}
          setTimerSeconds={setTimerSeconds}
        />
      )}
      {view === 'dashboard' && (
        <Dashboard
          initialTab={initialTab}
          user={user}
          wallet={wallet}
          setWallet={setWallet}
          history={history}
          onPlay={handlePlay} 
          onSpectate={handleSpectate} 
          onLogout={() => setView('accueil')} 
          currentTheme={currentTheme}
          setTheme={setCurrentTheme}
          currentSkin={currentSkin}
          setSkin={setCurrentSkin}
          friends={friends}
          addFriend={addFriend}
          removeFriend={removeFriend}
          onlineFriends={multiplayer.onlineFriends}
          invitePlayer={multiplayer.invitePlayer}
          isConnectedMultiplayer={multiplayer.isConnected}
          spectatableGames={multiplayer.spectatableGames}
          requestSpectatableGames={multiplayer.requestSpectatableGames}
          spectateGame={multiplayer.spectateGame}
          onSpectateFriendMatch={(gameId) => {
            multiplayer.spectateGame(gameId);
          }}
          onSpectateDemo={() => {
            setGameConfig({ mode: 'spectator', bet: 0, currency: 'USD', rules: 'international', isSpectator: true });
            setView('game');
          }}
          onJoinRoom={(code: string) => {
            const c = (code || '').trim().toUpperCase();
            if (c.length >= 4) {
              setPendingRoomCode(c);
              setView('friend_lobby');
            }
          }}
          timerEnabled={timerEnabled}
          setTimerEnabled={setTimerEnabled}
          timerSeconds={timerSeconds}
          setTimerSeconds={setTimerSeconds}
          referralCode={referralCode}
        />
      )}
      {view === 'lobby' && (
          <GameLobby
            onMatchFound={handleMatchFound}
            onCancel={() => setView('dashboard')}
            theme={currentTheme}
            isConnected={multiplayer.isConnected}
            searchForMatch={multiplayer.searchForMatch}
            cancelSearch={multiplayer.cancelSearch}
            betAmount={gameConfig?.bet ?? 0}
            currency={gameConfig?.currency ?? 'USD'}
          />
        )}
      {view === 'friend_lobby' && (
        <FriendLobby
          onMatchFound={handleMatchFound}
          onCancel={() => {
            setView('dashboard');
            setPendingRoomCode(null);
            setFriendRoomCode(null);
          }}
          theme={currentTheme}
          code={pendingRoomCode}
          serverCode={friendRoomCode}
          createRoom={multiplayer.createRoom}
          joinRoom={multiplayer.joinRoom}
          betAmount={gameConfig?.bet ?? 0}
          currency={gameConfig?.currency ?? 'USD'}
          friends={friends}
          user={user}
        />
      )}
      {view === 'game' && gameConfig && (
        <BoardGame 
          mode={gameConfig.mode} 
          bet={gameConfig.bet} 
          currency={gameConfig.currency} 
          rules={gameConfig.rules} 
          isSpectator={gameConfig.isSpectator} 
          difficulty={gameConfig.difficulty || 'medium'}
          user={user} 
          onGameOver={handleGameOver}
          theme={currentTheme}
          skin={currentSkin}
          timerEnabled={timerEnabled}
          initialTimerSeconds={timerSeconds}
          multiplayerBoard={multiplayer.currentGame?.board}
          multiplayerTurn={multiplayer.currentGame?.currentTurn}
          onMultiplayerMove={multiplayer.makeMove}
          multiplayerMyColor={multiplayer.currentGame?.yourColor}
          multiplayerResign={multiplayer.resign}
          multiplayerPlayers={multiplayer.currentGame?.players}
        />
      )}
    </div>
  );
};

export default App;