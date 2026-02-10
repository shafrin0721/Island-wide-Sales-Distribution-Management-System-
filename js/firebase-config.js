/**
 * Firebase Configuration and Initialization
 * Frontend Firebase SDK Setup
 */

// Firebase configuration (attach to window to avoid redeclaration if script loads twice)
if (typeof window.firebaseConfig === 'undefined') {
  window.firebaseConfig = {
    apiKey: "AIzaSyBX7R9qfnkCTFAP-cDYYI611E-TUr3L4_w",
    authDomain: "isdn-6291c.firebaseapp.com",
    databaseURL: "https://isdn-6291c-default-rtdb.firebaseio.com",
    projectId: "isdn-6291c",
    storageBucket: "isdn-6291c.firebasestorage.app",
    messagingSenderId: "962394501475",
    appId: "1:962394501475:web:7bb0230e8caf9a8adba356",
    measurementId: "G-FYND6D8QPK"
  };
}

// Ensure Firebase Auth usage flag is available early so pages prefer Firebase auth flows
try { window.__USE_FIREBASE_AUTH__ = true; } catch (e) {}

/**
 * Firebase Helper Functions
 * Provides utility methods for Firebase operations
 */
if (typeof window.FirebaseHelper === 'undefined') {
  window.FirebaseHelper = {
  /**
   * Initialize Firebase (with fallback to local storage if unavailable)
   */
  init: async function() {
    try {
      console.log('🔍 Firebase init starting...');
      console.log('Firebase SDK available:', typeof firebase !== 'undefined');
      
      // Check if Firebase is available (will be loaded via CDN script tag)
      if (typeof firebase === 'undefined') {
        console.warn('❌ Firebase SDK not loaded. Check CDN link and console for script errors.');
        return false;
      }
      
      console.log('✓ Firebase SDK loaded');
      console.log('Firebase version:', firebase.SDK_VERSION || 'unknown');
      
      // Check if already initialized
      if (firebase.apps.length > 0) {
        console.log('✓ Firebase already initialized');
        return true;
      }
      
      // Initialize Firebase
      firebase.initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized successfully');
      // Enable client to use Firebase Auth flows
      try {
        window.__USE_FIREBASE_AUTH__ = true;
        console.log('🔐 Firebase Auth enabled (window.__USE_FIREBASE_AUTH__ = true)');
      } catch (e) {
        console.warn('Could not set __USE_FIREBASE_AUTH__ flag:', e);
      }
      console.log('Project:', firebaseConfig.projectId);
      console.log('DB URL:', firebaseConfig.databaseURL);
      return true;
    } catch (error) {
      console.error('❌ Firebase initialization error:', error.message);
      console.error('Error details:', error);
      console.log('📱 Falling back to localStorage for data persistence');
      return false;
    }
  },

  /**
   * Write data to Firebase Realtime Database
   */
  writeData: async function(path, data) {
    try {
      if (typeof firebase === 'undefined' || !firebase.database) {
        console.warn('Firebase not available, saving to localStorage');
        localStorage.setItem(path, JSON.stringify(data));
        return true;
      }

      const db = firebase.database();
      await db.ref(path).set(data);
      console.log(`✅ Data written to ${path}`);
      return true;
    } catch (error) {
      console.error(`❌ Error writing to ${path}:`, error.message);
      // Fallback to localStorage
      localStorage.setItem(path, JSON.stringify(data));
      return false;
    }
  },

  /**
   * Read data from Firebase Realtime Database
   */
  readData: async function(path) {
    try {
      if (typeof firebase === 'undefined' || !firebase.database) {
        console.warn('Firebase not available, reading from localStorage');
        const data = localStorage.getItem(path);
        return data ? JSON.parse(data) : null;
      }

      const db = firebase.database();
      const snapshot = await db.ref(path).get();
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error(`❌ Error reading from ${path}:`, error.message);
      // Fallback to localStorage
      const data = localStorage.getItem(path);
      return data ? JSON.parse(data) : null;
    }
  },

  /**
   * Update data in Firebase
   */
  updateData: async function(path, updates) {
    try {
      if (typeof firebase === 'undefined' || !firebase.database) {
        console.warn('Firebase not available, updating localStorage');
        const existing = localStorage.getItem(path);
        const data = existing ? JSON.parse(existing) : {};
        localStorage.setItem(path, JSON.stringify({ ...data, ...updates }));
        return true;
      }

      const db = firebase.database();
      await db.ref(path).update(updates);
      console.log(`✅ Data updated at ${path}`);
      return true;
    } catch (error) {
      console.error(`❌ Error updating ${path}:`, error.message);
      // Fallback to localStorage
      const existing = localStorage.getItem(path);
      const data = existing ? JSON.parse(existing) : {};
      localStorage.setItem(path, JSON.stringify({ ...data, ...updates }));
      return false;
    }
  },

  /**
   * Delete data from Firebase
   */
  deleteData: async function(path) {
    try {
      if (typeof firebase === 'undefined' || !firebase.database) {
        console.warn('Firebase not available, deleting from localStorage');
        localStorage.removeItem(path);
        return true;
      }

      const db = firebase.database();
      await db.ref(path).remove();
      console.log(`✅ Data deleted from ${path}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting ${path}:`, error.message);
      // Fallback to localStorage
      localStorage.removeItem(path);
      return false;
    }
  },

  /**
   * Listen for real-time updates
   */
  onDataChange: function(path, callback) {
    try {
      if (typeof firebase === 'undefined' || !firebase.database) {
        console.warn('Firebase not available for real-time updates');
        return null;
      }

      const db = firebase.database();
      const ref = db.ref(path);
      
      ref.on('value', (snapshot) => {
        callback(snapshot.val());
      });

      // Return unsubscribe function
      return () => ref.off();
    } catch (error) {
      console.error(`❌ Error setting up listener for ${path}:`, error.message);
      return null;
    }
  },

  /**
   * Get Firebase User Authentication
   */
  getCurrentUser: function() {
    try {
      if (typeof firebase === 'undefined' || !firebase.auth) {
        console.warn('Firebase Auth not available');
        // Return user from localStorage
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
      }

      return firebase.auth().currentUser;
    } catch (error) {
      console.error('❌ Error getting current user:', error.message);
      return null;
    }
  },

  /**
   * Sign out current user
   */
  signOut: async function() {
    try {
      if (typeof firebase === 'undefined' || !firebase.auth) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        return true;
      }

      await firebase.auth().signOut();
      console.log('✅ User signed out');
      return true;
    } catch (error) {
      console.error('❌ Error signing out:', error.message);
      return false;
    }
  }
  };
}

// Export for use in other modules (CommonJS environments)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig: window.firebaseConfig, FirebaseHelper: window.FirebaseHelper };
}
