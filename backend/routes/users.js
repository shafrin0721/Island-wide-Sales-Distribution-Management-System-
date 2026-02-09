// =====================================================
// USER ROUTES
// =====================================================

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

/**
 * GET /api/users/profile
 * Get user profile
 */
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const db = require('../config/firebase').db;
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: userDoc.data()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
});

module.exports = router;
