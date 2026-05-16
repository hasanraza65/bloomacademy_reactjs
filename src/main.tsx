// Proactively handle fetch overwrite attempts which fail in some environments
try {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
  if (descriptor && !descriptor.writable && !descriptor.set) {
    const originalFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      get: () => originalFetch,
      set: (val) => { 
        console.warn('Something tried to overwrite window.fetch - ignored:', val); 
      },
      configurable: true,
      enumerable: true
    });
  }
} catch (e) {
  console.warn('Failed to define fetch protector:', e);
}

// Global error handler for fetch property assignment
window.addEventListener('error', (event) => {
  const msg = event.error?.message || event.message || '';
  if (msg.includes('Cannot set property fetch')) {
    console.warn('Suppressed fetch overwrite error:', msg);
    event.preventDefault();
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
