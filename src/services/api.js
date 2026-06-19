// Client-Side Simulated API Layer
// Directly manipulates the LocalStorage Mock DB to allow standalone operation.
// To connect to a real Node/Express backend in the future, replace the bodies
// of these methods with native fetch() calls.

const getUsersDb = () => JSON.parse(localStorage.getItem('users_db') || '[]');
const saveUsersDb = (db) => localStorage.setItem('users_db', JSON.stringify(db));

const getFpsDb = () => JSON.parse(localStorage.getItem('fingerprints_db') || '[]');
const saveFpsDb = (db) => localStorage.setItem('fingerprints_db', JSON.stringify(db));

const getRecordsDb = () => JSON.parse(localStorage.getItem('records_db') || '[]');
const saveRecordsDb = (db) => localStorage.setItem('records_db', JSON.stringify(db));

export const api = {
  // Mock Admin APIs
  admin: {
    getUsers: async () => {
      return getUsersDb();
    },

    createUser: async (userData) => {
      const users = getUsersDb();
      const exists = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
      if (exists) throw new Error('User with this email already exists.');

      const newUser = {
        _id: `usr_${Date.now()}`,
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: userData.password,
        role: userData.role || 'user',
        fingerprintId: null,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      saveUsersDb(users);
      return newUser;
    },

    updateUser: async (id, userData) => {
      const users = getUsersDb();
      const fingerprints = getFpsDb();
      const userIdx = users.findIndex(u => u._id === id);
      
      if (userIdx === -1) throw new Error('User not found.');

      const prevFpId = users[userIdx].fingerprintId;
      const newFpId = userData.fingerprintId || null;

      // Handle fingerprint mapping updates
      if (newFpId !== prevFpId) {
        // Unlink previous fingerprint link
        let updatedFps = fingerprints.filter(f => f.userId !== id);
        
        if (newFpId) {
          // Unlink anyone else holding the new fingerprint ID
          updatedFps = updatedFps.filter(f => f.fingerprintId !== newFpId);
          
          const usersWithNewFp = users.map(u => {
            if (u.fingerprintId === newFpId) return { ...u, fingerprintId: null };
            return u;
          });
          
          // Register new fingerprint map
          updatedFps.push({
            _id: `fp_${Date.now()}`,
            fingerprintId: newFpId,
            userId: id,
            name: `${userData.name || users[userIdx].name}'s biometric login`,
            createdAt: new Date().toISOString()
          });

          // Apply unlinking changes to other users
          saveUsersDb(usersWithNewFp);
        }
        saveFpsDb(updatedFps);
      }

      // Update user details
      const userDbCopy = JSON.parse(localStorage.getItem('users_db') || '[]');
      const targetUser = userDbCopy.find(u => u._id === id);
      if (targetUser) {
        targetUser.name = userData.name || targetUser.name;
        targetUser.email = userData.email || targetUser.email;
        targetUser.role = userData.role || targetUser.role;
        targetUser.fingerprintId = newFpId;
        
        const filteredUsers = userDbCopy.map(u => u._id === id ? targetUser : u);
        saveUsersDb(filteredUsers);
        return targetUser;
      }
      throw new Error('Update execution failed.');
    },

    resetPassword: async (id, password) => {
      const users = getUsersDb();
      const user = users.find(u => u._id === id);
      if (!user) throw new Error('User not found.');

      user.password = password;
      saveUsersDb(users);
      return { message: `Password reset successfully for user: ${user.name}` };
    },

    deleteUser: async (id) => {
      const users = getUsersDb();
      const fingerprints = getFpsDb();
      const records = getRecordsDb();

      const user = users.find(u => u._id === id);
      if (!user) throw new Error('User not found.');

      // Remove from database
      const remainingUsers = users.filter(u => u._id !== id);
      saveUsersDb(remainingUsers);

      // Cleanup fingerprints mapping
      const remainingFps = fingerprints.filter(f => f.userId !== id);
      saveFpsDb(remainingFps);

      // Cleanup heart logs
      const remainingRecs = records.filter(r => r.userId !== id);
      saveRecordsDb(remainingRecs);

      return { message: `User account '${user.name}' and all associated medical records deleted.` };
    },

    getFingerprints: async () => {
      const fingerprints = getFpsDb();
      const users = getUsersDb();

      // Populate user info
      return fingerprints.map(fp => {
        const matchingUser = users.find(u => u._id === fp.userId);
        return {
          ...fp,
          userId: matchingUser ? { _id: matchingUser._id, name: matchingUser.name, email: matchingUser.email } : null
        };
      });
    },

    deleteFingerprint: async (id) => {
      const fingerprints = getFpsDb();
      const users = getUsersDb();
      const targetFp = fingerprints.find(f => f._id === id);

      if (!targetFp) throw new Error('Fingerprint not found.');

      // Remove mapping
      const remainingFps = fingerprints.filter(f => f._id !== id);
      saveFpsDb(remainingFps);

      // Reset user reference
      const updatedUsers = users.map(u => {
        if (u._id === targetFp.userId) {
          return { ...u, fingerprintId: null };
        }
        return u;
      });
      saveUsersDb(updatedUsers);

      return { message: 'Fingerprint unregistered and unlinked from user account.' };
    },

    getRecords: async () => {
      const records = getRecordsDb();
      const users = getUsersDb();

      // Join users details
      const populated = records.map(rec => {
        const matchingUser = users.find(u => u._id === rec.userId);
        return {
          ...rec,
          userId: matchingUser ? { _id: matchingUser._id, name: matchingUser.name, email: matchingUser.email } : null
        };
      });

      // Sort descending (latest first)
      return populated.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 200);
    },

    deleteRecord: async (id) => {
      const records = getRecordsDb();
      const remaining = records.filter(r => r._id !== id);
      saveRecordsDb(remaining);
      return { message: 'Heart rate record deleted.' };
    },

    clearUserRecords: async (userId) => {
      const records = getRecordsDb();
      const remaining = records.filter(r => r.userId !== userId);
      saveRecordsDb(remaining);
      return { message: 'All heart rate records for user cleared.' };
    },

    getSummary: async () => {
      const users = getUsersDb();
      const fingerprints = getFpsDb();
      const records = getRecordsDb();

      const totalUsers = users.length;
      const registeredFp = fingerprints.length;
      const totalRecords = records.length;

      let avgBpm = 0;
      let maxBpm = 0;
      let minBpm = totalRecords > 0 ? 300 : 0;
      let sumBpm = 0;

      const alerts = {
        normal: 0,
        bradycardia: 0,
        tachycardia: 0
      };

      records.forEach(rec => {
        sumBpm += rec.bpm;
        if (rec.bpm > maxBpm) maxBpm = rec.bpm;
        if (rec.bpm < minBpm) minBpm = rec.bpm;

        if (rec.status) {
          alerts[rec.status] = (alerts[rec.status] || 0) + 1;
        }
      });

      if (totalRecords > 0) {
        avgBpm = Math.round(sumBpm / totalRecords);
      }

      return {
        summary: {
          totalUsers,
          registeredFp,
          totalRecords,
          avgBpm,
          maxBpm,
          minBpm: minBpm === 300 ? 0 : minBpm,
          alerts
        }
      };
    },

    downloadCsv: async () => {
      const records = getRecordsDb();
      const users = getUsersDb();

      let csvContent = 'Timestamp,User Name,User Email,BPM,Classification\n';
      
      const populated = records.map(rec => {
        const matchingUser = users.find(u => u._id === rec.userId);
        return {
          ...rec,
          userId: matchingUser ? { _id: matchingUser._id, name: matchingUser.name, email: matchingUser.email } : null
        };
      }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      populated.forEach(rec => {
        const timestamp = rec.timestamp;
        const userName = rec.userId ? rec.userId.name.replace(/"/g, '""') : 'Deleted User';
        const userEmail = rec.userId ? rec.userId.email.replace(/"/g, '""') : 'N/A';
        const bpm = rec.bpm;
        const status = rec.status;
        
        csvContent += `"${timestamp}","${userName}","${userEmail}",${bpm},"${status}"\n`;
      });

      return csvContent;
    }
  }
};
