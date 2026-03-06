import React from 'react';
import { Buffer } from 'buffer';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './AppProviders';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Polyfill Buffer pour certaines libs TON côté navigateur
if (typeof window !== 'undefined' && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  );
} else {
  console.error('Impossible de trouver l’élément racine #root');
}

