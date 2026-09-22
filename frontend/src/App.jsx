import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Chat from './pages/Chat';
import History from './pages/History';
import Hospitals from './pages/Hospitals';

import './App.css';

import { checkBackendHealth } from './services/api';

export default function App() {

  // Test connection between React frontend and Flask backend
  useEffect(() => {
    checkBackendHealth()
      .then((data) => {
        console.log('Flask Backend Connected:', data);
      })
      .catch((error) => {
        console.error('Backend Connection Failed:', error);
      });
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        {/* Default route */}
        <Route
          path="/"
          element={<Navigate to="/chat" replace />}
        />

        {/* Authentication routes */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* Main application routes */}
        <Route
          path="/chat"
          element={<Chat />}
        />

        <Route
          path="/history"
          element={<History />}
        />

        <Route
          path="/hospitals"
          element={<Hospitals />}
        />

        {/* Unknown URL redirects to Chat */}
        <Route
          path="*"
          element={<Navigate to="/chat" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}