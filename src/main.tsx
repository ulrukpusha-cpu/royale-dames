import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './AppProviders';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <AppProviders>
      <App />
    </AppProviders>
  );
} else {
  console.error('Impossible de trouver l’élément racine #root');
}

