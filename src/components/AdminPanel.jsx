'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Fingerprint, Activity, Download, Trash2, Key, UserPlus, Save, ShieldAlert, BarChart3, AlertTriangle, ShieldCheck, Check, X } from 'lucide-react';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  
  // Data lists
  const [users, setUsers] = useState([]);
  const [fingerprints, setFingerprints] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(null); // holds userId
  const [editingUser, setEditingUser] = useState(null); // holds userId

  const [newUserFormData, setNewUserFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [editUserFormData, setEditUserFormData] = useState({ name: '', email: '', role: '', fingerprintId: '' });
  const [resetPasswordInput, setResetPasswordInput] = useState('');

  // Load active tab data
  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'users') {
        const data = await api.admin.getUsers();
        setUsers(data || []);
      } else if (activeTab === 'fingerprints') {
        const data = await api.admin.getFingerprints();
        setFingerprints(data || []);
      } else if (activeTab === 'logs') {
        const data = await api.admin.getRecords();
        setRecords(data || []);
      } else if (activeTab === 'reports') {
        const data = await api.admin.getSummary();
        setSummary(data.summary || null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load administration data.');
    } finally {
      setLoading(false);
    }
  };

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Add user manually
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.admin.createUser(newUserFormData);
      setNewUserFormData({ name: '', email: '', password: '', role: 'user' });
      setShowCreateForm(false);
      triggerSuccess(`User '${newUserFormData.name}' registered successfully.`);
      loadTabData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Edit user save
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.admin.updateUser(editingUser, editUserFormData);
      setEditingUser(null);
      triggerSuccess('User profile details updated.');
      loadTabData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Save reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.admin.resetPassword(showPasswordForm, resetPasswordInput);
      setShowPasswordForm(null);
      setResetPasswordInput('');
      triggerSuccess(res.message || 'User password reset completed.');
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete user
  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete user account '${name}'? This wipes all heart rate logs and unregisters their fingerprint.`)) {
      try {
        const res = await api.admin.deleteUser(id);
        triggerSuccess(res.message || 'User deleted.');
        loadTabData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Delete fingerprint registration
  const handleDeleteFingerprint = async (id, fpId) => {
    if (window.confirm(`Are you sure you want to unregister and delete fingerprint mapping '${fpId}'?`)) {
      try {
        const res = await api.admin.deleteFingerprint(id);
        triggerSuccess(res.message || 'Biometric key unregistered.');
        loadTabData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Delete single heart rate log entry
  const handleDeleteRecord = async (id) => {
    if (window.confirm('Delete this telemetry reading?')) {
      try {
        const res = await api.admin.deleteRecord(id);
        triggerSuccess(res.message || 'Reading deleted.');
        loadTabData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Clear all logs for a user
  const handleClearUserLogs = async (userId, name) => {
    if (window.confirm(`Delete ALL historical medical logs for patient '${name}'?`)) {
      try {
        const res = await api.admin.clearUserRecords(userId);
        triggerSuccess(res.message || 'Telemetry logs cleared.');
        loadTabData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Export report to CSV
  const handleDownloadCsv = async () => {
    try {
      const csvContent = await api.admin.downloadCsv();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `CardioSync_MasterReport_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('CSV Export failed: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Admin Title & Tab Headers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert style={{ color: 'var(--color-primary)' }} />
            Clinic Administration Console
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Manage users, biometrics, telemetry logs, and export system analytics.</p>
        </div>

        {/* Tab selection menu */}
        <div style={{ display: 'flex', gap: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '4px', background: 'rgba(0,0,0,0.15)' }}>
          <button 
            onClick={() => setActiveTab('users')} 
            className="btn" 
            style={{
              padding: '0.4rem 1rem', width: 'auto', fontSize: '0.85rem',
              background: activeTab === 'users' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'users' ? 'white' : 'var(--text-secondary)'
            }}
          >
            <Users size={14} /> Users
          </button>
          <button 
            onClick={() => setActiveTab('fingerprints')} 
            className="btn" 
            style={{
              padding: '0.4rem 1rem', width: 'auto', fontSize: '0.85rem',
              background: activeTab === 'fingerprints' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'fingerprints' ? 'white' : 'var(--text-secondary)'
            }}
          >
            <Fingerprint size={14} /> Biometric Keys
          </button>
          <button 
            onClick={() => setActiveTab('logs')} 
            className="btn" 
            style={{
              padding: '0.4rem 1rem', width: 'auto', fontSize: '0.85rem',
              background: activeTab === 'logs' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'logs' ? 'white' : 'var(--text-secondary)'
            }}
          >
            <Activity size={14} /> Telemetry Logs
          </button>
          <button 
            onClick={() => setActiveTab('reports')} 
            className="btn" 
            style={{
              padding: '0.4rem 1rem', width: 'auto', fontSize: '0.85rem',
              background: activeTab === 'reports' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'reports' ? 'white' : 'var(--text-secondary)'
            }}
          >
            <BarChart3 size={14} /> Analytics & Reports
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--border-radius-md)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--border-radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* TAB CONTENTS */}
      
      {/* 1. USERS TAB */}
      {activeTab === 'users' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Registered Patients & Staff ({users.length})</h3>
            <button 
              onClick={() => { setShowCreateForm(!showCreateForm); setEditingUser(null); }}
              className="btn btn-primary"
              style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              <UserPlus size={14} /> {showCreateForm ? 'Cancel' : 'Create User Account'}
            </button>
          </div>

          {/* Form to Create User */}
          {showCreateForm && (
            <form onSubmit={handleCreateUser} className="card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Register User Account</h4>
              <div className="grid grid-3" style={{ gap: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Full Name</label>
                  <input type="text" className="form-input" style={{ padding: '0.5rem' }} required value={newUserFormData.name} onChange={(e) => setNewUserFormData({...newUserFormData, name: e.target.value})} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Email Address</label>
                  <input type="email" className="form-input" style={{ padding: '0.5rem' }} required value={newUserFormData.email} onChange={(e) => setNewUserFormData({...newUserFormData, email: e.target.value})} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Password</label>
                  <input type="password" className="form-input" style={{ padding: '0.5rem' }} required placeholder="min 6 chars" value={newUserFormData.password} onChange={(e) => setNewUserFormData({...newUserFormData, password: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>System Role:</span>
                  <select className="form-input" style={{ width: 'auto', padding: '0.35rem 1.5rem 0.35rem 0.5rem' }} value={newUserFormData.role} onChange={(e) => setNewUserFormData({...newUserFormData, role: e.target.value})}>
                    <option value="user">Patient (user)</option>
                    <option value="admin">Clinic Admin (admin)</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-accent" style={{ width: 'auto', padding: '0.4rem 1.25rem' }}>Register Account</button>
              </div>
            </form>
          )}

          {/* Form to edit user */}
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', borderColor: 'var(--color-accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem' }}>Edit User Profile</h4>
                <button type="button" onClick={() => setEditingUser(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <div className="grid grid-4" style={{ gap: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Full Name</label>
                  <input type="text" className="form-input" style={{ padding: '0.5rem' }} required value={editUserFormData.name} onChange={(e) => setEditUserFormData({...editUserFormData, name: e.target.value})} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Email Address</label>
                  <input type="email" className="form-input" style={{ padding: '0.5rem' }} required value={editUserFormData.email} onChange={(e) => setEditUserFormData({...editUserFormData, email: e.target.value})} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Role</label>
                  <select className="form-input" style={{ padding: '0.5rem' }} value={editUserFormData.role} onChange={(e) => setEditUserFormData({...editUserFormData, role: e.target.value})}>
                    <option value="user">Patient (user)</option>
                    <option value="admin">Admin (admin)</option>
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Fingerprint Slot</label>
                  <input type="text" className="form-input" style={{ padding: '0.5rem' }} placeholder="None (e.g. FP_1)" value={editUserFormData.fingerprintId} onChange={(e) => setEditUserFormData({...editUserFormData, fingerprintId: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-accent" style={{ width: 'auto', padding: '0.4rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Save size={14} /> Update User
                </button>
              </div>
            </form>
          )}

          {/* Form to change user password */}
          {showPasswordForm && (
            <form onSubmit={handleResetPassword} className="card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', borderColor: 'var(--color-warning)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem' }}>Change Account Password</h4>
                <button type="button" onClick={() => setShowPasswordForm(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="input-label">New Password (minimum 6 characters)</label>
                  <input type="password" placeholder="••••••••" className="form-input" style={{ padding: '0.5rem' }} required value={resetPasswordInput} onChange={(e) => setResetPasswordInput(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem', height: '38px' }}>Update Password</button>
              </div>
            </form>
          )}

          {/* Users Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>User Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Email Address</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Biometric ID</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((item) => (
                    <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{item.email}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {item.role === 'admin' ? (
                          <span className="badge badge-danger">Admin</span>
                        ) : (
                          <span className="badge badge-info">Patient</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {item.fingerprintId ? (
                          <span className="badge badge-success" style={{ gap: '0.2rem' }}><Fingerprint size={10} /> {item.fingerprintId}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>None Linked</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-start' }}>
                          <button
                            onClick={() => {
                              setEditingUser(item._id);
                              setEditUserFormData({ name: item.name, email: item.email, role: item.role, fingerprintId: item.fingerprintId || '' });
                              setShowCreateForm(false);
                              setShowPasswordForm(null);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', width: 'auto', fontSize: '0.75rem' }}
                          >
                            Edit Profile
                          </button>
                          <button
                            onClick={() => {
                              setShowPasswordForm(item._id);
                              setEditingUser(null);
                              setShowCreateForm(false);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', width: 'auto', fontSize: '0.75rem', gap: '0.2rem' }}
                          >
                            <Key size={10} /> Password
                          </button>
                          <button
                            onClick={() => handleDeleteUser(item._id, item.name)}
                            className="btn btn-danger"
                            style={{ padding: '0.25rem 0.5rem', width: 'auto', fontSize: '0.75rem' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No registered users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. BIOMETRIC KEYS TAB */}
      {activeTab === 'fingerprints' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.15rem' }}>Biometric Signature Registry</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            List of registered biometric fingerprints in the physical hardware database linked to users accounts:
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Fingerprint Slot ID</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Mapped User Account</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>User Email</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Date Registered</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fingerprints.length > 0 ? (
                  fingerprints.map((item) => (
                    <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Fingerprint size={14} /> {item.fingerprintId}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                        {item.userId ? item.userId.name : <span style={{ color: 'var(--color-danger)' }}>Unlinked User</span>}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {item.userId ? item.userId.email : 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <button
                          onClick={() => handleDeleteFingerprint(item._id, item.fingerprintId)}
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.5rem', width: 'auto', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Trash2 size={12} />
                          <span>Unregister Biometric Key</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No fingerprints registered in the database registry.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TELEMETRY LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.15rem' }}>Global Cardiovascular Telemetry Logs</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            List of all incoming physiological pulse data logged inside the master MongoDB schema:
          </p>

          <div style={{ overflowX: 'auto', maxHeight: '450px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)', position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 1 }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Patient Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Heart Rate (BPM)</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Classification</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map((item) => (
                    <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>
                        {item.userId ? item.userId.name : <span style={{ color: 'var(--color-danger)' }}>Deleted User</span>}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700, fontFamily: 'monospace', fontSize: '1.05rem' }}>
                        {item.bpm} BPM
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem' }}>
                        {item.status === 'tachycardia' && (
                          <span className="badge badge-danger" style={{ gap: '0.2rem' }}><AlertTriangle size={10} /> Tachycardia</span>
                        )}
                        {item.status === 'bradycardia' && (
                          <span className="badge badge-warning" style={{ gap: '0.2rem' }}><AlertTriangle size={10} /> Bradycardia</span>
                        )}
                        {item.status === 'normal' && (
                          <span className="badge badge-success">Normal Rhythm</span>
                        )}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleDeleteRecord(item._id)}
                            className="btn btn-secondary text-danger"
                            style={{ padding: '0.25rem 0.5rem', width: 'auto', fontSize: '0.75rem', color: 'var(--color-danger)' }}
                            title="Delete Reading"
                          >
                            <Trash2 size={12} />
                          </button>
                          {item.userId && (
                            <button
                              onClick={() => handleClearUserLogs(item.userId._id, item.userId.name)}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', width: 'auto', fontSize: '0.75rem' }}
                              title="Clear all logs for this patient"
                            >
                              Clear Patient Logs
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No telemetry logs recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ANALYTICS & REPORTS TAB */}
      {activeTab === 'reports' && summary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Summary metrics widgets */}
          <div className="grid grid-4">
            <div className="card">
              <span className="input-label">Total Population</span>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{summary.totalUsers}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Registered User Accounts</span>
            </div>
            <div className="card">
              <span className="input-label">Biometric Enrolls</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent)' }}>{summary.registeredFp}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fingerprints Register Map</span>
            </div>
            <div className="card">
              <span className="input-label">Mean Heart Rate</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>{summary.avgBpm} BPM</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>System Avg ({summary.totalRecords} logs)</span>
            </div>
            <div className="card">
              <span className="input-label">System BPM Extremes</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {summary.minBpm} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Min</span> / {summary.maxBpm} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Max</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cardiovascular ranges</span>
            </div>
          </div>

          <div className="grid grid-2">
            
            {/* Rhythm breakdowns */}
            <div className="card">
              <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Cardiac Rhythm Classification Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-success)', fontWeight: 600 }}>
                      <ShieldCheck size={16} /> Sinus Rhythm (Normal)
                    </span>
                    <span>{summary.alerts.normal} readings</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(summary.alerts.normal / (summary.totalRecords || 1)) * 100}%`, height: '100%', backgroundColor: 'var(--color-success)' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                      <AlertTriangle size={16} /> Bradycardia (Low)
                    </span>
                    <span>{summary.alerts.bradycardia} readings</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(summary.alerts.bradycardia / (summary.totalRecords || 1)) * 100}%`, height: '100%', backgroundColor: 'var(--color-warning)' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                      <AlertTriangle size={16} /> Tachycardia (High)
                    </span>
                    <span>{summary.alerts.tachycardia} readings</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(summary.alerts.tachycardia / (summary.totalRecords || 1)) * 100}%`, height: '100%', backgroundColor: 'var(--color-danger)' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* CSV report download trigger */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2rem' }}>
              <div style={{
                background: 'rgba(0, 242, 254, 0.08)',
                color: 'var(--color-accent)',
                padding: '1rem',
                borderRadius: '50%',
                marginBottom: '1rem',
                boxShadow: 'var(--box-shadow-glow-teal)'
              }}>
                <Download size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Export Patient Telemetry Data</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '320px' }}>
                Download a consolidated Excel-compatible CSV report containing timestamps, patient profiles, recorded heart rates, and medical classifications.
              </p>
              <button 
                onClick={handleDownloadCsv}
                className="btn btn-primary"
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}
              >
                <Download size={18} />
                <span>Download master CSV report</span>
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default AdminPanel;
