import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useMultiplayer } from './hooks/useMultiplayer';
import { 
  Trophy, 
  User, 
  Wallet, 
  Settings, 
  Coins, 
  Smartphone, 
  Monitor, 
  Globe, 
  Play, 
  Users, 
  LogOut,
  ChevronLeft,
  MessageSquare,
  BookOpen,
  X,
  ScrollText,
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
  Minus
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
  }
};

const PIECE_SKINS = {
  classic: { name: 'Classique', type: 'solid' },
  wood: { name: 'Ébène & Ivoire', type: 'wood' },
  marble: { name: 'Marbre', type: 'marble' },
  neon: { name: 'Néon', type: 'glow' }
};

// --- STYLES GENERATOR ---
const getStyles = (theme: any) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: theme.bg,
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
const TactileButton = ({ onClick, style, children, theme, disabled }: any) => {
  const [isActive, setIsActive] = useState(false);
  const s = getStyles(theme);

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        ...s.button,
        ...style,
        ...(isActive ? s.buttonActive : {}),
        ...(disabled ? { opacity: 0.7, cursor: 'not-allowed' } : {})
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      onMouseLeave={() => setIsActive(false)}
      onTouchStart={() => setIsActive(true)}
      onTouchEnd={() => setIsActive(false)}
      style={{
        ...s.button,
        ...style,
        ...(isActive ? s.buttonActive : {}),
        ...(disabled ? { opacity: 0.7, cursor: 'not-allowed' } : {})
      }}
    >
      {children}
    </button>
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

// 1. LOGIN SCREEN — Connexion Google et Telegram fonctionnelle
const LoginScreen = ({ onLogin, theme }: any) => {
  const s = getStyles(theme);
  const [loading, setLoading] = useState<'google' | 'telegram' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTelegram = () => {
    setLoading('telegram');
    setError(null);
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Joueur Telegram';
      onLogin('telegram', { id: String(u.id), name, username: u.username });
    } else {
      setLoading(null);
      setError('Ouvre l\'app depuis Telegram (@royaledamesbot) pour te connecter avec ton compte.');
    }
  };

  const handleGoogle = () => {
    setLoading('google');
    setError(null);
    // Google OAuth : configure VITE_GOOGLE_CLIENT_ID dans .env pour une vraie connexion.
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (clientId) {
      const redirect = encodeURIComponent(window.location.origin + window.location.pathname);
      const scope = encodeURIComponent('openid email profile');
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirect}&response_type=token&scope=${scope}`;
    } else {
      setTimeout(() => {
        setLoading(null);
        onLogin('google', { id: 'demo', name: 'Joueur Google (démo)' });
      }, 1000);
    }
  };

  return (
    <div style={s.main}>
      <div style={{...s.panel, animation: 'fadeIn 0.6s ease-out'}}>
        <div style={{
          width: '70px', height: '70px', margin: '0 auto 16px', 
          background: `radial-gradient(circle at 30% 30%, ${theme.gold}, ${theme.goldDim})`,
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 30px ${theme.goldDim}`
        }}>
          <Trophy size={32} color="#2a1a08" />
        </div>
        <h1 style={{...s.logo, fontSize: '28px', marginBottom: '6px'}}>ROYAL DAMES</h1>
        <p style={{color: theme.textDim, marginBottom: '32px', fontSize: '12px', letterSpacing: '0.5px'}}>LE CERCLE DES STRATÈGES</p>
        
        {error && <div style={{marginBottom: '16px', padding: '10px', background: 'rgba(220,53,69,0.2)', borderRadius: '8px', color: '#dc3545', fontSize: '12px'}}>{error}</div>}
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <TactileButton 
            theme={theme}
            onClick={handleGoogle}
            style={{background: 'linear-gradient(180deg, #dd4b39 0%, #c23321 100%)', boxShadow: '0 4px 0 #901e0f', color: 'white'}}
            disabled={loading !== null}
          >
            {loading === 'google' ? 'Connexion...' : <><Globe size={18} /> Google</>}
          </TactileButton>
          <TactileButton 
            theme={theme}
            onClick={handleTelegram}
            style={{background: 'linear-gradient(180deg, #29b6f6 0%, #0288d1 100%)', boxShadow: '0 4px 0 #01579b', color: 'white'}}
            disabled={loading !== null}
          >
            {loading === 'telegram' ? 'Connexion...' : <><MessageSquare size={18} /> Telegram</>}
          </TactileButton>
        </div>
        
        <div style={{marginTop: '24px', fontSize: '10px', color: theme.textDim, opacity: 0.7}}>
          En entrant, vous acceptez les règles du club et la politique de jeu responsable.
        </div>
      </div>
    </div>
  );
};

