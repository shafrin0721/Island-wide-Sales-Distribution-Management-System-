// =====================================================
// DASHBOARD API - Analytics, Metrics & Real-time Reporting
// For Admin, RDC Staff, and Management
// =====================================================

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * GET ADMIN DASHBOARD - System-wide Overview
 * GET /api/dashboard/admin
 * Requires: Admin role
 */
router.get('/admin', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        if (req.app.locals.db) {
            const db = req.app.locals.db;
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Get key metrics
            const ordersSnapshot = await db.collection('orders')
                .where('createdAt', '>=', startOfMonth)
                .get();

            const deliveriesSnapshot = await db.collection('deliveries')
                .where('createdAt', '>=', startOfMonth)
                .get();

            const usersSnapshot = await db.collection('users').get();

            let totalOrders = 0;
            let totalRevenue = 0;
            let completedOrders = 0;

            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                totalOrders++;
                totalRevenue += order.total || 0;
                if (order.status === 'delivered') completedOrders++;
            });

            let completedDeliveries = 0;
            deliveriesSnapshot.forEach(doc => {
                if (doc.data().status === 'delivered') completedDeliveries++;
            });

            const usersByRole = {};
            usersSnapshot.forEach(doc => {
                const role = doc.data().role || 'customer';
                usersByRole[role] = (usersByRole[role] || 0) + 1;
            });

            return res.json({
                success: true,
                dashboard: {
                    summary: {
                        totalOrders,
                        totalRevenue: Number(totalRevenue.toFixed(2)),
                        completedOrders,
                        completionRate: totalOrders > 0 ? Number(((completedOrders / totalOrders) * 100).toFixed(2)) : 0,
                        completedDeliveries,
                        deliveryRate: deliveriesSnapshot.size > 0 ? Number(((completedDeliveries / deliveriesSnapshot.size) * 100).toFixed(2)) : 0
                    },
                    users: {
                        total: usersSnapshot.size,
                        byRole: usersByRole
                    },
                    period: 'Monthly (Current Month)',
                    generatedAt: new Date()
                }
            });
        } else {
            res.json({
                success: true,
                dashboard: {
                    summary: {
                        totalOrders: 0,
                        totalRevenue: 0,
                        completedOrders: 0
                    },
                    message: 'Demo mode'
                }
            });
        }

    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET RDC DASHBOARD
 * GET /api/dashboard/rdc/:rdcId
 * Requires: RDC staff or admin
 */
