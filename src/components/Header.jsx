'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, ShieldAlert, Activity } from 'lucide-react';

const Header = ({ currentView, onViewChange }) => {
  const { user, logout, theme, toggleTheme } = useAuth();

  if (!user) return null;

  return (
    <header className="card" style={{ borderRadius: '0 0 var(--border-radius-lg) var(--border-radius-lg)', padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Left: Branding & ECG Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--color-primary)', 
            color: '#fff', 
            padding: '0.5rem', 
            borderRadius: '50%',
            boxShadow: 'var(--box-shadow-glow-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={20} className="pulse-heart" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>CardioSync</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-accent)', margin: 0, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Real-Time Telemetry
            </p>
          </div>
        </div>

        {/* Right: User Info & Theme Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Admin Panel Toggle */}
          {user.role === 'admin' && (
            <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '2px', background: 'rgba(0,0,0,0.1)' }}>
              <button 
                onClick={() => onViewChange('dashboard')}
                style={{
                  border: 'none',
                  background: currentView === 'dashboard' ? 'var(--color-primary)' : 'transparent',
                  color: currentView === 'dashboard' ? '#fff' : 'var(--text-secondary)',
                  padding: '0.4rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: 'calc(var(--border-radius-md) - 2px)',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Dashboard
              </button>
              <button 
                onClick={() => onViewChange('admin')}
                style={{
                  border: 'none',
                  background: currentView === 'admin' ? 'var(--color-primary)' : 'transparent',
                  color: currentView === 'admin' ? '#fff' : 'var(--text-secondary)',
                  padding: '0.4rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: 'calc(var(--border-radius-md) - 2px)',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <ShieldAlert size={14} /> Admin
              </button>
            </div>
          )}

          {/* User profile tags */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {user.role === 'admin' ? (
                <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Admin</span>
              ) : (
                <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Patient</span>
              )}
              {user.fingerprintId ? `• FP: ${user.fingerprintId}` : '• No Biometric Linked'}
            </span>
          </div>

          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-color)' }}></div>

          {/* Light/Dark Toggle */}
          <button 
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '0.4rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--border-color)',
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Sign Out Button */}
          <button 
            onClick={logout}
            className="btn btn-secondary"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.85rem',
              width: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              border: '1px solid var(--border-color)',
              color: 'var(--color-primary)'
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>

        </div>
      </div>
    </header>
  );
};

export default Header;
