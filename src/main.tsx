import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './AppProviders';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

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