router.get('/rdc/:rdcId', verifyToken, checkRole(['rdc_staff', 'admin']), async (req, res) => {
    try {
        const { rdcId } = req.params;

        if (req.app.locals.db) {
            const db = req.app.locals.db;
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // Get today's orders
            const ordersSnapshot = await db.collection('orders')
                .where('rdcId', '==', rdcId)
                .where('createdAt', '>=', startOfDay)
                .get();

            const deliveriesSnapshot = await db.collection('deliveries')
                .where('createdAt', '>=', startOfDay)
                .get();

            const inventorySnapshot = await db.collection('inventory')
                .where('rdcId', '==', rdcId)
                .get();

            let todayOrders = 0;
            let pendingOrders = 0;
            let readyToShip = 0;
            let todayRevenue = 0;

            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                todayOrders++;
                todayRevenue += order.total || 0;
                if (order.status === 'pending') pendingOrders++;
                if (order.status === 'packed') readyToShip++;
            });

            let todayDeliveries = 0;
            let completedDeliveries = 0;
            let activeDeliveries = 0;

            deliveriesSnapshot.forEach(doc => {
                const delivery = doc.data();
                todayDeliveries++;
                if (delivery.status === 'delivered') completedDeliveries++;
                if (['in_transit', 'assigned', 'picked_up'].includes(delivery.status)) activeDeliveries++;
            });

            let lowStockCount = 0;
            const outOfStock = [];

            inventorySnapshot.forEach(doc => {
                const item = doc.data();
                if (item.available < 50) lowStockCount++;
                if (item.available === 0) outOfStock.push(item.productId);
            });

            return res.json({
                success: true,
                dashboard: {
                    rdcId,
                    summary: {
                        todayOrders,
                        pendingOrders,
                        readyToShip,
                        todayRevenue: Number(todayRevenue.toFixed(2)),
                        activeDeliveries,
                        completedDeliveries,
                        completionRate: todayDeliveries > 0 ? Number(((completedDeliveries / todayDeliveries) * 100).toFixed(2)) : 0
                    },
                    inventory: {
                        totalItems: inventorySnapshot.size,
                        lowStockItems: lowStockCount,
                        outOfStock: outOfStock.length,
                        outOfStockProducts: outOfStock
                    },
                    period: 'Today',
                    generatedAt: new Date()
                }
            });
        } else {
            res.json({
                success: true,
                dashboard: {
                    rdcId,
                    message: 'Demo mode'
                }
            });
        }

    } catch (error) {
        console.error('RDC dashboard error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET PERFORMANCE METRICS
 * GET /api/dashboard/metrics/:rdcId
 * Query params: period (daily, weekly, monthly)
 */
router.get('/metrics/:rdcId', verifyToken, checkRole(['rdc_staff', 'admin']), async (req, res) => {
    try {
        const { rdcId } = req.params;
        const period = req.query.period || 'daily';
        const days = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 1;

        if (req.app.locals.db) {
            const db = req.app.locals.db;
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

            const ordersSnapshot = await db.collection('orders')
                .where('rdcId', '==', rdcId)
                .where('createdAt', '>=', startDate)
                .get();

            const deliveriesSnapshot = await db.collection('deliveries')
                .where('createdAt', '>=', startDate)
                .get();

            const metrics = {
                period: `${days} day(s)`,
                orders: {
                    total: 0,
                    completed: 0,
                    pending: 0,
                    cancelled: 0,
                    average_value: 0
                },
                delivery: {
                    total: 0,
                    completed: 0,
                    success_rate: 0,
                    average_time_minutes: 0
                }
            };

            let totalRevenue = 0;
            const statuses = {};

            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                metrics.orders.total++;
                totalRevenue += order.total || 0;
                const status = order.status || 'unknown';
                statuses[status] = (statuses[status] || 0) + 1;
                if (status === 'completed' || status === 'delivered') metrics.orders.completed++;
                if (status === 'pending') metrics.orders.pending++;
                if (status === 'cancelled') metrics.orders.cancelled++;
            });

            metrics.orders.average_value = metrics.orders.total > 0 
                ? Number((totalRevenue / metrics.orders.total).toFixed(2))
                : 0;

            let totalDeliveryTime = 0;
            deliveriesSnapshot.forEach(doc => {
                const delivery = doc.data();
                metrics.delivery.total++;
                if (delivery.status === 'delivered') {
                    metrics.delivery.completed++;
                    if (delivery.actualDeliveryTime && delivery.createdAt) {
                        const time = (new Date(delivery.actualDeliveryTime) - new Date(delivery.createdAt)) / 60000;
                        totalDeliveryTime += time;
                    }
                }
            });

            metrics.delivery.success_rate = metrics.delivery.total > 0
                ? Number(((metrics.delivery.completed / metrics.delivery.total) * 100).toFixed(2))
                : 0;

            metrics.delivery.average_time_minutes = metrics.delivery.completed > 0
                ? Number((totalDeliveryTime / metrics.delivery.completed).toFixed(2))
                : 0;

            return res.json({
                success: true,
                metrics
            });
        } else {
            res.json({
                success: true,
                metrics: {},
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Metrics error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET DELIVERY HEATMAP DATA
 * GET /api/dashboard/heatmap/:rdcId
 * For mapping delivery locations
 */
router.get('/heatmap/:rdcId', verifyToken, checkRole(['rdc_staff', 'admin']), async (req, res) => {
    try {
        const { rdcId } = req.params;
        const days = parseInt(req.query.days) || 7;

        if (req.app.locals.db) {
            const db = req.app.locals.db;
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

            const deliveriesSnapshot = await db.collection('deliveries')
                .where('createdAt', '>=', startDate)
                .get();

            const heatmapData = [];
            const ordersSnapshot = await db.collection('orders')
                .where('rdcId', '==', rdcId)
                .where('createdAt', '>=', startDate)
                .get();

            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                if (order.deliveryAddress && order.deliveryAddress.lat && order.deliveryAddress.lon) {
                    heatmapData.push({
                        lat: order.deliveryAddress.lat,
                        lon: order.deliveryAddress.lon,
                        weight: 1,
                        address: order.deliveryAddress.address,
                        status: order.status
                    });
                }
            });

            return res.json({
                success: true,
                heatmap: {
                    data: heatmapData,
                    count: heatmapData.length,
                    bounds: {
                        north: 10,
                        south: 5,
                        east: 82,
                        west: 79
                    }
                }
            });
        } else {
            res.json({
                success: true,
                heatmap: { data: [] }
            });
        }

    } catch (error) {
        console.error('Heatmap error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
