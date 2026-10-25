import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initAdMob } from './services/admob.ts';
import { startAppAnalytics } from './services/appAnalytics.ts';

// Native app only — a no-op on the website.
void initAdMob();
// App usage analytics for the admin panel (native only, best-effort).
startAppAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
