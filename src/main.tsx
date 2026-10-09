import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/big-shoulders-display/700.css';
import '@fontsource/big-shoulders-display/800.css';
import '@fontsource/big-shoulders-display/900.css';
import '@fontsource-variable/instrument-sans';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/huddle.css';
import './styles/layout.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
