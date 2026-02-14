import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../index';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  console.error('Impossible de trouver l’élément racine #root');
}

