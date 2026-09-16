import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import History from './pages/History';
import Hospitals from './pages/Hospitals';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to /chat for frontend demo */}
        <Route path="/" element={<Navigate to="/chat" replace />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main application routes */}
        <Route path="/chat" element={<Chat />} />
        <Route path="/history" element={<History />} />
        <Route path="/hospitals" element={<Hospitals />} />

        {/* Fallback to /chat */}
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
