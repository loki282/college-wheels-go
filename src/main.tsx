
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core';

// Wait for the device to be ready if we're on a native platform
const renderApp = () => {
  createRoot(document.getElementById("root")!).render(<App />);
};

// Call renderApp directly since we're starting on the web
renderApp();

// Register the app with the service worker if needed
if ('serviceWorker' in navigator && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.error('ServiceWorker registration failed: ', error);
      });
  });
}
