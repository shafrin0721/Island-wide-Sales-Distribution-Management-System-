// =====================================================
// RECOMMENDATION ROUTES
// =====================================================

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

/**
 * GET /api/recommendations
 * Get product recommendations for user
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const db = require('../config/firebase').db;
        
        // Get user recommendations
        const snapshot = await db.collection('recommendations')
            .where('user_id', '==', req.user.uid)
            .orderBy('score', 'desc')
            .limit(10)
            .get();
        
        const recommendations = [];
        snapshot.forEach(doc => {
            recommendations.push({ id: doc.id, ...doc.data() });
        });

        res.json({
            success: true,
            recommendations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get recommendations'
        });
    }
});

/**
 * GET /api/recommendations/trending
 * Get trending products
 */
router.get('/trending', verifyToken, async (req, res) => {
    try {
        const db = require('../config/firebase').db;
        
        const snapshot = await db.collection('products')
            .orderBy('popularity', 'desc')
            .limit(10)
            .get();
        
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        res.json({
            success: true,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get trending products'
        });
    }
});

module.exports = router;
