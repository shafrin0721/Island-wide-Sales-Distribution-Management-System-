// =====================================================
// ORDERS ROUTES
// Order Management and Tracking
// =====================================================

const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * CREATE NEW ORDER
 * POST /api/orders
 */
router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            items, delivery_address, delivery_city, delivery_country,
            delivery_postal_code, special_instructions, notes
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must contain at least one item'
            });
        }

        const result = await transaction(async (client) => {
            // Generate order number
            const orderNumResult = await client.query(
                "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE"
            );
            const orderNum = String(orderNumResult.rows[0].count + 1).padStart(6, '0');
            const orderNumber = `ORD-${new Date().getFullYear()}-${orderNum}`;

            let subtotal = 0;
            let taxAmount = 0;

            // Calculate totals and validate items
            for (const item of items) {
                const productResult = await client.query(
                    'SELECT price, stock_level FROM products WHERE id = $1',
                    [item.product_id]
                );

                if (productResult.rows.length === 0) {
                    throw new Error(`Product ${item.product_id} not found`);
                }

                const product = productResult.rows[0];
                if (product.stock_level < item.quantity) {
                    throw new Error(`Insufficient stock for product ${item.product_id}`);
                }

                subtotal += product.price * item.quantity;
            }

            // Calculate tax (10%)
            taxAmount = subtotal * 0.10;
            const totalAmount = subtotal + taxAmount;

            // Create order
            const orderResult = await client.query(
                `INSERT INTO orders 
                 (order_number, customer_id, delivery_address, delivery_city, delivery_country,
                  delivery_postal_code, special_instructions, notes, subtotal, tax_amount, total_amount, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
                 RETURNING id, order_number, total_amount, created_at`,
                [orderNumber, req.user.id, delivery_address, delivery_city, delivery_country,
                 delivery_postal_code, special_instructions, notes, subtotal, taxAmount, totalAmount]
            );

            const orderId = orderResult.rows[0].id;

            // Add order items
            for (const item of items) {
                const productResult = await client.query(
                    'SELECT price FROM products WHERE id = $1',
                    [item.product_id]
                );

                const unitPrice = productResult.rows[0].price;
                const lineTotal = unitPrice * item.quantity;

                await client.query(
                    `INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [orderId, item.product_id, item.quantity, unitPrice, lineTotal]
                );

                // Reserve inventory
                await client.query(
                    `UPDATE inventory SET reserved_quantity = reserved_quantity + $1
                     WHERE product_id = $2`,
                    [item.quantity, item.product_id]
                );
            }

            return orderResult.rows[0];
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: result
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create order'
        });
    }
});

/**
 * GET USER ORDERS
 * GET /api/orders (customer) or GET /api/orders?customer_id=X (admin)
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        let query_text = `
            SELECT o.id, o.order_number, o.total_amount, o.status, 
                   o.created_at, COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE 1=1
        `;
        let params = [];

        // If admin, can filter by customer_id, otherwise only show own orders
        if (req.user.role === 'admin' && req.query.customer_id) {
            query_text += ' AND o.customer_id = $1';
            params.push(req.query.customer_id);
        } else {
            query_text += ' AND o.customer_id = $1';
            params.push(req.user.id);
        }

        query_text += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(limit, offset);

        const result = await query(query_text, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page,
                limit,
                total: result.rowCount
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
});

/**
 * GET ORDER DETAILS
 * GET /api/orders/:id
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get order
        const orderResult = await query(
            `SELECT * FROM orders WHERE id = $1`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const order = orderResult.rows[0];

        // Check authorization
        if (req.user.role !== 'admin' && order.customer_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Get order items
        const itemsResult = await query(
            `SELECT oi.id, oi.product_id, p.name, p.image_url,
                    oi.quantity, oi.unit_price, oi.line_total, oi.fulfillment_status
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = $1`,
            [id]
        );

        // Get delivery info
        const deliveryResult = await query(
            `SELECT * FROM deliveries WHERE order_id = $1`,
            [id]
        );

        // Get payment info
        const paymentResult = await query(
            `SELECT * FROM payments WHERE order_id = $1`,
            [id]
        );

        order.items = itemsResult.rows;
        order.delivery = deliveryResult.rows[0] || null;
        order.payment = paymentResult.rows[0] || null;

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order'
        });
    }
});

/**
 * UPDATE ORDER STATUS
 * PUT /api/orders/:id/status
 */
router.put('/:id/status', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const result = await query(
            `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Order status updated',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status'
        });
    }
});

/**
 * CANCEL ORDER
 * POST /api/orders/:id/cancel
 */
router.post('/:id/cancel', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const orderResult = await query(
            'SELECT * FROM orders WHERE id = $1',
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const order = orderResult.rows[0];

        // Check authorization
        if (req.user.role !== 'admin' && order.customer_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Check if can cancel
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel order in current status'
            });
        }

        const result = await query(
            `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id]
        );

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order'
        });
    }
});

module.exports = router;
