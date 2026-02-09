// =====================================================
// NOTIFICATION ROUTES
// =====================================================

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

/**
 * GET /api/notifications
 * Get user notifications
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const db = require('../config/firebase').db;
        const snapshot = await db.collection('notifications')
            .where('user_id', '==', req.user.uid)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        const notifications = [];
        snapshot.forEach(doc => {
            notifications.push({ id: doc.id, ...doc.data() });
        });

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications'
        });
    }
});

/**
 * POST /api/notifications/mark-as-read/:id
 * Mark notification as read
 */
router.post('/mark-as-read/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const db = require('../config/firebase').db;
        
        await db.collection('notifications').doc(id).update({
            read: true,
            readAt: new Date()
        });

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update notification'
        });
    }
});

module.exports = router;
