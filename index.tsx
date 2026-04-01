
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Catch and ignore benign Vite WebSocket connection errors
if ((import.meta as any).env.DEV) {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason && (
      (reason.message && (reason.message.includes('WebSocket') || reason.message.includes('closed without opened'))) ||
      (reason.stack && reason.stack.includes('vite'))
    )) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('WebSocket') || 
      event.message.includes('closed without opened') ||
      event.message.includes('vite')
    )) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

if ('serviceWorker' in navigator && !((import.meta as any).env.DEV)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(registration => {
        console.log('Sovereign SW registered: ', registration.scope);
      })
      .catch(registrationError => {
        console.warn('Sovereign SW skipped or failed: ', registrationError.message);
      });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
