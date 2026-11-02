import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './i18n';
import './styles.css';
import App from './App';
import Dashboard from './pages/Dashboard';
import GamePage from './pages/GamePage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Dashboard />} />
          <Route path="game/:gameId" element={<GamePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
