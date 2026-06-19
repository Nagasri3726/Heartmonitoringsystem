'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Login from '../components/Login';
import Register from '../components/Register';
import Header from '../components/Header';

// Load Dashboard dynamically to disable Server-Side Rendering (SSR)
// This is critical because Chart.js attempts to draw on HTML5 Canvas which does not exist on the Node server.
const Dashboard = dynamic(() => import('../components/Dashboard'), { ssr: false });
const AdminPanel = dynamic(() => import('../components/AdminPanel'), { ssr: false });

const MainApp = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'admin'

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        fontFamily: 'sans-serif'
      }}>
        <div className="spinner"></div>
        <style>{`
          .spinner {
            border: 4px solid rgba(0, 242, 254, 0.1);
            border-top: 4px solid var(--color-accent, #00f2fe);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>Initializing CardioSync NextJS network...</span>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (authView === 'register') {
      return <Register onNavigate={(view) => setAuthView(view)} />;
    }
    return <Login onNavigate={(view) => setAuthView(view)} />;
  }

  // Authenticated
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
      <Header currentView={currentView} onViewChange={(view) => setCurrentView(view)} />
      
      <main className="container">
        {currentView === 'admin' && user.role === 'admin' ? (
          <AdminPanel />
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
};

export default function Home() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
