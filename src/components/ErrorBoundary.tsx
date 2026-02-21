/**
 * Error Boundary - affiche les erreurs au lieu d'un écran noir
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: '#0f1014',
            color: '#e0e0e0',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <h2 style={{ color: '#ff6b6b', marginBottom: 12 }}>Une erreur s'est produite</h2>
          <pre
            style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 16,
              borderRadius: 8,
              overflow: 'auto',
              maxWidth: '100%',
              fontSize: 12,
            }}
          >
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: '12px 24px',
              background: '#c5a059',
              border: 'none',
              borderRadius: 8,
              color: '#1a1a1a',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Recharger l'application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