// 2. MAIN MENU / DASHBOARD
const Dashboard = ({ user, wallet, history, onPlay, onSpectate, onLogout, currentTheme, setTheme, currentSkin, setSkin, friends = [], addFriend, removeFriend, onlineFriends = [], invitePlayer, isConnectedMultiplayer = false }: any) => {
  const [currency, setCurrency] = useState<'USD' | 'ETH'>('USD');
  const [betAmount, setBetAmount] = useState(10);
  const [rules, setRules] = useState<'standard' | 'international'>('international'); 
  const [tab, setTab] = useState<'play' | 'atelier' | 'historique' | 'coffre' | 'amis'>('play');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [connectedWallets, setConnectedWallets] = useState<{ metamask?: string; ton?: string }>({});
  const [newFriendUsername, setNewFriendUsername] = useState('');
  
  const [pendingChange, setPendingChange] = useState<{ type: 'theme' | 'skin', value: any } | null>(null);

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

  const connectTON = () => {
    alert('Connexion TON Wallet bientôt disponible. Utilise le réseau TON dans ton wallet compatible.');
    setShowWalletModal(false);
  };

  const s = getStyles(currentTheme);

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
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: `1px solid ${currentTheme.textDim}`, paddingBottom: '12px'}}>
           <div style={{display: 'flex', alignItems: 'center', gap: '14px'}}>
              {/* Avatar with Rank Badge */}
              <div style={{position: 'relative'}}>
                  <div style={{
                      width: '44px', height: '44px', borderRadius: '50%', 
                      background: `linear-gradient(135deg, ${currentTheme.gold}, ${currentTheme.goldDim})`, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      border: '2px solid rgba(255,255,255,0.1)',
                      boxShadow: `0 0 15px ${currentTheme.gold}30`
                  }}>
                    <User color="#2a1a08" size={24} />
                  </div>
                  <div style={{
                      position: 'absolute', bottom: -2, right: -4, 
                      background: currentTheme.bg, 
                      borderRadius: '50%', padding: '2px',
                      border: `1px solid ${currentTheme.gold}`
                  }}>
                      <div style={{
                          background: currentTheme.gold, borderRadius: '50%', 
                          width: '16px', height: '16px', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                         <Crown size={10} color="#2a1a08" strokeWidth={3} />
                      </div>
                  </div>
              </div>
              
              <div style={{textAlign: 'left'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div style={{fontWeight: '900', fontSize: '16px', color: currentTheme.text, letterSpacing: '0.5px'}}>
                        {user.name}
                    </div>
                    <div style={{
                        padding: '2px 6px', borderRadius: '4px', 
                        background: `linear-gradient(90deg, ${currentTheme.gold}, ${currentTheme.goldDim})`,
                        color: '#2a1a08', fontSize: '9px', fontWeight: '800',
                        textTransform: 'uppercase', letterSpacing: '1px',
                        boxShadow: `0 2px 5px ${currentTheme.gold}40`
                    }}>
                        VIP
                    </div>
                </div>
                <div style={{
                    color: currentTheme.textDim, fontSize: '11px', fontWeight: '500', 
                    marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    <span style={{width: '6px', height: '6px', borderRadius: '50%', background: currentTheme.success, boxShadow: `0 0 5px ${currentTheme.success}`}}></span>
                    Grand Maître
                </div>
              </div>
           </div>
           
           <button onClick={onLogout} style={{
               background: 'rgba(255,255,255,0.05)', border: `1px solid ${currentTheme.textDim}40`, 
               color: currentTheme.textDim, cursor: 'pointer', padding: '8px', borderRadius: '8px',
               transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
           }}>
             <LogOut size={16} />
           </button>
        </div>

        {/* TABS */}
        <div style={{display: 'flex', gap: '8px', marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px'}}>
           <button 
             onClick={() => setTab('play')} 
             style={{flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: tab === 'play' ? currentTheme.gold : 'transparent', color: tab === 'play' ? '#2a1a08' : currentTheme.textDim, fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'}}
           >
             JOUER
           </button>
           <button 
             onClick={() => setTab('atelier')} 
             style={{flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: tab === 'atelier' ? currentTheme.gold : 'transparent', color: tab === 'atelier' ? '#2a1a08' : currentTheme.textDim, fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s'}}
           >
             ATELIER
           </button>
           <button 
             onClick={() => setTab('historique')} 
             style={{flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: tab === 'historique' ? currentTheme.gold : 'transparent', color: tab === 'historique' ? '#2a1a08' : currentTheme.textDim, fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s'}}
           >
             HISTO.
           </button>
           <button 
             onClick={() => setTab('coffre')} 
             style={{flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: tab === 'coffre' ? currentTheme.gold : 'transparent', color: tab === 'coffre' ? '#2a1a08' : currentTheme.textDim, fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s'}}
           >
             COFFRE
           </button>
           <button 
             onClick={() => setTab('amis')} 
             style={{flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: tab === 'amis' ? currentTheme.gold : 'transparent', color: tab === 'amis' ? '#2a1a08' : currentTheme.textDim, fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s'}}
           >
             AMIS
           </button>
        </div>

        {tab === 'play' && (
          <>
            {/* Wallet */}
            <div style={{background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '14px', marginBottom: '20px', border: `1px solid rgba(255,255,255,0.05)`}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                <span style={{color: currentTheme.textDim, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px'}}>Solde</span>
                <div style={{display: 'flex', gap: '6px'}}>
                  <span onClick={() => setCurrency('USD')} style={{...s.chip, ...(currency === 'USD' ? s.chipActive : {})}}>USD</span>
                  <span onClick={() => setCurrency('ETH')} style={{...s.chip, ...(currency === 'ETH' ? s.chipActive : {})}}>CRYPTO</span>
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between'}}>
                <div style={{fontSize: '28px', fontWeight: '900', fontFamily: currentTheme.fontMain, color: currentTheme.text, textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
                  {currency === 'USD' ? `$${wallet.usd.toLocaleString()}` : `${wallet.crypto.toFixed(4)} ETH`}
                </div>
                <button 
                  onClick={() => setShowWalletModal(true)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${currentTheme.gold}`,
                    color: currentTheme.gold,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '10px',
                    fontWeight: '800',
                    transition: 'all 0.2s',
                    marginBottom: '4px'
                  }}
                >
                  <Wallet size={14} strokeWidth={2.5} />
                  {connectedWallets.metamask || connectedWallets.ton ? 'Connecté' : (currency === 'ETH' ? 'CONNECTER' : 'WALLET')}
                </button>
              </div>
            </div>

            {/* Config Grid */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '20px'}}>
               {/* Bet */}
               <div>
                  <label style={{color: currentTheme.textDim, fontSize: '11px', display: 'block', marginBottom: '6px', textAlign: 'left'}}>MISE</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '10px'}}>
                    <button onClick={() => setBetAmount(Math.max(5, betAmount - 5))} style={{width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: currentTheme.text, fontSize: '18px', cursor: 'pointer'}}>-</button>
                    <div style={{flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '18px', fontFamily: currentTheme.fontMain}}>{currency === 'USD' ? '$' : 'Ξ'}{betAmount}</div>
                    <button onClick={() => setBetAmount(betAmount + 5)} style={{width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: currentTheme.text, fontSize: '18px', cursor: 'pointer'}}>+</button>
                  </div>
               </div>

               {/* Rules */}
               <div>
                 <label style={{color: currentTheme.textDim, fontSize: '11px', display: 'block', marginBottom: '6px', textAlign: 'left'}}>RÈGLES</label>
                 <div style={{display: 'flex', gap: '8px'}}>
                    {/* Simplified for the update, keeping UI but logic is forced International 10x10 */}
                    <RuleButton 
                      label="STANDARD" 
                      value="standard" 
                      isSelected={false} 
                      onClick={() => alert("Ce mode est temporairement désactivé pour la compétition Grand Maître (10x10 uniquement).")} 
                      theme={currentTheme} 
                    />
                    <RuleButton 
                      label="INTL" 
                      value="international" 
                      isSelected={true} 
                      onClick={setRules} 
                      theme={currentTheme} 
                    />
                 </div>
               </div>
            </div>

            {/* Selected Bet Indicator (Added feature) */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              marginBottom: '20px', padding: '10px',
              background: `linear-gradient(90deg, transparent 0%, rgba(${parseInt(currentTheme.gold.slice(1,3),16)}, ${parseInt(currentTheme.gold.slice(3,5),16)}, ${parseInt(currentTheme.gold.slice(5,7),16)}, 0.1) 50%, transparent 100%)`,
              borderTop: `1px solid rgba(${parseInt(currentTheme.gold.slice(1,3),16)}, ${parseInt(currentTheme.gold.slice(3,5),16)}, ${parseInt(currentTheme.gold.slice(5,7),16)}, 0.3)`,
              borderBottom: `1px solid rgba(${parseInt(currentTheme.gold.slice(1,3),16)}, ${parseInt(currentTheme.gold.slice(3,5),16)}, ${parseInt(currentTheme.gold.slice(5,7),16)}, 0.3)`
            }}>
               <span style={{fontFamily: currentTheme.fontBody, fontSize: '11px', color: currentTheme.textDim, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600}}>
                 Mise en jeu :
               </span>
               <span style={{
                 fontFamily: currentTheme.fontMain, 
                 fontSize: '18px', 
                 color: currentTheme.gold, 
                 fontWeight: '900', 
                 textShadow: `0 0 10px ${currentTheme.goldDim}`,
                 display: 'flex', alignItems: 'center', gap: '4px'
               }}>
                 {currency === 'USD' ? <span style={{fontSize: '16px'}}>$</span> : <span style={{fontSize: '16px'}}>Ξ</span>}
                 {betAmount}
               </span>
            </div>

            {/* Action Buttons */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px'}}>
              <TactileButton theme={currentTheme} onClick={() => onPlay('solo', betAmount, currency, rules)} style={{flexDirection: 'column', padding: '20px 12px', background: 'linear-gradient(180deg, #5d4037 0%, #3e2723 100%)', boxShadow: '0 4px 0 #2b1d16', color: '#e6d5ac', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
                <Monitor size={24} style={{marginBottom: '4px', opacity: 0.8}} />
                <span>SOLO</span>
              </TactileButton>
              <TactileButton theme={currentTheme} onClick={() => onPlay('multi', betAmount, currency, rules)} style={{flexDirection: 'column', padding: '20px 12px'}}>
                <Users size={24} style={{marginBottom: '4px'}} />
                <span>EN LIGNE</span>
              </TactileButton>
            </div>

            <TactileButton 
              theme={currentTheme} 
              onClick={() => onPlay('friend', betAmount, currency, rules)} 
              style={{
                width: '100%', 
                flexDirection: 'row', 
                gap: '10px',
                background: `linear-gradient(180deg, ${currentTheme.success} 0%, #1e8449 100%)`, 
                boxShadow: `0 4px 0 #145a32`, 
                color: 'white',
                borderTop: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <UserPlus size={20} />
              <span>INVITER UN AMI</span>
            </TactileButton>

            <TactileButton 
              theme={currentTheme} 
              onClick={() => onPlay('local', 0, 'USD', rules)} 
              style={{
                width: '100%', 
                marginTop: '12px',
                flexDirection: 'row', 
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.1)', 
                boxShadow: 'none',
                border: `1px solid ${currentTheme.textDim}`,
                color: currentTheme.text
              }}
            >
              <Smartphone size={20} />
              <span>1 vs 1 LOCAL (SANS MISE)</span>
            </TactileButton>

            <TactileButton 
              theme={currentTheme} 
              onClick={onSpectate} 
              style={{
                width: '100%', 
                marginTop: '12px',
                flexDirection: 'row', 
                gap: '10px',
                background: 'rgba(0, 0, 0, 0.3)', 
                boxShadow: 'none',
                border: `1px solid ${currentTheme.accent}`,
                color: currentTheme.accent
              }}
            >
              <Tv size={20} />
              <span>MODE SPECTATEUR (DÉMO)</span>
            </TactileButton>
          </>
        )}
        
        {tab === 'atelier' && (
          /* ATELIER TAB */
          <div style={{textAlign: 'left'}}>
            
            <h3 style={{fontFamily: currentTheme.fontMain, color: currentTheme.gold, borderBottom: `1px solid ${currentTheme.textDim}`, paddingBottom: '6px', marginBottom: '12px', fontSize: '16px'}}>Thème de la Salle</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px'}}>
              {Object.values(THEMES).map((t: any) => (
                <div 
                  key={t.id} 
                  onClick={() => handleThemeClick(t)}
                  style={{
                    padding: '8px', borderRadius: '10px', 
                    background: t.id === currentTheme.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: t.id === currentTheme.id ? `1px solid ${currentTheme.gold}` : '1px solid transparent',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                  }}
                >
                  <div style={{width: '32px', height: '32px', borderRadius: '50%', background: t.bgGradient, border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 10px rgba(0,0,0,0.5)'}} />
                  <span style={{fontSize: '11px', color: t.id === currentTheme.id ? currentTheme.gold : currentTheme.textDim, fontWeight: 'bold'}}>{t.name}</span>
                </div>
              ))}
            </div>

            <h3 style={{fontFamily: currentTheme.fontMain, color: currentTheme.gold, borderBottom: `1px solid ${currentTheme.textDim}`, paddingBottom: '6px', marginBottom: '12px', fontSize: '16px'}}>Finition des Pions</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
               {Object.entries(PIECE_SKINS).map(([key, skin]: any) => (
                 <div 
                   key={key}
                   onClick={() => handleSkinClick(key)}
                   style={{
                     padding: '10px', borderRadius: '10px',
                     background: 'rgba(0,0,0,0.2)',
                     border: currentSkin === key ? `1px solid ${currentTheme.gold}` : '1px solid transparent',
                     display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'
                   }}
                 >
                   {/* Piece Preview */}
                   <div style={{
                     width: '24px', height: '24px', borderRadius: '50%',
                     background: key === 'wood' ? 'radial-gradient(circle, #8b4513, #3e2723)' : 
                                 key === 'marble' ? 'radial-gradient(circle at 30% 30%, #fff, #bdc3c7)' :
                                 key === 'neon' ? '#333' : '#d63031',
                     boxShadow: key === 'neon' ? `0 0 10px ${currentTheme.accent}` : '0 2px 5px rgba(0,0,0,0.5)',
                     border: key === 'neon' ? `2px solid ${currentTheme.accent}` : 'none'
                   }} />
                   <span style={{fontSize: '12px', color: currentSkin === key ? currentTheme.text : currentTheme.textDim}}>{skin.name}</span>
                   {currentSkin === key && <Check size={14} color={currentTheme.gold} style={{marginLeft: 'auto'}} />}
                 </div>
               ))}
            </div>
            
            <div style={{marginTop: '24px', padding: '12px', background: 'rgba(197, 160, 89, 0.1)', borderRadius: '10px', fontSize: '11px', color: currentTheme.textDim, fontStyle: 'italic'}}>
               Confirmez votre choix pour appliquer le nouveau style.
            </div>

          </div>
        )}

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
            <div style={{display: 'flex', gap: '8px', marginBottom: '20px'}}>
              <input
                type="text"
                placeholder="@username"
                value={newFriendUsername}
                onChange={e => setNewFriendUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: '10px', border: `1px solid ${currentTheme.textDim}40`,
                  background: 'rgba(0,0,0,0.2)', color: currentTheme.text, fontSize: '14px'
                }}
              />
              <button
                onClick={handleAddFriend}
                style={{
                  padding: '10px 16px', borderRadius: '10px', border: 'none', background: currentTheme.gold, color: '#2a1a08',
                  fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <UserPlus size={18} /> Ajouter
              </button>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {friends.length === 0 ? (
                <div style={{color: currentTheme.textDim, fontSize: '13px', fontStyle: 'italic', padding: '20px', textAlign: 'center'}}>
                  Aucun ami. Ajoute un @username ci-dessus.
                </div>
              ) : (
                friends.map(f => (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px',
                    background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: `1px solid ${currentTheme.textDim}30`
                  }}>
                    <span style={{color: currentTheme.text, fontWeight: '600'}}>@{f.username}</span>
                    <div style={{display: 'flex', gap: '8px'}}>
                      {(() => {
                        const onlineFriend = onlineFriends?.find((of: any) => 
                          of.username?.toLowerCase() === f.username?.toLowerCase() || of.id === f.id
                        );
                        const isOnline = !!onlineFriend && isConnectedMultiplayer;
                        return isOnline ? (
                          <button
                            onClick={() => invitePlayer?.(onlineFriend.id, betAmount, currency === 'ETH' ? 'TON' : undefined)}
                            style={{
                              padding: '6px 12px', borderRadius: '8px', border: 'none', background: currentTheme.success, color: 'white',
                              fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <Play size={14} /> En ligne - Inviter
                          </button>
                        ) : (
                          <button
                            onClick={() => onPlay('friend', betAmount, currency === 'USD' ? 'USD' : 'ETH', rules)}
                            style={{
                              padding: '6px 12px', borderRadius: '8px', border: 'none', background: currentTheme.gold, color: '#2a1a08',
                              fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <Play size={14} /> Inviter (lien)
                          </button>
                        );
                      })()}
                      <button
                        onClick={() => removeFriend?.(f.id)}
                        style={{
                          padding: '6px', borderRadius: '8px', border: `1px solid ${currentTheme.textDim}60`, background: 'transparent',
                          color: currentTheme.textDim, cursor: 'pointer'
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
            <h3 style={{fontFamily: currentTheme.fontMain, color: currentTheme.gold, borderBottom: `1px solid ${currentTheme.textDim}`, paddingBottom: '6px', marginBottom: '12px', fontSize: '16px'}}>🔐 Coffre sécurisé</h3>
            <p style={{color: currentTheme.textDim, fontSize: '12px', marginBottom: '20px'}}>Ajoute de l'argent fiat à ton coffre pour jouer en toute sécurité.</p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <button
                onClick={() => alert('Orange Money - Intégration en cours. Configure ton partenaire paiement pour activer.')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                  background: 'linear-gradient(90deg, #ff6600 0%, #cc5200 100%)',
                  border: 'none', borderRadius: '12px', color: 'white',
                  cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(255,102,0,0.3)'
                }}
              >
                <div style={{width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>📱</div>
                Orange Money
              </button>
              <button
                onClick={() => alert('Wave - Intégration en cours. Configure ton partenaire paiement pour activer.')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                  background: 'linear-gradient(90deg, #00d4aa 0%, #00a884 100%)',
                  border: 'none', borderRadius: '12px', color: 'white',
                  cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(0,212,170,0.3)'
                }}
              >
                <div style={{width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>📱</div>
                Wave
              </button>
            </div>
            <div style={{marginTop: '20px', padding: '12px', background: 'rgba(197, 160, 89, 0.1)', borderRadius: '10px', fontSize: '11px', color: currentTheme.textDim, fontStyle: 'italic'}}>
              Ton argent est sécurisé. Les moyens de paiement sont en cours d'intégration.
            </div>
          </div>
        )}

      </div>

      {/* WALLET CONNECT MODAL */}
      {showWalletModal && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 115,
          backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{...s.panel, maxWidth: '360px', border: `1px solid ${currentTheme.gold}`}}>
            <h3 style={{margin: '0 0 12px 0', fontFamily: currentTheme.fontMain, color: currentTheme.gold, fontSize: '18px'}}>Connecter un wallet</h3>
            <p style={{color: currentTheme.textDim, marginBottom: '20px', fontSize: '13px'}}>Choisis ton wallet crypto pour jouer.</p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {(typeof window !== 'undefined' && (window as any).Telegram?.WebApp) && (
                <button
                  onClick={() => {
                    const tg = (window as any).Telegram?.WebApp;
                    if (tg?.openLink) tg.openLink('https://t.me/wallet/start');
                    else if (tg?.openTelegramLink) tg.openTelegramLink('https://t.me/wallet/start');
                    else window.open('https://t.me/wallet/start', '_blank');
                    setConnectedWallets(prev => ({ ...prev, ton: 'telegram' }));
                    setShowWalletModal(false);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                    background: 'linear-gradient(90deg, #229ED9 0%, #0088cc 100%)',
                    border: 'none', borderRadius: '12px', color: 'white',
                    cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
                  }}
                >
                  <MessageSquare size={24} />
                  Portefeuille Telegram (TON)
                </button>
              )}
              <button
                onClick={connectMetaMask}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                  background: 'linear-gradient(90deg, #f6851b 0%, #e2761b 100%)',
                  border: 'none', borderRadius: '12px', color: 'white',
                  cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
                }}
              >
                <Wallet size={24} />
                MetaMask
              </button>
              <button
                onClick={connectTON}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                  background: 'linear-gradient(90deg, #0098ea 0%, #0077c8 100%)',
                  border: 'none', borderRadius: '12px', color: 'white',
                  cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
                }}
              >
                <Wallet size={24} />
                TON Wallet (externe)
              </button>
            </div>
            <button onClick={() => setShowWalletModal(false)} style={{...s.secondaryButton, marginTop: '16px', width: '100%'}}>Fermer</button>
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

// 3. GAME LOBBY
const GameLobby = ({ onMatchFound, onCancel, theme }: any) => {
  const s = getStyles(theme);
  useEffect(() => {
    const timer = setTimeout(() => onMatchFound(), 3000);
    return () => clearTimeout(timer);
  }, []);

  const startVsAI = () => {
    onMatchFound();
  };

  return (
    <div style={s.main}>
      <div style={s.panel}>
        <div style={{margin: '20px auto', width: '50px', height: '50px', border: `3px solid ${theme.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}} />
        <h2 style={{fontFamily: theme.fontMain, color: theme.gold, fontSize: '20px'}}>Recherche d'adversaire...</h2>
        <p style={{color: theme.textDim, fontSize: '12px', marginBottom: '8px'}}>Matchmaking en simulation • Pas de serveur multijoueur actif</p>
        <p style={{color: theme.textDim, fontSize: '11px', fontStyle: 'italic', marginBottom: '20px'}}>En attendant un adversaire réel, lance une partie vs l'IA !</p>
        <button
          onClick={startVsAI}
          style={{
            ...s.button,
            width: '100%',
            marginBottom: '12px',
            background: `linear-gradient(90deg, ${theme.gold}, ${theme.goldDim})`,
            color: '#2a1a08'
          }}
        >
          <Play size={18} style={{marginRight: '8px'}} /> Jouer vs IA maintenant
        </button>
        <button onClick={onCancel} style={s.secondaryButton}>Annuler</button>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// 3.5 FRIEND LOBBY (New)
const FriendLobby = ({ onMatchFound, onCancel, theme, code: initialCode, friends = [] }: any) => {
  const s = getStyles(theme);
  const [code] = useState(() =>
    initialCode && typeof initialCode === 'string'
      ? initialCode.toUpperCase()
      : Math.random().toString(36).substring(2, 8).toUpperCase()
  );
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://royale-dames.vercel.app';
  const joinUrl = `${baseUrl}?room=${code}`;

  useEffect(() => {
    // Simulate friend joining after delay for demo (no backend yet)
    const timer = setTimeout(() => {
       onMatchFound();
    }, 8000); 
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Royale Dames - Duel',
          text: `Rejoins-moi pour une partie ! Code : ${code}\n${joinUrl}`,
          url: joinUrl
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      handleCopy();
    }
  };

  const shareToTelegram = (username?: string) => {
    const text = encodeURIComponent(`Rejoins-moi pour une partie de dames ! Code : ${code}\n${joinUrl}`);
    const url = username
      ? `https://t.me/share/url?url=${encodeURIComponent(joinUrl)}&text=${text}`
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
        <h2 style={{fontFamily: theme.fontMain, color: theme.gold, marginBottom: '6px', fontSize: '20px'}}>SALLE PRIVÉE</h2>
        <p style={{color: theme.textDim, marginBottom: '24px', fontSize: '13px'}}>Partage ce code avec ton ami pour commencer.</p>
        
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

        <div style={{display: 'flex', gap: '10px', marginBottom: friends.length ? '16px' : '24px'}}>
           <button onClick={handleCopy} style={{...s.secondaryButton, flex: 1, marginTop: 0, background: copied ? theme.success : 'rgba(0,0,0,0.2)', color: copied ? '#fff' : theme.textDim, border: copied ? '1px solid transparent' : s.secondaryButton.border}}>
             {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copié !' : 'Copier'}
           </button>
           <button onClick={handleShare} style={{...s.secondaryButton, flex: 1, marginTop: 0}}>
             <Share2 size={16} /> Partager
           </button>
        </div>

        {friends.length > 0 && (
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
const BoardGame = ({ mode, bet, currency, rules, onGameOver, user, isSpectator = false, theme, skin, multiplayerBoard, multiplayerTurn, onMultiplayerMove, multiplayerMyColor, multiplayerResign }: any) => {
  const isMultiplayer = !!(multiplayerBoard && onMultiplayerMove);
  const [board, setBoard] = useState<Board>(multiplayerBoard || INITIAL_BOARD);
  const [turn, setTurn] = useState<'red' | 'white'>(multiplayerTurn || 'red');
  const [selected, setSelected] = useState<Position | null>(null);
  
  // validMoves is now a list of Move objects
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  
  const [lastMovedPos, setLastMovedPos] = useState<Position | null>(null);
  const [winner, setWinner] = useState<'red' | 'white' | 'draw' | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Sync multiplayer board/turn from props
  useEffect(() => {
    if (multiplayerBoard) setBoard(multiplayerBoard);
  }, [multiplayerBoard]);
  useEffect(() => {
    if (multiplayerTurn !== undefined) setTurn(multiplayerTurn);
  }, [multiplayerTurn]);
  
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

  // --- PIECE RENDERER ---
  const getPieceStyle = (color: 'red' | 'white', isKing: boolean, isSelected: boolean) => {
     let background = '';
     let boxShadow = '0 5px 5px rgba(0,0,0,0.4), inset 0 -4px 4px rgba(0,0,0,0.2)';
     let border = isSelected ? `2px solid ${theme.gold}` : 'none';

     if (skin === 'wood') {
        background = color === 'red' 
          ? `radial-gradient(circle at 35% 35%, #8b4513, #3e2723)` // Dark Wood
          : `radial-gradient(circle at 35% 35%, #deb887, #8b4513)`; // Light Wood
     } else if (skin === 'marble') {
        background = color === 'red'
          ? `radial-gradient(circle at 30% 30%, #e74c3c, #8e44ad)` // Ruby/Onyx
          : `radial-gradient(circle at 30% 30%, #fff, #bdc3c7)`; // Marble
     } else if (skin === 'neon') {
        background = '#222';
        boxShadow = color === 'red' 
           ? `0 0 10px ${theme.accent}, inset 0 0 10px ${theme.accent}` 
           : `0 0 10px #fff, inset 0 0 10px #fff`;
        border = isSelected ? `2px solid ${theme.gold}` : `2px solid ${color === 'red' ? theme.accent : '#fff'}`;
     } else {
        // Classic
        background = color === 'red' 
          ? `radial-gradient(circle at 30% 30%, #ff6b6b, #c0392b)` 
          : `radial-gradient(circle at 30% 30%, #fff, #bdc3c7)`;
     }

     return {
       width: '82%', height: '82%', borderRadius: '50%',
       background, boxShadow, border,
       display: 'flex', alignItems: 'center', justifyContent: 'center',
       transform: 'scale(1)', zIndex: 10,
       transition: 'all 0.2s',
       position: 'relative' as 'relative'
     };
  };

  // --- CAPTURED PIECES INDICATOR (Updated for 20 pieces) ---
  const redCount = board.flat().filter(p => p?.color === 'red').length;
  const whiteCount = board.flat().filter(p => p?.color === 'white').length;
  const redLost = 20 - redCount; 
  const whiteLost = 20 - whiteCount;

  const CapturedPieces = ({ color, count }: { color: 'red' | 'white', count: number }) => (
    <div style={{
      display: 'flex', gap: '3px', flexWrap: 'wrap', maxWidth: '120px', marginTop: '4px',
      background: 'rgba(0,0,0,0.2)', padding: '4px 6px', borderRadius: '8px', border: `1px solid ${theme.panelBorder}`,
      minHeight: '22px', alignItems: 'center'
    }}>
      {count === 0 && <span style={{fontSize: '9px', color: theme.textDim, fontStyle: 'italic', paddingLeft: '4px'}}>0 prise</span>}
      {Array.from({length: Math.min(count, 10)}).map((_, i) => (
         <div key={i} style={{
           width: '10px', height: '10px', borderRadius: '50%',
           background: color === 'red' 
             ? (skin === 'wood' ? 'radial-gradient(circle at 30% 30%, #8b4513, #3e2723)' : '#d63031') 
             : (skin === 'wood' ? 'radial-gradient(circle at 30% 30%, #deb887, #8b4513)' : '#f5f6fa'),
           boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
           border: '1px solid rgba(255,255,255,0.2)',
           opacity: 0.5, 
         }} />
      ))}
      {count > 10 && <span style={{fontSize: '9px', color: theme.textDim}}>+{count-10}</span>}
    </div>
  );

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
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[move.from.r][move.from.c]!;
    
    // Move
    newBoard[move.to.r][move.to.c] = piece;
    newBoard[move.from.r][move.from.c] = null;

    // Remove Captures
    move.captures.forEach(pos => {
        newBoard[pos.r][pos.c] = null;
    });

    // Promotion logic (International: Must stop on last row)
    // However, if the capture sequence continues, it doesn't promote (passing through).
    // Our simplified recursion logic handled the move chain as atomic, so we promote if end position is last row.
    let promoted = false;
    if ((piece.color === 'red' && move.to.r === 0) || (piece.color === 'white' && move.to.r === BOARD_SIZE - 1)) {
        if (!piece.isKing) {
            piece.isKing = true;
            promoted = true;
        }
    }

    setBoard(newBoard);
    setLastMovedPos(move.to);
    setSelected(null);
    
    if (promoted) {
        playSound('promote');
        triggerHaptic('promote');
    } else if (move.captures.length > 0) {
        playSound('capture');
        triggerHaptic('capture');
    } else {
        playSound('move');
        triggerHaptic('move');
    }

    // Check Win (delayed for sound effect)
    if (validMoves.length === 0) { // Note: this check needs to run after state update properly or inside effect
        // Handled by useEffect
    } else {
         // Logic handled in useEffect
    }

    // Change turn
    setTurn(prev => prev === 'red' ? 'white' : 'red');
  };

  // AI & Spectator Logic (Simplified Random Mover for demo)
  useEffect(() => {
    if (isPaused) return;

    if ((isSpectator && !winner) || (mode === 'solo' && turn === 'white' && !winner) || ((mode === 'multi' || mode === 'friend') && !isMultiplayer && turn === 'white' && !winner)) {
       
       if (validMoves.length === 0) return; // Should be game over, handled by other effect

       setAiThinking(true);
       const delay = 800;
       
       const timer = setTimeout(() => {
          // AI Logic: Pick random valid move (Valid moves are already filtered by Max Capture rule)
          const move = validMoves[Math.floor(Math.random() * validMoves.length)];
          if (move) executeMove(move);
          setAiThinking(false);
       }, delay);

       return () => clearTimeout(timer);
    }
  }, [turn, mode, winner, isSpectator, isPaused, validMoves]); 
  
  // Trigger Win/Loss Sound when winner state changes
  useEffect(() => {
    if (winner) {
        if (winner === 'red' && !isSpectator) playSound('win');
        else if (winner === 'white' && !isSpectator) playSound('lose');
    }
  }, [winner, isSpectator]);


  // Determine Opponent Name
  const opponentName = isSpectator 
    ? "Match en direct" 
    : (mode === 'solo' ? "GrandMaster Bot" : (mode === 'friend' ? "Ami Invité" : (mode === 'local' ? "Joueur 2" : "Adversaire en ligne")));

  return (
    <div style={s.main}>
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
         `}
       </style>

      {/* HUD */}
      <div style={{width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px'}}>
        <div style={{textAlign: 'left'}}>
          <div style={{color: turn === 'red' ? theme.accent : theme.text, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px'}}>
             {isSpectator && <Eye size={14} color={theme.gold} />}
             {isSpectator 
               ? (turn === 'red' ? 'Tour des Rouges' : 'Tour des Blancs')
               : (mode === 'local' 
                    ? (turn === 'red' ? 'Tour Joueur 1 (Rouge)' : 'Tour Joueur 2 (Blanc)') 
                    : (turn === 'red' ? 'Votre Tour' : 'Attente...'))
             }
          </div>
          <div style={{fontSize: '18px', fontFamily: theme.fontMain, color: theme.text}}>
             {isSpectator ? 'SPECTATEUR' : user.name}
          </div>
          {/* PLAYER CAPTURED PIECES (Pieces I captured from white) */}
          <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px'}}>
             <span style={{fontSize: '9px', color: theme.textDim, textTransform: 'uppercase'}}>Capturés:</span>
             <CapturedPieces color="white" count={whiteLost} />
          </div>
        </div>
        <div style={{textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
          <div style={{color: theme.textDim, fontSize: '10px'}}>POT ACTUEL</div>
          <div style={{fontSize: '18px', color: theme.gold, fontFamily: theme.fontMain}}>
            {currency === 'USD' ? '$' : 'ETH'} {bet * 2}
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px'}}>
            <button onClick={() => setSoundEnabled(!soundEnabled)} style={{background: 'none', border: 'none', color: theme.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
               {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            
            {!winner && (
              <button onClick={() => setIsPaused(true)} style={{background: 'none', border: 'none', color: theme.gold, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginLeft: '8px', fontWeight: 'bold'}}>
                <Pause size={12} /> PAUSE
              </button>
            )}
          </div>
        </div>
      </div>

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

      {/* OPPONENT INFO - TOP OF BOARD */}
      <div style={{
        width: 'min(90vw, 500px)', 
        display: 'flex', 
        justifyContent: 'flex-start',
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '10px'
      }}>
         <div style={{
            width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)',
            border: turn === 'white' ? `2px solid ${theme.gold}` : '2px solid transparent', // Highlight when opponent (white) turn
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border 0.3s'
         }}>
            {isSpectator ? <Tv size={18} color={theme.textDim} /> : (mode === 'solo' ? <Monitor size={18} color={theme.textDim} /> : <User size={18} color={theme.textDim} />)}
         </div>
         <div>
            <div style={{fontWeight: 'bold', fontSize: '14px', color: theme.text}}>{opponentName}</div>
            <div style={{fontSize: '11px', color: theme.gold, opacity: (aiThinking || (isSpectator && !winner)) ? 1 : 0, transition: 'opacity 0.3s'}}>
               {(aiThinking || isSpectator) ? 'Réfléchit...' : ' '}
            </div>
            {/* OPPONENT CAPTURED PIECES (Pieces they captured from red) */}
            <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px'}}>
               <span style={{fontSize: '9px', color: theme.textDim, textTransform: 'uppercase'}}>Capturés:</span>
               <CapturedPieces color="red" count={redLost} />
            </div>
         </div>
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
                : `En abandonnant, vous perdez votre mise de ${currency === 'USD' ? '$' : 'ETH'} ${bet}.`
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
                 : (winner === 'red' ? `Vous avez gagné ${currency === 'USD' ? '$' : 'ETH'} ${bet * 2}!` : 'Meilleure chance la prochaine fois.')
               }
            </p>
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

      {/* BOARD */}
      <div style={{
        position: 'relative',
        width: 'min(90vw, 500px)',
        height: 'min(90vw, 500px)',
        border: `8px solid #2d1b12`, // Reduced border size for more space
        borderRadius: '6px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
        background: theme.boardLight
      }}>
        {/* Board Border Detail */}
        <div style={{position: 'absolute', top: '-6px', left: '-6px', right: '-6px', bottom: '-6px', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none', borderRadius: '4px'}}></div>

        {board.map((row, r) => row.map((piece, c) => {
          const isDark = (r + c) % 2 === 1;
          const isSelected = selected?.r === r && selected?.c === c;
          
          // Check if this square is a target for any valid move from selected piece
          const isTarget = selected && validMoves.some(m => m.from.r === selected.r && m.from.c === selected.c && m.to.r === r && m.to.c === c);
          
          // Check if piece can be selected (it is in the validMoves list as a start position)
          const canSelect = piece?.color === turn && validMoves.some(m => m.from.r === r && m.from.c === c);

          const isLastMove = lastMovedPos?.r === r && lastMovedPos?.c === c;
          
          return (
            <div 
              key={`${r}-${c}`}
              onClick={() => handleSquareClick(r, c)}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: isDark ? theme.boardDark : theme.boardLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: (canSelect || isTarget) && !isSpectator ? 'pointer' : 'default',
                boxShadow: isTarget ? `inset 0 0 15px ${theme.gold}` : 'none'
              }}
            >
               {/* Wood grain texture overlay for dark squares if tabac theme */}
               {isDark && theme.id === 'tabac' && <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #000 5px, #000 6px)'}} />}

              {/* Highlight Valid Move Dot */}
              {isTarget && !piece && (
                <div style={{
                  width: '24%', height: '24%', borderRadius: '50%', background: `rgba(${parseInt(theme.gold.slice(1,3),16)}, ${parseInt(theme.gold.slice(3,5),16)}, ${parseInt(theme.gold.slice(5,7),16)}, 0.5)`,
                  boxShadow: `0 0 10px ${theme.gold}`,
                  animation: 'fade-in-dot 0.3s ease-out'
                }} />
              )}

              {/* PIECE */}
              {piece && (
                <div style={{
                  ...getPieceStyle(piece.color, piece.isKing, isSelected),
                  animation: isSelected 
                    ? 'pulse-gold 1.5s infinite' 
                    : (canSelect && !isSpectator
                        ? 'breathe-glow 2.5s infinite ease-in-out' // Subtle animation for movable pieces
                        : (isLastMove 
                            ? 'land-piece 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
                            : 'none'))
                }}>
                  {/* King Crown or Detail */}
                  <div style={{
                    width: '60%', height: '60%', borderRadius: '50%', 
                    border: skin === 'neon' ? '1px solid rgba(255,255,255,0.5)' : `1px solid rgba(0,0,0,0.15)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {piece.isKing && <div style={{fontSize: '18px', color: skin === 'neon' ? '#fff' : (piece.color === 'red' ? '#5a1a1a' : '#888')}}>♛</div>}
                  </div>
                </div>
              )}
            </div>
          );
        }))}
      </div>

    </div>
  );
};

// 5. MAIN APP CONTROLLER
const App = () => {
  const [view, setView] = useState<'login' | 'dashboard' | 'lobby' | 'friend_lobby' | 'game'>('login');
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState({ usd: 1000, crypto: 1.5 });
  const [gameConfig, setGameConfig] = useState<any>(null);
  
  // Customization States
  const [currentTheme, setCurrentTheme] = useState(THEMES.tabac);
  const [currentSkin, setCurrentSkin] = useState('wood');
  
  // Game History State
  const [history, setHistory] = useState([
    { id: '1', date: 'Aujourd\'hui', mode: 'Solo', result: 'win', amount: 20, currency: 'USD' },
    { id: '2', date: 'Hier', mode: 'En ligne', result: 'lose', amount: 0.05, currency: 'ETH' },
    { id: '3', date: '12 Oct', mode: 'Solo', result: 'win', amount: 10, currency: 'USD' },
  ]);

  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    return room ? room.toUpperCase() : null;
  });

  const FRIENDS_KEY = `royale-dames-friends-${user?.id || 'anon'}`;
  const [friends, setFriends] = useState<{ id: string; username: string; name: string }[]>([]);
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

  // Plein écran dans Telegram Web App
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.ready();
      tg.enableClosingConfirmation?.();
    }
  }, []);

  const handleLogin = (provider: string, userData?: { id: string; name: string; username?: string }) => {
    const u = userData || { id: '123', name: 'Player One' };
    setUser({ ...u, provider });
    if (pendingRoomCode) {
      setView('friend_lobby');
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
            handleLogin('google', { id: profile.id, name: profile.name || profile.email });
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          })
          .catch(() => {});
      }
    }
  }, []);

  const handlePlay = (mode: string, bet: number, currency: string, rules: string) => {
    // Deduct bet (mock)
    if (currency === 'USD' && wallet.usd < bet) return alert("Fonds insuffisants");
    
    setGameConfig({ mode, bet, currency, rules, isSpectator: false });
    
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
    // Handle payout (mock)
    if (gameConfig.isSpectator) {
      setView('dashboard');
      return;
    }

    if (winner === 'red') {
      const winAmount = gameConfig.bet * 2;
      setWallet(prev => ({
        ...prev,
        usd: gameConfig.currency === 'USD' ? prev.usd + winAmount : prev.usd,
        crypto: gameConfig.currency === 'ETH' ? prev.crypto + winAmount : prev.crypto
      }));
    } else {
       setWallet(prev => ({
        ...prev,
        usd: gameConfig.currency === 'USD' ? prev.usd - gameConfig.bet : prev.usd,
        crypto: gameConfig.currency === 'ETH' ? prev.crypto - gameConfig.bet : prev.crypto
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
      {view === 'login' && <LoginScreen onLogin={handleLogin} theme={currentTheme} />}
      {view === 'dashboard' && (
        <Dashboard 
          user={user} 
          wallet={wallet} 
          history={history}
          onPlay={handlePlay} 
          onSpectate={handleSpectate} 
          onLogout={() => setView('login')} 
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
        />
      )}
      {view === 'lobby' && <GameLobby onMatchFound={handleMatchFound} onCancel={() => setView('dashboard')} theme={currentTheme} />}
      {view === 'friend_lobby' && (
        <FriendLobby
          onMatchFound={handleMatchFound}
          onCancel={() => {
            setView('dashboard');
            setPendingRoomCode(null);
          }}
          theme={currentTheme}
          code={pendingRoomCode}
          friends={friends}
        />
      )}
      {view === 'game' && (
        <BoardGame 
          mode={gameConfig.mode} 
          bet={gameConfig.bet} 
          currency={gameConfig.currency} 
          rules={gameConfig.rules} 
          isSpectator={gameConfig.isSpectator} 
          user={user} 
          onGameOver={handleGameOver}
          theme={currentTheme}
          skin={currentSkin}
          multiplayerBoard={multiplayer.currentGame?.board}
          multiplayerTurn={multiplayer.currentGame?.currentTurn}
          onMultiplayerMove={multiplayer.makeMove}
          multiplayerMyColor={multiplayer.currentGame?.yourColor}
          multiplayerResign={multiplayer.resign}
        />
      )}
    </div>
  );
};

export default App;