// Ignore fetch overwrite errors commonly caused by polyfills in the AI Studio environment
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('Cannot set property fetch') || event.message?.includes('Cannot set property fetch')) {
    console.warn('Suppressed fetch overwrite error:', event.message);
    event.stopImmediatePropagation();
  }
}, true);

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';

// Polyfill global for legacy libraries
(window as any).global = window;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
