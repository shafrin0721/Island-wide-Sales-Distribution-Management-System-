// =====================================================
// DELIVERY ROUTES
// Real-time Delivery Tracking & GPS Updates
// =====================================================

const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * CREATE DELIVERY FOR ORDER
 * POST /api/deliveries
 */
router.post('/', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { order_id, driver_id, vehicle_registration, scheduled_delivery_time } = req.body;

        // Get order
        const orderResult = await query(
            'SELECT * FROM orders WHERE id = $1',
            [order_id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Generate delivery number
        const deliveryNumResult = await query(
            "SELECT COUNT(*) as count FROM deliveries WHERE DATE(created_at) = CURRENT_DATE"
        );
        const deliveryNum = String(deliveryNumResult.rows[0].count + 1).padStart(5, '0');
        const deliveryNumber = `DLV-${new Date().getFullYear()}-${deliveryNum}`;

        const result = await query(
            `INSERT INTO deliveries 
             (order_id, delivery_number, driver_id, vehicle_registration, 
              delivery_location, scheduled_delivery_time, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')
             RETURNING *`,
            [order_id, deliveryNumber, driver_id, vehicle_registration,
             orderResult.rows[0].delivery_address, scheduled_delivery_time]
        );

        res.status(201).json({
            success: true,
            message: 'Delivery created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Create delivery error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create delivery'
        });
    }
});

/**
 * GET DELIVERY DETAILS
 * GET /api/deliveries/:id
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT d.*, u.full_name as driver_name, u.phone as driver_phone
             FROM deliveries d
             LEFT JOIN users u ON d.driver_id = u.id
             WHERE d.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        const delivery = result.rows[0];

        // Get GPS tracking history
        const trackingResult = await query(
            `SELECT latitude, longitude, accuracy, speed, heading, timestamp
             FROM delivery_tracking_history
             WHERE delivery_id = $1
             ORDER BY timestamp DESC
             LIMIT 100`,
            [id]
        );

        delivery.tracking_history = trackingResult.rows;

        res.json({
            success: true,
            data: delivery
        });
    } catch (error) {
        console.error('Get delivery error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch delivery'
        });
    }
});

/**
 * UPDATE GPS LOCATION (Real-time)
 * POST /api/deliveries/:id/location
 */
router.post('/:id/location', verifyToken, checkRole('delivery', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { latitude, longitude, accuracy, speed, heading, altitude } = req.body;

        // Validate coordinates
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        // Update delivery location
        await query(
            `UPDATE deliveries 
             SET gps_latitude = $1, gps_longitude = $2, updated_at = NOW()
             WHERE id = $3`,
            [latitude, longitude, id]
        );

        // Store tracking history
        const trackingResult = await query(
            `INSERT INTO delivery_tracking_history 
             (delivery_id, latitude, longitude, accuracy, speed, heading, altitude)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [id, latitude, longitude, accuracy, speed, heading, altitude]
        );

        // Emit real-time update via Socket.io
        if (global.io) {
            global.io.emit('delivery:location_updated', {
                delivery_id: id,
                latitude,
                longitude,
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            message: 'Location updated successfully',
            data: trackingResult.rows[0]
        });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update location'
        });
    }
});

/**
 * UPDATE DELIVERY STATUS
 * PUT /api/deliveries/:id/status
 */
router.put('/:id/status', verifyToken, checkRole('delivery', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const validStatuses = ['pending', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const updateQuery = status === 'delivered'
            ? `UPDATE deliveries 
               SET status = $1, actual_delivery_time = NOW(), notes = $2, updated_at = NOW()
               WHERE id = $3
               RETURNING *`
            : `UPDATE deliveries 
               SET status = $1, notes = $2, updated_at = NOW()
               WHERE id = $3
               RETURNING *`;

        const result = await query(updateQuery, [status, notes || null, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        // Emit real-time update
        if (global.io) {
            global.io.emit('delivery:status_changed', {
                delivery_id: id,
                status,
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            message: 'Delivery status updated',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update delivery status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update delivery status'
        });
    }
});

/**
 * SUBMIT DELIVERY PROOF
 * POST /api/deliveries/:id/proof
 */
router.post('/:id/proof', verifyToken, checkRole('delivery', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { signature_image_url, proof_url, notes } = req.body;

        const result = await query(
            `UPDATE deliveries 
             SET signature_image_url = $1, delivery_proof_url = $2, notes = $3, 
                 status = 'delivered', actual_delivery_time = NOW()
             WHERE id = $4
             RETURNING *`,
            [signature_image_url, proof_url, notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        // Update order status
        await query(
            `UPDATE orders SET status = 'delivered' 
             WHERE id = (SELECT order_id FROM deliveries WHERE id = $1)`,
            [id]
        );

        res.json({
            success: true,
            message: 'Delivery proof submitted',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Submit delivery proof error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit delivery proof'
        });
    }
});

/**
 * GET DELIVERIES FOR DRIVER
 * GET /api/deliveries/driver/assignments
 */
router.get('/driver/assignments', verifyToken, checkRole('delivery'), async (req, res) => {
    try {
        const result = await query(
            `SELECT d.id, d.delivery_number, d.status, d.scheduled_delivery_time,
                    o.order_number, o.delivery_address
             FROM deliveries d
             JOIN orders o ON d.order_id = o.id
             WHERE d.driver_id = $1
             ORDER BY d.scheduled_delivery_time ASC`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get driver assignments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assignments'
        });
    }
});

/**
 * GET DELIVERY STATISTICS
 * GET /api/deliveries/stats/summary
 */
router.get('/stats/summary', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                COUNT(*) as total_deliveries,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                AVG(EXTRACT(EPOCH FROM (actual_delivery_time - scheduled_delivery_time)) / 3600)::INTEGER as avg_delay_hours
             FROM deliveries
             WHERE DATE(created_at) = CURRENT_DATE`
        );

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get delivery stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch delivery statistics'
        });
    }
});

module.exports = router;
