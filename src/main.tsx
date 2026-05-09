import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

import { LanguageProvider } from './contexts/LanguageContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Register service worker for PWA
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <SettingsProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </SettingsProvider>
    </LanguageProvider>
  </StrictMode>,
);
