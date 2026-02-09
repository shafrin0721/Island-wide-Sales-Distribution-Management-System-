// =====================================================
// INVENTORY ROUTES
// =====================================================

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * GET /api/inventory
 * Get inventory items
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const db = require('../config/firebase').db;
        const snapshot = await db.collection('inventory').get();
        
        const items = [];
        snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
        });

        res.json({
            success: true,
            items
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get inventory'
        });
    }
});

/**
 * POST /api/inventory
 * Add inventory item (admin only)
 */
router.post('/', verifyToken, checkRole('admin', 'rdc'), async (req, res) => {
    try {
        const { product_id, quantity, location } = req.body;
        const db = require('../config/firebase').db;
        
        const docRef = await db.collection('inventory').add({
            product_id,
            quantity,
            location,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Inventory item added',
            id: docRef.id
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add inventory item'
        });
    }
});

module.exports = router;
