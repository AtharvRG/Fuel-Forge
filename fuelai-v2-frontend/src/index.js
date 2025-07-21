// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


const splashScreen = document.getElementById('splash-screen');
if (splashScreen) {
  setTimeout(() => {
    splashScreen.classList.add('hide');
    document.body.style.overflow = 'auto';
  }, 2500);
}