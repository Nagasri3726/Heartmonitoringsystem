'use client';

import React, { createContext, useState, useEffect, useContext, useRef } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');

  // Simulated live telemetry state
  const [liveBpm, setLiveBpm] = useState(null);
  const [liveStatus, setLiveStatus] = useState('normal');
  const [liveHistory, setLiveHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [simMode, setSimMode] = useState('normal');

  // Biometrics simulation status
  const [bioStatus, setBioStatus] = useState({
    active: false,
    type: null, // 'scan' | 'enroll'
    percent: 0,
    text: '',
    complete: false,
    error: null,
  });

  const sensorIntervalRef = useRef(null);
  const bioIntervalRef = useRef(null);

  // Initialize simulated database in localStorage
  useEffect(() => {
    // 1. Load theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    const root = window.document.documentElement;
    if (savedTheme === 'light') root.classList.add('light');
    else root.classList.remove('light');

    // 2. Seed Mock Database if empty
    if (!localStorage.getItem('users_db')) {
      const mockUsers = [
        {
          _id: 'usr_admin101',
          name: 'Dr. Sarah Connor (Admin)',
          email: 'admin@clinic.com',
          password: 'admin123',
          role: 'admin',
          fingerprintId: 'FP_1',
          createdAt: new Date().toISOString(),
        },
        {
          _id: 'usr_patient202',
          name: 'Arthur Pendragon (Patient)',
          email: 'patient@clinic.com',
          password: 'patient123',
          role: 'user',
          fingerprintId: 'FP_2',
          createdAt: new Date().toISOString(),
        }
      ];
      localStorage.setItem('users_db', JSON.stringify(mockUsers));
    }

    if (!localStorage.getItem('fingerprints_db')) {
      const mockFps = [
        { _id: 'fp_1', fingerprintId: 'FP_1', userId: 'usr_admin101', name: 'Dr. Sarah\'s Right Index', createdAt: new Date().toISOString() },
        { _id: 'fp_2', fingerprintId: 'FP_2', userId: 'usr_patient202', name: 'Arthur\'s Left Thumb', createdAt: new Date().toISOString() }
      ];
      localStorage.setItem('fingerprints_db', JSON.stringify(mockFps));
    }

    if (!localStorage.getItem('records_db')) {
      // Seed past records to show a nice graph on login
      const mockRecords = [];
      const now = Date.now();
      
      // Arthur's seeded normal heart rate records
      for (let i = 20; i >= 0; i--) {
        const time = new Date(now - i * 15000).toISOString();
        const baseBpm = 72;
        const bpm = Math.round(baseBpm + (Math.random() - 0.5) * 6);
        mockRecords.push({
          _id: `rec_${i}`,
          userId: 'usr_patient202',
          bpm,
          status: 'normal',
          timestamp: time
        });
      }
      
      // Dr. Sarah's seeded normal heart rate records
      for (let i = 20; i >= 0; i--) {
        const time = new Date(now - i * 15000).toISOString();
        const baseBpm = 78;
        const bpm = Math.round(baseBpm + (Math.random() - 0.5) * 6);
        mockRecords.push({
          _id: `rec_admin_${i}`,
          userId: 'usr_admin101',
          bpm,
          status: 'normal',
          timestamp: time
        });
      }
      localStorage.setItem('records_db', JSON.stringify(mockRecords));
    }

    // 3. Auto login if user token exists
    const token = localStorage.getItem('token');
    if (token) {
      const users = JSON.parse(localStorage.getItem('users_db'));
      const found = users.find(u => u._id === token);
      if (found) {
        setUser(found);
      } else {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);

    return () => {
      stopPulseTelemetry();
      stopBiometricTimer();
    };
  }, []);

  // Theme controls
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    const root = window.document.documentElement;
    if (nextTheme === 'light') root.classList.add('light');
    else root.classList.remove('light');
    localStorage.setItem('theme', nextTheme);
  };

  // Start Real-Time Pulse simulation logic
  const startPulseTelemetry = (userId) => {
    stopPulseTelemetry();

    // Load user's past records for line chart
    const dbRecords = JSON.parse(localStorage.getItem('records_db') || '[]');
    const userHistory = dbRecords
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    setLiveHistory(userHistory.slice(-30));

    if (userHistory.length > 0) {
      const latest = userHistory[userHistory.length - 1];
      setLiveBpm(latest.bpm);
      setLiveStatus(latest.status);
    } else {
      setLiveBpm(74);
      setLiveStatus('normal');
    }

    let baseBpm = 75;
    let localLastBpm = baseBpm;

    sensorIntervalRef.current = setInterval(() => {
      // 1. Fetch current simulation settings
      const currentMode = simMode;
      let bpm = localLastBpm;

      const fluctuation = (Math.random() - 0.5) * 4; // +/- 2 BPM
      bpm += fluctuation;

      if (simMode === 'normal') {
        bpm = Math.max(62, Math.min(96, bpm));
        baseBpm = 75;
      } else if (simMode === 'bradycardia') {
        bpm = Math.max(38, Math.min(58, bpm));
        baseBpm = 48;
      } else if (simMode === 'tachycardia') {
        bpm = Math.max(104, Math.min(148, bpm));
        baseBpm = 125;
      } else if (simMode === 'unstable') {
        const swing = (Math.random() - 0.5) * 32;
        bpm = 80 + swing;
        bpm = Math.max(42, Math.min(155, bpm));
      }

      bpm = Math.round(bpm);
      localLastBpm = bpm;

      let status = 'normal';
      if (bpm < 60) status = 'bradycardia';
      if (bpm > 100) status = 'tachycardia';

      const dataPoint = {
        _id: `rec_sim_${Date.now()}`,
        userId,
        bpm,
        status,
        timestamp: new Date().toISOString()
      };

      // 2. Save reading to localStorage database
      const db = JSON.parse(localStorage.getItem('records_db') || '[]');
      db.push(dataPoint);
      localStorage.setItem('records_db', JSON.stringify(db));

      // 3. Update dashboard real-time states
      setLiveBpm(bpm);
      setLiveStatus(status);
      setLiveHistory(prev => {
        const next = [...prev, dataPoint];
        if (next.length > 30) next.shift();
        return next;
      });

      // 4. Handle Abnormal Alerts
      if (status !== 'normal') {
        const alertObj = {
          bpm,
          status,
          timestamp: dataPoint.timestamp,
          message: `Warning: Abnormal heart rate detected (${bpm} BPM - ${status.toUpperCase()})`
        };
        setAlerts(prev => [alertObj, ...prev].slice(0, 10));
      }
    }, 2000);
  };

  const stopPulseTelemetry = () => {
    if (sensorIntervalRef.current) {
      clearInterval(sensorIntervalRef.current);
      sensorIntervalRef.current = null;
    }
  };

  const stopBiometricTimer = () => {
    if (bioIntervalRef.current) {
      clearInterval(bioIntervalRef.current);
      bioIntervalRef.current = null;
    }
  };

  // Switch simulation mode
  const updateSimMode = (mode) => {
    setSimMode(mode);
  };

  useEffect(() => {
    if (user) {
      startPulseTelemetry(user._id);
    } else {
      stopPulseTelemetry();
      setLiveBpm(null);
      setLiveHistory([]);
      setAlerts([]);
    }
  }, [user, simMode]);

  // Auth Operations
  const register = async (name, email, password, role = 'user') => {
    setError(null);
    const users = JSON.parse(localStorage.getItem('users_db') || '[]');
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (exists) {
      throw new Error('User with this email already exists.');
    }

    const newUserObj = {
      _id: `usr_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      password,
      role,
      fingerprintId: null,
      createdAt: new Date().toISOString()
    };

    users.push(newUserObj);
    localStorage.setItem('users_db', JSON.stringify(users));

    localStorage.setItem('token', newUserObj._id);
    setUser(newUserObj);
    return newUserObj;
  };

  const login = async (email, password) => {
    setError(null);
    const users = JSON.parse(localStorage.getItem('users_db') || '[]');
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (!found) {
      throw new Error('Invalid email or password combination.');
    }

    localStorage.setItem('token', found._id);
    setUser(found);
    return found;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    stopPulseTelemetry();
  };

  // Biometrics Enrollment Simulation (5-second progress)
  const enrollFingerprint = (targetFpId) => {
    if (!user) return;
    stopBiometricTimer();

    setBioStatus({
      active: true,
      type: 'enroll',
      percent: 0,
      text: 'Sensor initialized. Place your finger.',
      complete: false,
      error: null
    });

    let progress = 0;
    bioIntervalRef.current = setInterval(() => {
      progress += 20;
      let text = 'Capturing fingerprint patterns...';
      if (progress === 40) text = 'Matching alignment maps...';
      if (progress === 60) text = 'Generating digital biometric hash...';
      if (progress === 80) text = 'Linking template signature to account...';
      if (progress === 100) text = 'Enrollment complete. Template saved.';

      setBioStatus(prev => ({ ...prev, percent: progress, text }));

      if (progress >= 100) {
        stopBiometricTimer();

        // Save biometric mapping in database
        const fingerprints = JSON.parse(localStorage.getItem('fingerprints_db') || '[]');
        
        // Remove user's previous fingerprint if any
        const filteredFps = fingerprints.filter(f => f.userId !== user._id);
        
        // Check if ID already exists
        const fpInUse = fingerprints.find(f => f.fingerprintId === targetFpId && f.userId !== user._id);
        if (fpInUse) {
          setBioStatus(prev => ({
            ...prev,
            complete: false,
            error: `Fingerprint ID '${targetFpId}' is already linked to another client.`
          }));
          return;
        }

        const newFpMapping = {
          _id: `fp_reg_${Date.now()}`,
          fingerprintId: targetFpId,
          userId: user._id,
          name: `${user.name}'s biometric login`,
          createdAt: new Date().toISOString()
        };
        filteredFps.push(newFpMapping);
        localStorage.setItem('fingerprints_db', JSON.stringify(filteredFps));

        // Update User profile fingerprintId
        const users = JSON.parse(localStorage.getItem('users_db') || '[]');
        const updatedUsers = users.map(u => {
          if (u._id === user._id) {
            return { ...u, fingerprintId: targetFpId };
          }
          return u;
        });
        localStorage.setItem('users_db', JSON.stringify(updatedUsers));

        // Update active session user state
        const updatedUser = { ...user, fingerprintId: targetFpId };
        setUser(updatedUser);

        setBioStatus(prev => ({ ...prev, complete: true }));
      }
    }, 1000);
  };

  // Biometrics Scan Identification Simulation (5-second progress)
  const loginWithFingerprint = (targetFpId) => {
    stopBiometricTimer();

    setBioStatus({
      active: true,
      type: 'scan',
      percent: 0,
      text: 'Activating sensor. Place finger on plate.',
      complete: false,
      error: null
    });

    let progress = 0;
    bioIntervalRef.current = setInterval(() => {
      progress += 20;
      let text = 'Reading finger ridges... Keep steady.';
      if (progress === 40) text = 'Extracting minutiae feature set...';
      if (progress === 60) text = 'Checking template maps...';
      if (progress === 80) text = 'Verifying cryptographic security signature...';
      if (progress === 100) text = 'Scan complete.';

      setBioStatus(prev => ({ ...prev, percent: progress, text }));

      if (progress >= 100) {
        stopBiometricTimer();

        // Lookup fingerprint mapping
        const fingerprints = JSON.parse(localStorage.getItem('fingerprints_db') || '[]');
        const fpMatch = fingerprints.find(f => f.fingerprintId === targetFpId);

        if (!fpMatch) {
          setBioStatus(prev => ({
            ...prev,
            complete: false,
            error: `Biometric key '${targetFpId}' not recognized in the database registry.`
          }));
          return;
        }

        const users = JSON.parse(localStorage.getItem('users_db') || '[]');
        const matchedUserObj = users.find(u => u._id === fpMatch.userId);

        if (!matchedUserObj) {
          setBioStatus(prev => ({
            ...prev,
            complete: false,
            error: 'Associated user account no longer exists.'
          }));
          return;
        }

        // Successfully matched!
        localStorage.setItem('token', matchedUserObj._id);
        setUser(matchedUserObj);
        setBioStatus(prev => ({ ...prev, complete: true, text: `Match successful! Welcome back, ${matchedUserObj.name}.` }));
      }
    }, 1000);
  };

  const cancelBiometrics = () => {
    stopBiometricTimer();
    setBioStatus({
      active: false,
      type: null,
      percent: 0,
      text: '',
      complete: false,
      error: null
    });
  };

  const clearBioStatus = () => {
    setBioStatus({
      active: false,
      type: null,
      percent: 0,
      text: '',
      complete: false,
      error: null
    });
  };

  const clearLocalHistory = () => {
    if (!user) return;
    const db = JSON.parse(localStorage.getItem('records_db') || '[]');
    const filteredDb = db.filter(r => r.userId !== user._id);
    localStorage.setItem('records_db', JSON.stringify(filteredDb));
    setLiveHistory([]);
    setLiveBpm(null);
    setLiveStatus('normal');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        theme,
        toggleTheme,
        register,
        login,
        logout,
        liveBpm,
        liveStatus,
        liveHistory,
        alerts,
        simMode,
        updateSimMode,
        bioStatus,
        enrollFingerprint,
        loginWithFingerprint,
        cancelBiometrics,
        clearBioStatus,
        clearLocalHistory,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
