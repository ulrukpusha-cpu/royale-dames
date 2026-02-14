/**
 * Panneau de pari - Royale Dames (styles inline)
 */
import React, { useState, useEffect } from 'react';
import { getTonBalance, placeBet, isTonConnected, getWallets, connectTonWallet } from '@/services/ton';

interface BettingPanelProps {
  gameId: string;
  opponent: string;
  theme: any;
  onBetPlaced: (amount: number, currency: 'TON' | 'STARS') => void;
  onCancel?: () => void;
}

export const BettingPanel: React.FC<BettingPanelProps> = ({
  gameId,
  opponent,
  theme,
  onBetPlaced,
  onCancel
}) => {
  const [betAmount, setBetAmount] = useState(1);
  const [currency, setCurrency] = useState<'TON' | 'STARS'>('TON');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const isTon = isTonConnected();

  useEffect(() => {
    if (isTon && currency === 'TON') {
      getTonBalance().then(setBalance);
    }
  }, [isTon, currency]);

  const handlePlaceBet = async () => {
    if (currency === 'TON' && !isTon) {
      const wallets = await getWallets();
      const tk = wallets.find((w: any) => w.name?.toLowerCase().includes('tonkeeper'));
      if (tk?.universalLink && tk?.bridgeUrl) {
        connectTonWallet({ universalLink: tk.universalLink, bridgeUrl: tk.bridgeUrl });
      } else {
        alert('Connectez votre wallet TON (Tonkeeper, etc.)');
      }
      return;
    }
    if (currency === 'TON' && betAmount > balance) {
      alert('Solde insuffisant');
      return;
    }
    setLoading(true);
    try {
      if (currency === 'TON') {
        const result = await placeBet(betAmount, gameId);
        if (result.success) {
          onBetPlaced(betAmount, 'TON');
          (window as any).Telegram?.WebApp?.showAlert?.(`Pari de ${betAmount} TON placé !`);
        } else throw new Error('Transaction échouée');
      } else {
        onBetPlaced(betAmount, 'STARS');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur lors du pari');
    } finally {
      setLoading(false);
    }
  };

  const presetAmounts = [1, 5, 10, 25, 50];

  return (
    <div style={{
      background: theme.panel,
      padding: '20px',
      borderRadius: '16px',
      border: `1px solid ${theme.gold}`,
      maxWidth: '360px'
    }}>
      <h3 style={{ fontFamily: theme.fontMain, color: theme.gold, margin: '0 0 16px 0', fontSize: '18px' }}>
        Placer un pari
      </h3>
      <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
        <div style={{ fontSize: '11px', color: theme.textDim }}>Adversaire</div>
        <div style={{ color: theme.text, fontWeight: 600 }}>{opponent}</div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: theme.textDim, marginBottom: '8px' }}>Devise</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setCurrency('TON')}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: currency === 'TON' ? 'linear-gradient(90deg, #0098ea, #0077c8)' : 'rgba(0,0,0,0.2)',
              color: currency === 'TON' ? 'white' : theme.textDim,
              fontWeight: 600
            }}
          >
            TON
          </button>
          <button
            onClick={() => setCurrency('STARS')}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: currency === 'STARS' ? 'linear-gradient(90deg, #ffc107, #ff9800)' : 'rgba(0,0,0,0.2)',
              color: currency === 'STARS' ? '#1a1a1a' : theme.textDim,
              fontWeight: 600
            }}
          >
            ⭐ Stars
          </button>
        </div>
      </div>

      {currency === 'TON' && isTon && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
          <div style={{ fontSize: '11px', color: theme.textDim }}>Solde</div>
          <div style={{ color: theme.text, fontWeight: 700 }}>{balance.toFixed(2)} TON</div>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: theme.textDim, marginBottom: '8px' }}>Montant rapide</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {presetAmounts.map((a) => (
            <button
              key={a}
              onClick={() => setBetAmount(a)}
              style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: betAmount === a ? theme.gold : 'rgba(0,0,0,0.2)',
                color: betAmount === a ? '#2a1a08' : theme.text,
                fontWeight: 600
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
          width: '100%', padding: '12px', borderRadius: '10px', marginBottom: '16px',
          background: 'rgba(0,0,0,0.2)', border: `1px solid ${theme.textDim}40`,
          color: theme.text, fontSize: '14px', boxSizing: 'border-box'
        }}
        placeholder="Montant personnalisé"
      />

      <div style={{
        marginBottom: '20px', padding: '12px',
        background: 'linear-gradient(90deg, rgba(39,174,96,0.2), rgba(52,152,219,0.2))',
        borderRadius: '10px', border: `1px solid ${theme.success}40`
      }}>
        <div style={{ fontSize: '11px', color: theme.textDim }}>Gains potentiels (x1.9)</div>
        <div style={{ color: theme.success, fontWeight: 700, fontSize: '18px' }}>
          {(betAmount * 1.9).toFixed(2)} {currency}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '14px', borderRadius: '10px', border: `1px solid ${theme.textDim}`,
              background: 'transparent', color: theme.textDim, cursor: 'pointer', fontWeight: 600
            }}
          >
            Annuler
          </button>
        )}
        <button
          onClick={handlePlaceBet}
          disabled={loading || betAmount <= 0}
          style={{
            flex: 2, padding: '14px', borderRadius: '10px', border: 'none',
            background: loading ? theme.textDim : `linear-gradient(90deg, ${theme.gold}, ${theme.goldDim})`,
            color: '#2a1a08', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700
          }}
        >
          {loading ? 'Traitement...' : `Parier ${betAmount} ${currency}`}
        </button>
      </div>
    </div>
  );
};
