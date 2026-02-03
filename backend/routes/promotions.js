// =====================================================
// PROMOTIONS ROUTES
// Discount and Promotional Campaign Management
// =====================================================

const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * GET ALL ACTIVE PROMOTIONS
 * GET /api/promotions
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await query(
            `SELECT id, code, title, description, discount_type, discount_value,
                    minimum_purchase, maximum_discount, start_date, end_date,
                    usage_limit, usage_count, is_active, created_at
             FROM promotions
             WHERE is_active = 1
             AND start_date <= CURRENT_TIMESTAMP
             AND end_date >= CURRENT_TIMESTAMP
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Get promotions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch promotions'
        });
    }
});

/**
 * GET PROMOTION BY ID
 * GET /api/promotions/:id
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT * FROM promotions WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Promotion not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get promotion error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch promotion'
        });
    }
});

/**
 * VALIDATE PROMOTION CODE
 * POST /api/promotions/validate
 */
router.post('/validate', verifyToken, async (req, res) => {
    try {
        const { code, cart_total, customer_id } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Promotion code is required'
            });
        }

        const result = await query(
            `SELECT * FROM promotions 
             WHERE code = $1
             AND is_active = 1
             AND start_date <= CURRENT_TIMESTAMP
             AND end_date >= CURRENT_TIMESTAMP`,
            [code.toUpperCase()]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired promotion code'
            });
        }

        const promotion = result.rows[0];

        // Check usage limit
        if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
            return res.status(400).json({
                success: false,
                message: 'Promotion has reached its usage limit'
            });
        }

        // Check customer usage
        if (customer_id) {
            const customerUsage = await query(
                `SELECT COUNT(*) as count FROM promotion_usage
                 WHERE promotion_id = $1 AND customer_id = $2`,
                [promotion.id, customer_id]
            );

            if (customerUsage.rows[0].count > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already used this promotion'
                });
            }
        }

        // Check minimum purchase
        if (promotion.minimum_purchase && cart_total < promotion.minimum_purchase) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase of ${promotion.minimum_purchase} required`
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (promotion.discount_type === 'percentage') {
            discountAmount = (cart_total * promotion.discount_value) / 100;
        } else if (promotion.discount_type === 'fixed') {
            discountAmount = promotion.discount_value;
        }

        // Apply maximum discount cap if set
        if (promotion.maximum_discount && discountAmount > promotion.maximum_discount) {
            discountAmount = promotion.maximum_discount;
        }

        res.json({
            success: true,
            message: 'Promotion code is valid',
            data: {
                promotionId: promotion.id,
                code: promotion.code,
                title: promotion.title,
                discountType: promotion.discount_type,
                discountValue: promotion.discount_value,
                discountAmount: Math.round(discountAmount * 100) / 100,
                finalTotal: Math.round((cart_total - discountAmount) * 100) / 100
            }
        });
    } catch (error) {
        console.error('Validate promotion error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate promotion code'
        });
    }
});

/**
 * CREATE PROMOTION (Admin only)
 * POST /api/promotions
 */
router.post('/', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const {
            code, title, description, discount_type, discount_value,
            minimum_purchase, maximum_discount, start_date, end_date,
            usage_limit, applicable_categories, applicable_products
        } = req.body;

        if (!code || !title || !discount_type || !discount_value) {
            return res.status(400).json({
                success: false,
                message: 'Code, title, discount type and value are required'
            });
        }

        // Check if code already exists
        const existingCode = await query(
            `SELECT id FROM promotions WHERE code = $1`,
            [code.toUpperCase()]
        );

        if (existingCode.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Promotion code already exists'
            });
        }

        const result = await query(
            `INSERT INTO promotions 
             (code, title, description, discount_type, discount_value,
              minimum_purchase, maximum_discount, start_date, end_date,
              usage_limit, is_active, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, $11)
             RETURNING *`,
            [code.toUpperCase(), title, description, discount_type, discount_value,
             minimum_purchase || null, maximum_discount || null, start_date, end_date,
             usage_limit || null, req.user.id]
        );

        res.status(201).json({
            success: true,
            message: 'Promotion created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Create promotion error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create promotion'
        });
    }
});

/**
 * UPDATE PROMOTION (Admin only)
 * PUT /api/promotions/:id
 */
router.put('/:id', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, description, discount_type, discount_value,
            minimum_purchase, maximum_discount, start_date, end_date,
            usage_limit, is_active
        } = req.body;

        const result = await query(
            `UPDATE promotions
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 discount_type = COALESCE($3, discount_type),
                 discount_value = COALESCE($4, discount_value),
                 minimum_purchase = COALESCE($5, minimum_purchase),
                 maximum_discount = COALESCE($6, maximum_discount),
                 start_date = COALESCE($7, start_date),
                 end_date = COALESCE($8, end_date),
                 usage_limit = COALESCE($9, usage_limit),
                 is_active = COALESCE($10, is_active),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $11
             RETURNING *`,
            [title, description, discount_type, discount_value,
             minimum_purchase, maximum_discount, start_date, end_date,
             usage_limit, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Promotion not found'
            });
        }

        res.json({
            success: true,
            message: 'Promotion updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update promotion error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update promotion'
        });
    }
});

/**
 * DELETE PROMOTION (Admin only)
 * DELETE /api/promotions/:id
 */
router.delete('/:id', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `UPDATE promotions
             SET is_active = 0, deleted_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Promotion not found'
            });
        }

        res.json({
            success: true,
            message: 'Promotion deleted successfully'
        });
    } catch (error) {
        console.error('Delete promotion error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete promotion'
        });
    }
});

/**
 * GET PROMOTION USAGE ANALYTICS
 * GET /api/promotions/:id/analytics
 */
router.get('/:id/analytics', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Get promotion details
        const promotion = await query(
            `SELECT * FROM promotions WHERE id = $1`,
            [id]
        );

        if (promotion.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Promotion not found'
            });
        }

        // Get usage stats
        const stats = await query(
            `SELECT 
                COUNT(DISTINCT pu.customer_id) as unique_customers,
                COUNT(pu.id) as total_uses,
                SUM(CASE WHEN o.status != 'cancelled' THEN 1 ELSE 0 END) as completed_orders,
                AVG(o.total_amount) as avg_order_value,
                SUM(o.total_amount) as total_revenue
             FROM promotion_usage pu
             LEFT JOIN orders o ON pu.order_id = o.id
             WHERE pu.promotion_id = $1`,
            [id]
        );

        res.json({
            success: true,
            data: {
                promotion: promotion.rows[0],
                analytics: stats.rows[0]
            }
        });
    } catch (error) {
        console.error('Get promotion analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch promotion analytics'
        });
    }
});

module.exports = router;
