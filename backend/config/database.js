// =====================================================
// DATABASE CONFIGURATION (Firebase/Firestore)
// Cloud Database Setup and Query Helpers
// =====================================================

const { db } = require('./firebase');

/**
 * Firestore Database Instance
 * Use this to access Firestore in your routes
 * 
 * Example usage:
 * const doc = await db.collection('users').doc(userId).get();
 * const docs = await db.collection('products').where('status', '==', 'active').get();
 */

/**
 * Query helper - Get documents from a collection
 * @param {string} collection - Collection name
 * @param {array} conditions - Array of [field, operator, value]
 * @returns {Promise} - Documents array
 */
const query = async (collection, conditions = []) => {
    try {
        let queryRef = db.collection(collection);
        
        // Apply WHERE conditions
        if (conditions.length > 0) {
            conditions.forEach(([field, operator, value]) => {
                queryRef = queryRef.where(field, operator, value);
            });
        }
        
        const snapshot = await queryRef.get();
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
 * Get document by ID
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise} - Document data
 */
const getDocument = async (collection, docId) => {
    try {
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
 * Create document
 * @param {string} collection - Collection name
 * @param {object} data - Document data
 * @returns {Promise} - New document reference
 */
const createDocument = async (collection, data) => {
    try {
        const docRef = await db.collection(collection).add({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        return docRef;
    } catch (error) {
        console.error(`Error creating document in ${collection}:`, error);
        throw error;
    }
};

/**
 * Update document
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @param {object} data - Update data
 * @returns {Promise}
 */
const updateDocument = async (collection, docId, data) => {
    try {
        await db.collection(collection).doc(docId).update({
            ...data,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error(`Error updating document in ${collection}:`, error);
        throw error;
    }
};

/**
 * Delete document
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise}
 */
const deleteDocument = async (collection, docId) => {
    try {
        await db.collection(collection).doc(docId).delete();
    } catch (error) {
        console.error(`Error deleting document from ${collection}:`, error);
        throw error;
    }
};

/**
 * Close connection (not needed for Firestore)
 */
const closePool = async () => {
    console.log('Firestore (no connection pool to close)');
};

module.exports = {
    db,
    query,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    closePool
};
