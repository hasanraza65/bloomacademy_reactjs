// Proactively handle fetch overwrite attempts which fail in some environments
try {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
  if (descriptor && !descriptor.writable && !descriptor.set) {
    const originalFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      get: () => originalFetch,
      set: (val) => { 
        // 
      },
      configurable: true,
      enumerable: true
    });
  }
} catch (e) {
  // 

}

// Global error handler for fetch property assignment
window.addEventListener('error', (event) => {
  const msg = event.error?.message || event.message || '';
  if (msg.includes('Cannot set property fetch')) {
    // 

    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';

// Globally silence logs as requested by user
if (typeof window !== 'undefined') {
  (window as any).console.log = () => {};
  (window as any).console.info = () => {};
  (window as any).console.debug = () => {};
}

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
