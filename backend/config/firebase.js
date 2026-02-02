// =====================================================
// FIREBASE CONFIGURATION
// Cloud Database Setup (Firestore + Firebase Auth)
// =====================================================

const admin = require('firebase-admin');
const path = require('path');

let db, auth;
let firebaseInitialized = false;

// Initialize Firebase Admin SDK
try {
    // Check if required credentials are set
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('Firebase credentials not configured in .env file');
    }

    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    // Initialize Firebase Admin
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
    });

    // Get Firestore database
    db = admin.firestore();

    // Get Firebase Auth
    auth = admin.auth();

    firebaseInitialized = true;
    console.log('✓ Firebase Admin SDK initialized');
} catch (err) {
    console.error('⚠️  Firebase initialization error:', err.message);
    console.error('   Please configure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in .env file');
    console.error('   See FIREBASE_SETUP.md for instructions');
}

/**
 * Test Firebase Connection
 */
const testConnection = async () => {
    try {
        if (!firebaseInitialized) {
            throw new Error('Firebase not initialized. Please configure credentials in .env file');
        }
        
        await db.collection('_test').doc('connection').set({ timestamp: new Date() });
        await db.collection('_test').doc('connection').delete();
        console.log('✓ Firebase connection successful');
        return true;
    } catch (err) {
        console.error('✗ Firebase connection failed:', err.message);
        return false;
    }
};

/**
 * Create a new document
 */
const createDocument = async (collection, data) => {
    try {
        if (!firebaseInitialized) {
            throw new Error('Firebase not initialized. Please configure credentials in .env file');
        }
        const docRef = await db.collection(collection).add({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error(`Error creating document in ${collection}:`, error);
        throw error;
    }
};

/**
 * Get document by ID
 */
const getDocument = async (collection, docId) => {
    try {
        if (!firebaseInitialized) {
            throw new Error('Firebase not initialized. Please configure credentials in .env file');
        }
        const doc = await db.collection(collection).doc(docId).get();
        if (!doc.exists) {
            return null;
        }
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        console.error(`Error getting document from ${collection}:`, error);
        throw error;
    }
};

/**
 * Query documents
 */
const queryDocuments = async (collection, whereConditions = []) => {
    try {
        if (!firebaseInitialized) {
            throw new Error('Firebase not initialized. Please configure credentials in .env file');
        }
        let query = db.collection(collection);

        // Apply where conditions
        for (const condition of whereConditions) {
            const [field, operator, value] = condition;
            query = query.where(field, operator, value);
        }

        const snapshot = await query.get();
        const docs = [];

        snapshot.forEach(doc => {
            docs.push({ id: doc.id, ...doc.data() });
        });

        return docs;
    } catch (error) {
        console.error(`Error querying ${collection}:`, error);
        throw error;
    }
};

/**
 * Update document
 */
const updateDocument = async (collection, docId, data) => {
    try {
        if (!firebaseInitialized) {
            throw new Error('Firebase not initialized. Please configure credentials in .env file');
        }
        await db.collection(collection).doc(docId).update({
            ...data,
            updatedAt: new Date(),
        });
        return { id: docId, ...data };
    } catch (error) {
        console.error(`Error updating document in ${collection}:`, error);
        throw error;
    }
};

/**
 * Delete document (Soft delete with deletedAt flag)
 */
const deleteDocument = async (collection, docId) => {
    try {
        if (!firebaseInitialized) {
            throw new Error('Firebase not initialized. Please configure credentials in .env file');
        }
        await db.collection(collection).doc(docId).update({
            deletedAt: new Date(),
        });
        return { id: docId, deleted: true };
    } catch (error) {
        console.error(`Error deleting document from ${collection}:`, error);
        throw error;
    }
};

/**
 * Batch write operations
 */
const batchWrite = async (operations) => {
    try {
        if (!firebaseInitialized) {
            throw new Error('Firebase not initialized. Please configure credentials in .env file');
        }
        const batch = db.batch();

        for (const op of operations) {
            const ref = db.collection(op.collection).doc(op.docId);
            if (op.type === 'set') {
                batch.set(ref, op.data);
            } else if (op.type === 'update') {
                batch.update(ref, op.data);
            } else if (op.type === 'delete') {
                batch.delete(ref);
            }
        }

        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error('Error in batch write:', error);
        throw error;
    }
};

/**
 * Create User Account (Firebase Auth)
 */
const createUser = async (email, password, displayName) => {
    try {
        if (!firebaseInitialized) {
            throw new Error('Firebase not initialized. Please configure credentials in .env file');
        }

        const userRecord = await auth.createUser({
            email,
            password,
            displayName,
        });

        // Create user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            email,
            displayName,
            role: 'customer',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return { uid: userRecord.uid, email, displayName };
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

/**
 * Get User by Email
 */
const getUserByEmail = async (email) => {
    try {
        if (!firebaseInitialized) {
            throw new Error('Firebase not initialized. Please configure credentials in .env file');
        }

        const userRecord = await auth.getUserByEmail(email);
        const userDoc = await db.collection('users').doc(userRecord.uid).get();

        return {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            ...userDoc.data(),
        };
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            return null;
        }
        console.error('Error getting user:', error);
        throw error;
    }
};

/**
 * Create Custom Token for Authentication
 */
const createCustomToken = async (uid) => {
    try {
        if (!firebaseInitialized) {
            throw new Error('Firebase not initialized. Please configure credentials in .env file');
        }
        const customToken = await auth.createCustomToken(uid);
        return customToken;
    } catch (error) {
        console.error('Error creating custom token:', error);
        throw error;
    }
};

/**
 * Verify ID Token
 */
const verifyToken = async (token) => {
    try {
        if (!firebaseInitialized) {
            throw new Error('Firebase not initialized. Please configure credentials in .env file');
        }
        const decodedToken = await auth.verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error('Error verifying token:', error);
        throw error;
    }
};

/**
 * Get paginated results
 */
const getPaginated = async (collection, pageSize = 20, pageNumber = 1, whereConditions = []) => {
    try {
        if (!firebaseInitialized) {
            throw new Error('Firebase not initialized. Please configure credentials in .env file');
        }
        let query = db.collection(collection);

        // Apply where conditions
        for (const condition of whereConditions) {
            const [field, operator, value] = condition;
            query = query.where(field, operator, value);
        }

        // Get total count
        const countSnapshot = await query.count().get();
        const total = countSnapshot.data().count;

        // Get paginated results
        const offset = (pageNumber - 1) * pageSize;
        const snapshot = await query.offset(offset).limit(pageSize).get();

        const docs = [];
        snapshot.forEach(doc => {
            docs.push({ id: doc.id, ...doc.data() });
        });

        return {
            data: docs,
            pagination: {
                pageNumber,
                pageSize,
                total,
                pages: Math.ceil(total / pageSize),
            },
        };
    } catch (error) {
        console.error(`Error getting paginated results from ${collection}:`, error);
        throw error;
    }
};

module.exports = {
    db,
    auth,
    testConnection,
    createDocument,
    getDocument,
    queryDocuments,
    updateDocument,
    deleteDocument,
    batchWrite,
    createUser,
    getUserByEmail,
    createCustomToken,
    verifyToken,
    getPaginated,
};
