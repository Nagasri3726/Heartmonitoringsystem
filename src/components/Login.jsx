'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Fingerprint, Activity, X, Info } from 'lucide-react';
import { api } from '../services/api';

const Login = ({ onNavigate }) => {
  const { login, loginWithFingerprint, cancelBiometrics, bioStatus, clearBioStatus } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Simulated hardware controls
  const [testFpId, setTestFpId] = useState('FP_1');
  const [knownUsers, setKnownUsers] = useState([]);

  useEffect(() => {
    // Fetch registered fingerprints so testers know which IDs will work
    const fetchBiometrics = async () => {
      try {
        const res = await api.admin.getFingerprints();
        setKnownUsers(res || []);
        if (res && res.length > 0) {
          setTestFpId(res[0].fingerprintId);
        }
      } catch (err) {
        // Safe to ignore on login page (admin protection, but fallback values work)
        setKnownUsers([
          { fingerprintId: 'FP_1', userId: { name: 'Demo Patient' } }
        ]);
      }
    };
    fetchBiometrics();
    
    // Clear biometrics state on load
    clearBioStatus();
    return () => cancelBiometrics();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = () => {
    setError('');
    loginWithFingerprint(testFpId);
  };

  // Determine scanner class based on biometric state
  let scannerStateClass = '';
  if (bioStatus.active) {
    if (bioStatus.complete) scannerStateClass = 'complete';
    else if (bioStatus.error) scannerStateClass = 'error';
    else scannerStateClass = 'scanning';
  }

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        
        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            color: '#fff',
            padding: '0.75rem',
            borderRadius: '50%',
            marginBottom: '1rem',
            boxShadow: 'var(--box-shadow-glow-red)'
          }}>
            <Activity size={28} className="pulse-heart" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>CardioSync</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Smart Heart Rate Telemetry System</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-danger)',
            color: '#f87171',
            padding: '0.75rem',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Biometrics Active Simulation Dialog */}
        {bioStatus.active ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '1rem 0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Biometric Scanning</h3>
              <button 
                onClick={cancelBiometrics}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Glowing simulated fingerprint container */}
            <div className={`scanner-container ${scannerStateClass}`}>
              <div className="scanner-laser" />
              <svg className="scanner-fingerprint-svg" viewBox="0 0 24 24">
                <path d="M12,1C5.9,1,1,5.9,1,12s4.9,11,11,11s11-4.9,11-11S18.1,1,12,1z M12,21c-5,0-9-4-9-9s4-9,9-9s9,4,9,9S17,21,12,21z M16,11.5c0-2.2-1.8-4-4-4s-4,1.8-4,4v1c0,0.3,0.2,0.5,0.5,0.5S9,12.8,9,12.5v-1c0-1.7,1.3-3,3-3s3,1.3,3,3v1c0,0.3,0.2,0.5,0.5,0.5s0.5-0.2,0.5-0.5V11.5z M12,14c-1.1,0-2-0.9-2-2v-0.5c0-0.3-0.2-0.5-0.5-0.5S9,11.2,9,11.5V12c0,1.7,1.3,3,3,3s3-1.3,3-3v-0.5c0-0.3-0.2-0.5-0.5-0.5S14,11.2,14,11.5V12C14,13.1,13.1,14,12,14z M12,16.5c-0.3,0-0.5,0.2-0.5,0.5v0.5c0,0.3,0.2,0.5,0.5,0.5s0.5-0.2,0.5-0.5V17C12.5,16.7,12.3,16.5,12,16.5z M12,5c-3.9,0-7,3.1-7,7v0.5c0,0.3,0.2,0.5,0.5,0.5S6,12.8,6,12.5V12c0-3.3,2.7-6,6-6s6,2.7,6,6v0.5c0,0.3,0.2,0.5,0.5,0.5s0.5-0.2,0.5-0.5V12C19,8.1,15.9,5,12,5z" />
              </svg>
            </div>

            {/* Circular Progress & Text Status */}
            <div style={{ margin: '0.5rem 0 1.5rem 0' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: bioStatus.error ? 'var(--color-danger)' : bioStatus.complete ? 'var(--color-success)' : 'var(--color-accent)' }}>
                {bioStatus.percent}%
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem', padding: '0 1rem' }}>
                {bioStatus.text}
              </p>
              {bioStatus.error && (
                <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 500 }}>
                  Error: {bioStatus.error}
                </div>
              )}
            </div>

            {/* Action buttons during scan */}
            {bioStatus.complete || bioStatus.error ? (
              <button 
                type="button" 
                onClick={clearBioStatus} 
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Close Scanner
              </button>
            ) : (
              <button 
                type="button" 
                onClick={cancelBiometrics} 
                className="btn btn-danger"
                style={{ width: '100%' }}
              >
                Cancel Scanning
              </button>
            )}

            {/* Hard-coded Testing Panel Helper (Visible during scan so user can easily mock hardware options) */}
            {!bioStatus.complete && !bioStatus.error && (
              <div className="card" style={{ marginTop: '1.5rem', padding: '1rem', width: '100%', borderStyle: 'dashed', borderColor: 'var(--color-accent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-accent)' }}>
                  <Info size={14} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Simulated Hardware Helper</span>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'left' }}>
                  Select which fingerprint ID should be triggered at 100% completion to simulate placing that finger on the scanner:
                </p>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <select
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                    value={testFpId}
                    onChange={(e) => {
                      setTestFpId(e.target.value);
                      // Instantly restart scanning with the new selected ID
                      loginWithFingerprint(e.target.value);
                    }}
                  >
                    {knownUsers.length > 0 ? (
                      knownUsers.map((item) => (
                        <option key={item._id} value={item.fingerprintId}>
                          {item.fingerprintId} ({item.userId ? item.userId.name : 'Unknown User'})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="FP_1">FP_1 (Demo Patient)</option>
                        <option value="FP_2">FP_2 (Demo Admin)</option>
                      </>
                    )}
                    <option value="FP_UNKNOWN">FP_UNKNOWN (Unregistered Fingerprint)</option>
                  </select>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Standard Login Form */
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@hospital.com"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '0.5rem', padding: '0.85rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-muted)' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
              <span style={{ padding: '0 0.75rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Biometric Login</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            </div>

            {/* Hardware Biometric trigger selector */}
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem', backgroundColor: 'rgba(0, 242, 254, 0.04)', border: '1px dashed rgba(0, 242, 254, 0.15)', borderRadius: 'var(--border-radius-md)' }}>
              <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: '0.35rem' }}>Select fingerprint ID to emulate:</label>
              <select
                className="form-input"
                style={{ fontSize: '0.8rem', padding: '0.4rem', height: 'auto', marginBottom: '0.75rem' }}
                value={testFpId}
                onChange={(e) => setTestFpId(e.target.value)}
              >
                {knownUsers.length > 0 ? (
                  knownUsers.map((item) => (
                    <option key={item._id} value={item.fingerprintId}>
                      {item.fingerprintId} ({item.userId ? item.userId.name : 'Unknown User'})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="FP_1">FP_1 (Mock Patient)</option>
                    <option value="FP_2">FP_2 (Mock Admin)</option>
                  </>
                )}
                <option value="FP_UNKNOWN">FP_UNKNOWN (Trigger Scan Failure)</option>
              </select>

              <button
                type="button"
                onClick={handleBiometricLogin}
                className="btn btn-accent"
                style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Fingerprint size={18} />
                <span>Scan Fingerprint to Sign In</span>
              </button>
            </div>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Don't have an account? </span>
          <button
            type="button"
            onClick={() => onNavigate('register')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-accent)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Create one here
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
