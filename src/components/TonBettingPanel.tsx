/**
 * Composant de Paris TON - Royale Dames
 * Connexion TonConnect, solde, montant, placement de pari
 */
import React, { useState, useEffect } from 'react';
import {
  getTonBalance,
  placeBet,
  isTonConnected,
  getWallets,
  connectTonWallet,
  subscribeTonStatus,
  getTonWalletAddress,
} from '@/services/ton';

export interface TonBettingPanelProps {
  gameId: string;
  opponent?: string;
  theme: any;
  onBetPlaced: (amount: number) => void;
  onCancel?: () => void;
  compact?: boolean;
}

export const TonBettingPanel: React.FC<TonBettingPanelProps> = ({
  gameId,
  opponent = 'Adversaire',
  theme,
  onBetPlaced,
  onCancel,
  compact = false,
}) => {
  const [betAmount, setBetAmount] = useState(1);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [showWalletList, setShowWalletList] = useState(false);

  useEffect(() => {
    setConnected(isTonConnected());
    if (isTonConnected()) {
      setWalletAddress(getTonWalletAddress());
      getTonBalance().then(setBalance);
    }
  }, []);

  useEffect(() => {
    const unsub = subscribeTonStatus(
      (addr) => {
        setConnected(true);
        setWalletAddress(addr);
        getTonBalance().then(setBalance);
      },
      () => {
        setConnected(false);
        setWalletAddress(null);
        setBalance(0);
      }
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (connected) getTonBalance().then(setBalance);
  }, [connected]);

  const handleConnect = async () => {
    const list = await getWallets();
    setWallets(list);
    setShowWalletList(true);
  };

  const handleSelectWallet = (w: any) => {
    if (w?.universalLink && w?.bridgeUrl) {
      connectTonWallet({ universalLink: w.universalLink, bridgeUrl: w.bridgeUrl });
    } else if (w?.jsBridgeKey) {
      connectTonWallet({ jsBridgeKey: w.jsBridgeKey });
    }
    setShowWalletList(false);
  };

  const handlePlaceBet = async () => {
    if (!connected) {
      handleConnect();
      return;
    }
    if (betAmount > balance) {
      (window as any).Telegram?.WebApp?.showAlert?.('Solde insuffisant');
      return;
    }
    if (betAmount < 0.1) {
      (window as any).Telegram?.WebApp?.showAlert?.('Minimum 0.1 TON');
      return;
    }
    setLoading(true);
    try {
      const result = await placeBet(betAmount, gameId);
      if (result.success) {
        onBetPlaced(betAmount);
        (window as any).Telegram?.WebApp?.showAlert?.(`Pari de ${betAmount} TON placé !`);
      } else {
        throw new Error('Transaction échouée');
      }
    } catch (e) {
      console.error(e);
      (window as any).Telegram?.WebApp?.showAlert?.('Erreur lors du pari. Réessaye.');
    } finally {
      setLoading(false);
    }
  };

  const presetAmounts = [0.5, 1, 2, 5, 10, 25];
  const shortAddr = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '';

  if (showWalletList && !connected) {
    return (
      <div style={{
        background: theme.panel,
        padding: '20px',
        borderRadius: '16px',
        border: `1px solid ${theme.gold}`,
        maxWidth: '360px',
      }}>
        <h3 style={{ fontFamily: theme.fontMain, color: theme.gold, margin: '0 0 16px 0', fontSize: '18px' }}>
          Connecter un wallet TON
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {wallets.map((w) => (
            <button
              key={w.name}
              onClick={() => handleSelectWallet(w)}
              style={{
                padding: '14px',
                borderRadius: '12px',
                border: `1px solid ${theme.gold}40`,
                background: 'rgba(0,0,0,0.2)',
                color: theme.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontWeight: 600,
              }}
            >
              {w.imageUrl && <img src={w.imageUrl} alt="" style={{ width: 32, height: 32 }} />}
              {w.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowWalletList(false)}
          style={{
            marginTop: '16px',
            padding: '10px',
            background: 'transparent',
            border: `1px solid ${theme.textDim}`,
            color: theme.textDim,
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: theme.panel,
      padding: compact ? '16px' : '20px',
      borderRadius: '16px',
      border: `1px solid ${theme.gold}`,
      maxWidth: '360px',
    }}>
      <h3 style={{ fontFamily: theme.fontMain, color: theme.gold, margin: '0 0 16px 0', fontSize: '18px' }}>
        Paris TON
      </h3>

      {!connected ? (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: theme.textDim, fontSize: '13px', marginBottom: '12px' }}>
            Connecte ton wallet TON (Tonkeeper, etc.) pour parier.
          </p>
          <button
            onClick={handleConnect}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(90deg, #0098ea, #0077c8)',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Connecter un wallet TON
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: theme.textDim }}>Wallet connecté</div>
            <div style={{ color: theme.text, fontWeight: 600, fontSize: '12px' }}>{shortAddr}</div>
            <div style={{ color: theme.gold, fontWeight: 700, marginTop: '4px' }}>{balance.toFixed(2)} TON</div>
          </div>

          {!compact && (
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: theme.textDim }}>Adversaire</div>
              <div style={{ color: theme.text, fontWeight: 600 }}>{opponent}</div>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: theme.textDim, marginBottom: '8px' }}>Montant (TON)</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {presetAmounts.map((a) => (
                <button
                  key={a}
                  onClick={() => setBetAmount(a)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    background: betAmount === a ? theme.gold : 'rgba(0,0,0,0.2)',
                    color: betAmount === a ? '#2a1a08' : theme.text,
                    fontWeight: 600,
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
            min={0.1}
            step={0.1}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              marginBottom: '16px',
              background: 'rgba(0,0,0,0.2)',
              border: `1px solid ${theme.textDim}40`,
              color: theme.text,
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
            placeholder="Montant"
          />

          <div style={{
            marginBottom: '20px',
            padding: '12px',
            background: 'linear-gradient(90deg, rgba(39,174,96,0.2), rgba(52,152,219,0.2))',
            borderRadius: '10px',
            border: `1px solid ${theme.success}40`,
          }}>
            <div style={{ fontSize: '11px', color: theme.textDim }}>Gains potentiels (x1.9)</div>
            <div style={{ color: theme.success, fontWeight: 700, fontSize: '18px' }}>
              {(betAmount * 1.9).toFixed(2)} TON
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {onCancel && (
              <button
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '10px',
                  border: `1px solid ${theme.textDim}`,
                  background: 'transparent',
                  color: theme.textDim,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Annuler
              </button>
            )}
            <button
              onClick={handlePlaceBet}
              disabled={loading || betAmount <= 0}
              style={{
                flex: 2,
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                background: loading ? theme.textDim : `linear-gradient(90deg, ${theme.gold}, ${theme.goldDim})`,
                color: '#2a1a08',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 700,
              }}
            >
              {loading ? 'Traitement...' : `Parier ${betAmount} TON`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
