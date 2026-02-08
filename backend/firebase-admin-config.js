/**
 * Firebase Admin SDK Configuration
 * Backend Firebase initialization and utilities
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

/**
 * Initialize Firebase Admin SDK
 * Supports both service account key and environment variables
 */
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) {
    return admin;
  }

  try {
    // Method 1: Using service account key file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                               path.join(__dirname, '../serviceAccountKey.json');

    try {
      const serviceAccount = require(serviceAccountPath);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || 
                     "https://isdn-6291c-default-rtdb.firebaseio.com"
      });

      console.log('✅ Firebase Admin SDK initialized with service account key');
      firebaseInitialized = true;
    } catch (error) {
      // Method 2: Using application default credentials (for deployment)
      console.warn('⚠️ Service account key not found, using application default credentials');
      
      admin.initializeApp({
        databaseURL: process.env.FIREBASE_DATABASE_URL || 
                     "https://isdn-6291c-default-rtdb.firebaseio.com"
      });

      console.log('✅ Firebase Admin SDK initialized with default credentials');
      firebaseInitialized = true;
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.log('📝 Firebase features will be disabled');
    firebaseInitialized = false;
  }

  return admin;
};

/**
 * Get Firebase Database reference
 */
const getDatabase = () => {
  try {
    if (!firebaseInitialized) {
      initializeFirebase();
    }
    return firebaseInitialized ? admin.database() : null;
  } catch (error) {
    console.error('❌ Error getting database:', error.message);
    return null;
  }
};

/**
 * Get Firebase Auth reference
 */
const getAuth = () => {
  try {
    if (!firebaseInitialized) {
      initializeFirebase();
    }
    return firebaseInitialized ? admin.auth() : null;
  } catch (error) {
    console.error('❌ Error getting auth:', error.message);
    return null;
  }
};

/**
 * Database helper functions
 */
const db = {
  /**
   * Write data to database
   */
  write: async (path, data) => {
    try {
      const database = getDatabase();
      if (!database) {
        console.warn('⚠️ Firebase not available, skipping write operation');
        return false;
      }

      await database.ref(path).set(data);
      console.log(`✅ Data written to ${path}`);
      return true;
    } catch (error) {
      console.error(`❌ Error writing to ${path}:`, error.message);
      return false;
    }
  },

  /**
   * Read data from database
   */
  read: async (path) => {
    try {
      const database = getDatabase();
      if (!database) {
        console.warn('⚠️ Firebase not available, returning null');
        return null;
      }

      const snapshot = await database.ref(path).get();
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error(`❌ Error reading from ${path}:`, error.message);
      return null;
    }
  },

  /**
   * Update data in database
   */
  update: async (path, updates) => {
    try {
      const database = getDatabase();
      if (!database) {
        console.warn('⚠️ Firebase not available, skipping update operation');
        return false;
      }

      await database.ref(path).update(updates);
      console.log(`✅ Data updated at ${path}`);
      return true;
    } catch (error) {
      console.error(`❌ Error updating ${path}:`, error.message);
      return false;
    }
  },

  /**
   * Delete data from database
   */
  delete: async (path) => {
    try {
      const database = getDatabase();
      if (!database) {
        console.warn('⚠️ Firebase not available, skipping delete operation');
        return false;
      }

      await database.ref(path).remove();
      console.log(`✅ Data deleted from ${path}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting ${path}:`, error.message);
      return false;
    }
  },

  /**
   * Query data from database
   */
  query: async (path, orderBy, limitTo) => {
    try {
      const database = getDatabase();
      if (!database) {
        console.warn('⚠️ Firebase not available, returning empty');
        return [];
      }

      let query = database.ref(path);

      if (orderBy) {
        query = query.orderByChild(orderBy);
      }

      if (limitTo) {
        query = query.limitToLast(limitTo);
      }

      const snapshot = await query.get();
      return snapshot.exists() ? snapshot.val() : [];
    } catch (error) {
      console.error(`❌ Error querying ${path}:`, error.message);
      return [];
    }
  }
};

/**
 * Authentication helper functions
 */
const auth = {
  /**
   * Create user
   */
  createUser: async (email, password, displayName = '') => {
    try {
      const firebaseAuth = getAuth();
      if (!firebaseAuth) {
        console.warn('⚠️ Firebase Auth not available');
        return null;
      }

      const userRecord = await firebaseAuth.createUser({
        email: email,
        password: password,
        displayName: displayName
      });

      console.log(`✅ User created: ${userRecord.uid}`);
      return userRecord;
    } catch (error) {
      console.error('❌ Error creating user:', error.message);
      return null;
    }
  },

  /**
   * Get user by email
   */
  getUserByEmail: async (email) => {
    try {
      const firebaseAuth = getAuth();
      if (!firebaseAuth) {
        console.warn('⚠️ Firebase Auth not available');
        return null;
      }

      const userRecord = await firebaseAuth.getUserByEmail(email);
      return userRecord;
    } catch (error) {
      console.error('❌ Error getting user:', error.message);
      return null;
    }
  },

  /**
   * Delete user
   */
  deleteUser: async (uid) => {
    try {
      const firebaseAuth = getAuth();
      if (!firebaseAuth) {
        console.warn('⚠️ Firebase Auth not available');
        return false;
      }

      await firebaseAuth.deleteUser(uid);
      console.log(`✅ User deleted: ${uid}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting user:', error.message);
      return false;
    }
  }
};

// Initialize Firebase when this module is loaded
initializeFirebase();

module.exports = {
  admin,
  initializeFirebase,
  getDatabase,
  getAuth,
  db,
  auth,
  isInitialized: () => firebaseInitialized
};
