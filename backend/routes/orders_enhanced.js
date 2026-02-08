// =====================================================
// ENHANCED ORDERS ROUTES - With Service Integration
// Order Management, Tracking, Analytics
// =====================================================

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const OrderService = require('../services/OrderService');
const DeliveryService = require('../services/DeliveryService');
const InventoryService = require('../services/InventoryService');

// Initialize services (will be injected via middleware in production)
let orderService, deliveryService, inventoryService;

// Middleware to initialize services with Firebase connection
router.use((req, res, next) => {
    if (!orderService && req.app.locals.db) {
        orderService = new OrderService(req.app.locals.db, req.app.locals.logger);
        deliveryService = new DeliveryService(req.app.locals.db, req.app.locals.logger);
        inventoryService = new InventoryService(req.app.locals.db, req.app.locals.io, req.app.locals.logger);
    }
    next();
});

/**
 * CREATE NEW ORDER
 * POST /api/orders
 * Requires: customerId, items, deliveryAddress, paymentMethod
 */
router.post('/', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.uid || req.user.id;
        const {
            items, // [{productId, quantity, price}]
            deliveryAddress,
            paymentMethod,
            specialInstructions,
            discountCode
        } = req.body;

        // Validation
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must contain at least one item'
            });
        }

        if (!deliveryAddress || !deliveryAddress.address || !deliveryAddress.city) {
            return res.status(400).json({
                success: false,
                message: 'Valid delivery address required'
            });
        }

        if (!paymentMethod || !['card', 'bank_transfer', 'cash_on_delivery'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Valid payment method required'
            });
        }

        // Validate all products exist and have stock
        if (orderService) {
            for (let item of items) {
                try {
                    // In a production system, check inventory against real database
                    if (!item.productId || !item.quantity || !item.price) {
                        throw new Error(`Invalid item: ${JSON.stringify(item)}`);
                    }
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        message: error.message
                    });
                }
            }

            // Create order
            const order = await orderService.createOrder({
                customerId,
                items,
                deliveryAddress,
                paymentMethod,
                specialInstructions,
                discountCode,
                rdcId: req.body.rdcId || 'RDC-001'
            });

            // Emit real-time update if Socket.IO available
            if (req.app.locals.io) {
                req.app.locals.io.to('rdc:all').emit('order:created', {
                    orderId: order.orderId,
                    customerId,
                    total: order.total,
                    status: 'pending',
                    timestamp: new Date()
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Order created successfully',
                order
            });
        } else {
            // Fallback for demo without Firebase
            const order = {
                orderId: `ORD-${Date.now()}`,
                customerId,
                items,
                deliveryAddress,
                paymentMethod,
                status: 'pending',
                createdAt: new Date()
            };

            res.status(201).json({
                success: true,
                message: 'Order created (demo mode)',
                order
            });
        }

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Order creation failed'
        });
    }
});

/**
 * GET ORDER BY ID
 * GET /api/orders/:orderId
 */
router.get('/:orderId', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;

        if (orderService) {
            const order = await orderService.getOrder(orderId);
            
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Check authorization
            if (order.customerId !== req.user.uid && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            return res.json({
                success: true,
                order
            });
        } else {
            res.status(200).json({
                success: true,
                message: 'Demo mode - order retrieval unavailable'
            });
        }

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET CUSTOMER ORDERS
 * GET /api/orders
 * Query params: limit, offset
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const customerId = req.user.uid || req.user.id;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = parseInt(req.query.offset) || 0;

        if (orderService) {
            const orders = await orderService.getCustomerOrders(customerId, limit, offset);

            return res.json({
                success: true,
                orders,
                count: orders.length,
                limit,
                offset
            });
        } else {
            res.json({
                success: true,
                orders: [],
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET RDC ORDERS (Staff only)
 * GET /api/orders/rdc/:rdcId
 * Query params: status, limit
 */
router.get('/rdc/:rdcId', verifyToken, checkRole(['rdc_staff', 'admin']), async (req, res) => {
    try {
        const { rdcId } = req.params;
        const statuses = (req.query.status || 'pending,confirmed').split(',');
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);

        if (orderService) {
            const orders = await orderService.getRDCOrders(rdcId, statuses, limit);

            return res.json({
                success: true,
                orders,
                count: orders.length
            });
        } else {
            res.json({
                success: true,
                orders: [],
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Get RDC orders error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * UPDATE ORDER STATUS
 * PATCH /api/orders/:orderId/status
 * Requires: newStatus, notes (optional)
 */
router.patch('/:orderId/status', verifyToken, checkRole(['rdc_staff', 'admin']), async (req, res) => {
    try {
        const { orderId } = req.params;
        const { newStatus, notes = '' } = req.body;

        if (!newStatus) {
            return res.status(400).json({
                success: false,
                message: 'New status required'
            });
        }

        if (orderService) {
            const update = await orderService.updateOrderStatus(orderId, newStatus, notes);

            // Emit update via Socket.IO
            if (req.app.locals.io) {
                req.app.locals.io.emit('order:status-updated', {
                    orderId,
                    status: newStatus,
                    timestamp: new Date()
                });
            }

            return res.json({
                success: true,
                message: `Order status updated to ${newStatus}`,
                update
            });
        } else {
            res.json({
                success: true,
                message: 'Demo mode - status update unavailable'
            });
        }

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * CREATE DELIVERY FOR ORDER
 * POST /api/orders/:orderId/delivery
 * Requires: driverId, vehicleId
 */
router.post('/:orderId/delivery', verifyToken, checkRole(['rdc_staff', 'admin']), async (req, res) => {
    try {
        const { orderId } = req.params;
        const { driverId, vehicleId, estimatedMinutes = 30 } = req.body;

        if (!driverId || !vehicleId) {
            return res.status(400).json({
                success: false,
                message: 'Driver ID and Vehicle ID required'
            });
        }

        if (deliveryService) {
            const delivery = await deliveryService.assignDelivery(orderId, {
                driverId,
                vehicleId,
                estimatedMinutes
            });

            // Update order status
            if (orderService) {
                await orderService.updateOrderStatus(orderId, 'dispatched', 'Assigned for delivery');
            }

            return res.status(201).json({
                success: true,
                message: 'Delivery assigned successfully',
                delivery
            });
        } else {
            res.json({
                success: true,
                message: 'Demo mode - delivery creation unavailable'
            });
        }

    } catch (error) {
        console.error('Create delivery error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET ORDER ANALYTICS
 * GET /api/orders/analytics/:rdcId
 * Query params: startDate, endDate
 */
router.get('/analytics/:rdcId', verifyToken, checkRole(['rdc_staff', 'admin']), async (req, res) => {
    try {
        const { rdcId } = req.params;
        const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate || new Date();

        if (orderService) {
            const analytics = await orderService.getOrderAnalytics(rdcId, startDate, endDate);

            return res.json({
                success: true,
                analytics
            });
        } else {
            res.json({
                success: true,
                analytics: {},
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * CANCEL ORDER
 * DELETE /api/orders/:orderId
 */
router.delete('/:orderId', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;

        if (orderService) {
            const order = await orderService.getOrder(orderId);
            
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Check authorization
            if (order.customerId !== req.user.uid && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Can only cancel pending or confirmed orders
            if (!['pending', 'confirmed'].includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot cancel order with status: ${order.status}`
                });
            }

            await orderService.updateOrderStatus(orderId, 'cancelled', 'Cancelled by customer');

            return res.json({
                success: true,
                message: 'Order cancelled successfully'
            });
        } else {
            res.json({
                success: true,
                message: 'Demo mode - cancellation unavailable'
            });
        }

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
