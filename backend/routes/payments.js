// =====================================================
// PAYMENT ROUTES
// Stripe Payment Gateway Integration
// =====================================================

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query, transaction } = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * CREATE PAYMENT INTENT
 * POST /api/payments/create-intent
 */
router.post('/create-intent', verifyToken, async (req, res) => {
    try {
        const { order_id } = req.body;

        // Get order
        const orderResult = await query(
            'SELECT id, total_amount, customer_id FROM orders WHERE id = $1',
            [order_id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const order = orderResult.rows[0];

        // Check authorization
        if (req.user.id !== order.customer_id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.total_amount * 100), // Amount in cents
            currency: 'usd',
            description: `Order ${order_id}`,
            metadata: {
                order_id: order_id,
                customer_id: req.user.id
            }
        });

        // Store payment intent record
        await query(
            `INSERT INTO payments (order_id, amount, payment_method, payment_status, stripe_payment_intent_id)
             VALUES ($1, $2, 'card', 'pending', $3)`,
            [order_id, order.total_amount, paymentIntent.id]
        );

        res.json({
            success: true,
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            amount: order.total_amount
        });
    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create payment intent'
        });
    }
});

/**
 * CONFIRM PAYMENT
 * POST /api/payments/confirm
 */
router.post('/confirm', verifyToken, async (req, res) => {
    try {
        const { payment_intent_id, order_id } = req.body;

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                success: false,
                message: 'Payment not completed'
            });
        }

        // Update payment record
        const result = await query(
            `UPDATE payments 
             SET payment_status = 'completed', 
                 stripe_charge_id = $1,
                 transaction_id = $2,
                 updated_at = NOW()
             WHERE stripe_payment_intent_id = $3
             RETURNING *`,
            [paymentIntent.charges.data[0].id, paymentIntent.id, payment_intent_id]
        );

        // Update order payment status
        await query(
            `UPDATE orders 
             SET payment_status = 'completed', 
                 payment_date = NOW(),
                 payment_method = 'card',
                 status = 'confirmed'
             WHERE id = $1`,
            [order_id]
        );

        res.json({
            success: true,
            message: 'Payment confirmed successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to confirm payment'
        });
    }
});

/**
 * GET PAYMENT STATUS
 * GET /api/payments/:payment_id
 */
router.get('/:payment_id', verifyToken, async (req, res) => {
    try {
        const { payment_id } = req.params;

        const result = await query(
            `SELECT p.* FROM payments p
             JOIN orders o ON p.order_id = o.id
             WHERE p.id = $1 AND o.customer_id = $2`,
            [payment_id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment'
        });
    }
});

/**
 * PROCESS REFUND
 * POST /api/payments/:payment_id/refund
 */
router.post('/:payment_id/refund', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { payment_id } = req.params;
        const { reason } = req.body;

        const paymentResult = await query(
            'SELECT * FROM payments WHERE id = $1',
            [payment_id]
        );

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        const payment = paymentResult.rows[0];

        if (payment.payment_status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Can only refund completed payments'
            });
        }

        // Process refund through Stripe
        const refund = await stripe.refunds.create({
            charge: payment.stripe_charge_id,
            reason: reason || 'requested_by_customer'
        });

        // Update payment record
        await query(
            `UPDATE payments 
             SET payment_status = 'refunded',
                 notes = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [`Refunded: ${reason || 'No reason provided'}`, payment_id]
        );

        // Update order
        await query(
            `UPDATE orders SET status = 'refunded' WHERE id = $1`,
            [payment.order_id]
        );

        res.json({
            success: true,
            message: 'Refund processed successfully',
            refund_id: refund.id
        });
    } catch (error) {
        console.error('Process refund error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process refund'
        });
    }
});

/**
 * WEBHOOK: Handle Stripe Events
 * POST /api/payments/webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        // Handle events
        switch (event.type) {
            case 'payment_intent.succeeded':
                console.log('Payment succeeded:', event.data.object);
                break;

            case 'payment_intent.payment_failed':
                console.log('Payment failed:', event.data.object);
                // Update payment status to failed
                await query(
                    `UPDATE payments SET payment_status = 'failed' 
                     WHERE stripe_payment_intent_id = $1`,
                    [event.data.object.id]
                );
                break;

            case 'charge.refunded':
                console.log('Charge refunded:', event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

/**
 * GET PAYMENT HISTORY
 * GET /api/payments/history?page=1
 */
router.get('/history/list', verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        let query_text = `
            SELECT p.id, p.amount, p.payment_status, p.payment_method, 
                   p.created_at, o.order_number
            FROM payments p
            JOIN orders o ON p.order_id = o.id
            WHERE 1=1
        `;
        let params = [];

        if (req.user.role === 'admin') {
            // Admin sees all payments
        } else {
            // Customer sees only their payments
            query_text += ' AND o.customer_id = $1';
            params.push(req.user.id);
        }

        query_text += ' ORDER BY p.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(limit, offset);

        const result = await query(query_text, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page,
                limit
            }
        });
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment history'
        });
    }
});

module.exports = router;
