'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Fingerprint, Heart, ShieldAlert, AlertTriangle, RefreshCw, X, Sliders, Info, Zap } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { 
    user, 
    liveBpm, 
    liveStatus, 
    liveHistory, 
    alerts, 
    simMode, 
    updateSimMode, 
    bioStatus, 
    enrollFingerprint, 
    cancelBiometrics, 
    clearBioStatus,
    clearLocalHistory 
  } = useAuth();

  const [deviceStatus, setDeviceStatus] = useState('streaming'); // offline, streaming
  const [enrollFpIdInput, setEnrollFpIdInput] = useState(`FP_${Math.floor(Math.random() * 900) + 100}`);
  
  const audioCtxRef = useRef(null);

  // Synthesize warning beep using Web Audio API
  const playWarningBeep = (status) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (status === 'tachycardia') {
        // High rapid beep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else if (status === 'bradycardia') {
        // Low slow beep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (err) {
      console.warn('Audio synthesis warning:', err.message);
    }
  };

  // Trigger synthesized audio warnings whenever a new abnormal value arrives
  useEffect(() => {
    if (liveBpm && liveStatus !== 'normal') {
      playWarningBeep(liveStatus);
    }
    if (liveBpm) {
      setDeviceStatus('streaming');
    } else {
      setDeviceStatus('offline');
    }
  }, [liveBpm, liveStatus]);

  // Adjust simulation mode
  const handleSimulationModeChange = (mode) => {
    updateSimMode(mode);
  };

  // Clear patient history
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your heart rate history? This cannot be undone.')) {
      clearLocalHistory();
    }
  };

  // Trigger Biometric enrollment
  const handleStartEnrollment = () => {
    enrollFingerprint(enrollFpIdInput);
  };

  const getStatusColor = (status) => {
    if (status === 'tachycardia') return 'var(--color-danger)';
    if (status === 'bradycardia') return 'var(--color-warning)';
    return 'var(--color-accent)';
  };

  // Chart configuration
  const lineChartData = {
    labels: liveHistory.map((d) => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: liveHistory.map((d) => d.bpm),
        borderColor: liveStatus === 'tachycardia' ? '#ef4444' : liveStatus === 'bradycardia' ? '#f59e0b' : '#00f2fe',
        borderWidth: 2.5,
        pointBackgroundColor: liveStatus === 'tachycardia' ? '#ef4444' : liveStatus === 'bradycardia' ? '#f59e0b' : '#00f2fe',
        pointRadius: liveHistory.map((d, idx) => (idx === liveHistory.length - 1 ? 5 : 2)), // highlight last point
        pointHoverRadius: 6,
        fill: true,
        backgroundColor: (context) => {
          const contextChart = context.chart;
          if (!contextChart) return 'rgba(0, 242, 254, 0.05)';
          const ctx = contextChart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          if (liveStatus === 'tachycardia') {
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
          } else if (liveStatus === 'bradycardia') {
            gradient.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
            gradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
          } else {
            gradient.addColorStop(0, 'rgba(0, 242, 254, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 242, 254, 0.0)');
          }
          return gradient;
        },
        tension: 0.3,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(9, 13, 22, 0.95)',
        titleColor: '#94a3b8',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-secondary)', maxRotation: 45, autoSkip: true, maxTicksLimit: 8, font: { size: 10 } },
      },
      y: {
        min: 30,
        max: 180,
        ticks: { color: 'var(--text-secondary)', stepSize: 20 },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
      },
    },
  };

  // Determine dynamic heart beating speed
  const beatDuration = liveBpm ? `${60 / liveBpm}s` : '1s';

  // Determine scanner class based on biometric state
  let scannerStateClass = '';
  if (bioStatus.active) {
    if (bioStatus.complete) scannerStateClass = 'complete';
    else if (bioStatus.error) scannerStateClass = 'error';
    else scannerStateClass = 'scanning';
  }

  return (
    <div className="grid grid-3">
      
      {/* LEFT COLUMN: Patient Info & Biometrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Patient Profile */}
        <div className="card">
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: 'var(--color-accent)' }} />
            Patient Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div>
              <span className="input-label" style={{ marginBottom: 0 }}>Full Name</span>
              <div style={{ fontWeight: 600 }}>{user.name}</div>
            </div>
            <div>
              <span className="input-label" style={{ marginBottom: 0 }}>Email</span>
              <div>{user.email}</div>
            </div>
            <div>
              <span className="input-label" style={{ marginBottom: 0 }}>Biometric Identification Key</span>
              {user.fingerprintId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-success)', fontWeight: 600 }}>
                  <Fingerprint size={16} /> Linked: {user.fingerprintId}
                </div>
              ) : (
                <div style={{ color: 'var(--color-danger)', fontWeight: 500, fontSize: '0.85rem' }}>
                  No Fingerprint Registered
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Biometric Enrollment Simulator */}
        <div className="card">
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Fingerprint size={18} style={{ color: 'var(--color-primary)' }} />
            Biometric Enrollment
          </h3>

          {bioStatus.active && bioStatus.type === 'enroll' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className={`scanner-container ${scannerStateClass}`} style={{ width: '130px', height: '160px' }}>
                <div className="scanner-laser" />
                <svg className="scanner-fingerprint-svg" viewBox="0 0 24 24" style={{ width: '70px', height: '70px' }}>
                  <path d="M12,1C5.9,1,1,5.9,1,12s4.9,11,11,11s11-4.9,11-11S18.1,1,12,1z M12,21c-5,0-9-4-9-9s4-9,9-9s9,4,9,9S17,21,12,21z M16,11.5c0-2.2-1.8-4-4-4s-4,1.8-4,4v1c0,0.3,0.2,0.5,0.5,0.5S9,12.8,9,12.5v-1c0-1.7,1.3-3,3-3s3,1.3,3,3v1c0,0.3,0.2,0.5,0.5,0.5s0.5-0.2,0.5-0.5V11.5z" />
                </svg>
              </div>
              <div style={{ margin: '0.5rem 0' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: bioStatus.error ? 'var(--color-danger)' : bioStatus.complete ? 'var(--color-success)' : 'var(--color-accent)' }}>{bioStatus.percent}%</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{bioStatus.text}</div>
                {bioStatus.error && <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.25rem' }}>{bioStatus.error}</div>}
              </div>
              
              {bioStatus.complete || bioStatus.error ? (
                <button type="button" onClick={clearBioStatus} className="btn btn-secondary" style={{ padding: '0.35rem' }}>Close</button>
              ) : (
                <button type="button" onClick={cancelBiometrics} className="btn btn-danger" style={{ padding: '0.35rem' }}>Cancel</button>
              )}
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Register your fingerprint to bypass passwords and authenticate securely at clinic checkpoints.
              </p>

              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Simulated Registration Slot ID:</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} 
                    value={enrollFpIdInput}
                    onChange={(e) => setEnrollFpIdInput(e.target.value)}
                    placeholder="E.g., FP_101"
                  />
                  <button 
                    onClick={() => setEnrollFpIdInput(`FP_${Math.floor(Math.random() * 900) + 100}`)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.5rem', width: 'auto' }}
                    title="Generate New Slot ID"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              <button 
                onClick={handleStartEnrollment}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                <Fingerprint size={16} />
                <span>{user.fingerprintId ? 'Re-enroll Biometrics' : 'Enroll Fingerprint'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Pulse simulator console */}
        <div className="card" style={{ border: '1px dashed var(--border-color)' }}>
          <h3 style={{ paddingBottom: '0.5rem', marginBottom: '0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={16} style={{ color: 'var(--color-accent)' }} />
            Pulse Sensor Telemetry Simulation
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Simulate different physiological conditions to trigger alerts and test the real-time ECG chart responsiveness:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => handleSimulationModeChange('normal')}
              className={`btn ${simMode === 'normal' ? 'btn-accent' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            >
              Normal Rhythm (62 - 96 BPM)
            </button>
            <button
              onClick={() => handleSimulationModeChange('bradycardia')}
              className={`btn ${simMode === 'bradycardia' ? 'btn-accent' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            >
              Bradycardia Mode (&lt; 60 BPM)
            </button>
            <button
              onClick={() => handleSimulationModeChange('tachycardia')}
              className={`btn ${simMode === 'tachycardia' ? 'btn-accent' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            >
              Tachycardia Mode (&gt; 100 BPM)
            </button>
            <button
              onClick={() => handleSimulationModeChange('unstable')}
              className={`btn ${simMode === 'unstable' ? 'btn-accent' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            >
              Arrhythmia Mode (Unstable Spikes)
            </button>
          </div>
        </div>

      </div>

      {/* CENTER COLUMN: Real-Time Heart Rate Status and Live Graphs */}
      <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Dynamic Telemetry Panel */}
        <div 
          className="card" 
          style={{ 
            borderColor: getStatusColor(liveStatus), 
            boxShadow: liveStatus === 'tachycardia' ? 'var(--box-shadow-glow-red)' : liveStatus === 'bradycardia' ? 'var(--box-shadow-glow-teal)' : 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Beacon */}
          <div style={{ position: 'absolute', top: '1rem', right: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: liveStatus === 'tachycardia' ? 'var(--color-danger)' : liveStatus === 'bradycardia' ? 'var(--color-warning)' : 'var(--color-success)',
              display: 'inline-block',
              boxShadow: `0 0 10px ${getStatusColor(liveStatus)}`
            }}></span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sensor {deviceStatus}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Pulsing heart */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart 
                size={80} 
                fill={getStatusColor(liveStatus)}
                style={{
                  color: getStatusColor(liveStatus),
                  filter: `drop-shadow(0 0 15px ${getStatusColor(liveStatus)})`,
                  animation: `heart-pulse ${beatDuration} infinite ease-in-out`
                }}
              />
            </div>

            {/* Giant BPM numbers */}
            <div>
              <span className="input-label" style={{ fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Current Heart Rate</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '4.5rem',
                  fontWeight: 900,
                  color: getStatusColor(liveStatus),
                  lineHeight: '1',
                  letterSpacing: '-0.05em',
                  fontFamily: 'monospace'
                }}>
                  {liveBpm || '--'}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>BPM</span>
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                {liveStatus === 'tachycardia' && (
                  <span className="badge badge-danger" style={{ gap: '0.25rem' }}><AlertTriangle size={12} /> Tachycardia Warning</span>
                )}
                {liveStatus === 'bradycardia' && (
                  <span className="badge badge-warning" style={{ gap: '0.25rem' }}><AlertTriangle size={12} /> Bradycardia Warning</span>
                )}
                {liveStatus === 'normal' && (
                  <span className="badge badge-success">Sinus Rhythm Normal</span>
                )}
              </div>
            </div>

            {/* Secondary telemetry details */}
            <div style={{ marginLeft: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Threshold Low</span>
                <div style={{ fontWeight: 600 }}>60 BPM</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Threshold High</span>
                <div style={{ fontWeight: 600 }}>100 BPM</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Average (30s)</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {liveHistory.length > 0 ? Math.round(liveHistory.reduce((acc, c) => acc + c.bpm, 0) / liveHistory.length) : '--'} BPM
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Device Status</span>
                <div style={{ fontWeight: 600, color: 'var(--color-success)' }}>ONLINE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Line Graph */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} style={{ color: 'var(--color-accent)' }} />
              Live Electrocardiogram (ECG) Simulator
            </h3>
            <button 
              onClick={handleClearHistory} 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              Clear Live Logs
            </button>
          </div>
          
          <div style={{ height: '300px', width: '100%', position: 'relative' }}>
            {liveHistory.length > 0 ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                <Activity size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <span>Calibrating pulse sensor... Please wait for readings.</span>
              </div>
            )}
          </div>
        </div>

        {/* Medical warnings log */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} style={{ color: 'var(--color-danger)' }} />
            Medical Alert Log ({alerts.length})
          </h3>
          <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <div 
                  key={index} 
                  className={`alert-card ${alert.status}`}
                  style={{ marginBottom: 0, padding: '0.75rem' }}
                >
                  <AlertTriangle size={18} style={{ color: alert.status === 'tachycardia' ? 'var(--color-danger)' : 'var(--color-warning)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        Abnormal Rhythm: {alert.bpm} BPM ({alert.status.toUpperCase()})
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {alert.message}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No active cardiovascular warnings. Heart rhythm is stable.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
