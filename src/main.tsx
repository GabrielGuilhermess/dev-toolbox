import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/App';
import '@/styles/globals.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Elemento root não encontrado.');
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
