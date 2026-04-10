import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import PopoutView from './components/PopoutView';
import './styles.css';

const params = new URLSearchParams(window.location.search);
const popoutPath = params.get('popout');

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {popoutPath ? <PopoutView notePath={popoutPath} /> : <App />}
  </React.StrictMode>
);
