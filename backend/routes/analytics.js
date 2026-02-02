// =====================================================
// ANALYTICS ROUTES
// Advanced Analytics & Business Intelligence
// =====================================================

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * SALES ANALYTICS
 * GET /api/analytics/sales?period=daily|weekly|monthly&start_date=&end_date=
 */
router.get('/sales/overview', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const period = req.query.period || 'monthly';
        const startDate = req.query.start_date || '2024-01-01';
        const endDate = req.query.end_date || new Date().toISOString().split('T')[0];

        let dateFormat;
        switch (period) {
            case 'daily':
                dateFormat = 'YYYY-MM-DD';
                break;
            case 'weekly':
                dateFormat = 'YYYY-IW';
                break;
            case 'monthly':
                dateFormat = 'YYYY-MM';
                break;
            default:
                dateFormat = 'YYYY-MM';
        }

        const result = await query(
            `SELECT 
                TO_CHAR(DATE(o.created_at), $1) as period,
                COUNT(o.id) as order_count,
                SUM(o.total_amount)::DECIMAL(10,2) as total_sales,
                AVG(o.total_amount)::DECIMAL(10,2) as avg_order_value,
                COUNT(DISTINCT o.customer_id) as unique_customers
             FROM orders o
             WHERE o.created_at BETWEEN $2::DATE AND $3::DATE
             AND o.status != 'cancelled'
             GROUP BY TO_CHAR(DATE(o.created_at), $1)
             ORDER BY period DESC`,
            [dateFormat, startDate, endDate]
        );

        res.json({
            success: true,
            period,
            data: result.rows
        });
    } catch (error) {
        console.error('Get sales analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sales analytics'
        });
    }
});

/**
 * PRODUCT ANALYTICS
 * GET /api/analytics/products/top-sellers
 */
router.get('/products/top-sellers', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const days = parseInt(req.query.days) || 30;

        const result = await query(
            `SELECT 
                p.id,
                p.name,
                p.category,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.line_total)::DECIMAL(10,2) as total_revenue,
                COUNT(DISTINCT oi.order_id) as order_count
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.created_at >= NOW() - INTERVAL '${days} days'
             AND o.status != 'cancelled'
             GROUP BY p.id, p.name, p.category
             ORDER BY total_revenue DESC
             LIMIT $1`,
            [limit]
        );

        res.json({
            success: true,
            period_days: days,
            data: result.rows
        });
    } catch (error) {
        console.error('Get top sellers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top sellers'
        });
    }
});

/**
 * INVENTORY ANALYTICS
 * GET /api/analytics/inventory/stock-levels
 */
router.get('/inventory/stock-levels', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                p.id,
                p.name,
                p.category,
                p.reorder_level,
                SUM(i.stock_level) as total_stock,
                COUNT(DISTINCT i.rdc_location) as rdc_count,
                CASE 
                    WHEN SUM(i.stock_level) <= p.reorder_level THEN 'Low Stock'
                    WHEN SUM(i.stock_level) <= p.reorder_level * 1.5 THEN 'Medium Stock'
                    ELSE 'Adequate Stock'
                END as stock_status
             FROM products p
             LEFT JOIN inventory i ON p.id = i.product_id
             WHERE p.deleted_at IS NULL
             GROUP BY p.id, p.name, p.category, p.reorder_level
             ORDER BY total_stock ASC`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get inventory analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch inventory analytics'
        });
    }
});

/**
 * DELIVERY ANALYTICS
 * GET /api/analytics/deliveries/performance
 */
router.get('/deliveries/performance', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                u.id,
                u.full_name as driver_name,
                COUNT(d.id) as total_deliveries,
                COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as completed,
                COUNT(CASE WHEN d.status = 'failed' THEN 1 END) as failed,
                ROUND(100.0 * COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) / 
                    NULLIF(COUNT(d.id), 0), 2) as success_rate,
                ROUND(AVG(EXTRACT(EPOCH FROM 
                    (d.actual_delivery_time - d.scheduled_delivery_time)) / 3600), 2)::NUMERIC as avg_delay_hours
             FROM deliveries d
             RIGHT JOIN users u ON d.driver_id = u.id
             WHERE u.role = 'delivery'
             GROUP BY u.id, u.full_name
             ORDER BY completed DESC`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get delivery analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch delivery analytics'
        });
    }
});

/**
 * CUSTOMER ANALYTICS
 * GET /api/analytics/customers/segments
 */
router.get('/customers/segments', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                u.id,
                u.full_name,
                u.email,
                COUNT(o.id) as total_orders,
                SUM(o.total_amount)::DECIMAL(10,2) as lifetime_value,
                AVG(o.total_amount)::DECIMAL(10,2) as avg_order_value,
                MAX(o.created_at) as last_order_date,
                CASE 
                    WHEN SUM(o.total_amount) >= 10000 THEN 'VIP'
                    WHEN SUM(o.total_amount) >= 5000 THEN 'Premium'
                    WHEN COUNT(o.id) >= 10 THEN 'Regular'
                    ELSE 'New'
                END as customer_segment
             FROM users u
             LEFT JOIN orders o ON u.id = o.customer_id
             WHERE u.role = 'customer'
             GROUP BY u.id, u.full_name, u.email
             ORDER BY lifetime_value DESC`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get customer analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer analytics'
        });
    }
});

/**
 * CATEGORY PERFORMANCE
 * GET /api/analytics/categories/performance
 */
router.get('/categories/performance', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                p.category,
                COUNT(DISTINCT p.id) as product_count,
                SUM(i.stock_level)::INTEGER as total_stock,
                SUM(oi.quantity) as units_sold,
                SUM(oi.line_total)::DECIMAL(10,2) as revenue,
                ROUND(AVG(p.rating), 2) as avg_rating
             FROM products p
             LEFT JOIN inventory i ON p.id = i.product_id
             LEFT JOIN order_items oi ON p.id = oi.product_id
             WHERE p.deleted_at IS NULL
             GROUP BY p.category
             ORDER BY revenue DESC`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get category performance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category performance'
        });
    }
});

/**
 * DASHBOARD SUMMARY
 * GET /api/analytics/dashboard/summary
 */
router.get('/dashboard/summary', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        // Today's sales
        const todayResult = await query(
            `SELECT 
                COUNT(id) as orders,
                SUM(total_amount)::DECIMAL(10,2) as revenue
             FROM orders
             WHERE DATE(created_at) = CURRENT_DATE`
        );

        // This week's sales
        const weekResult = await query(
            `SELECT 
                COUNT(id) as orders,
                SUM(total_amount)::DECIMAL(10,2) as revenue
             FROM orders
             WHERE created_at >= NOW() - INTERVAL '7 days'`
        );

        // This month's sales
        const monthResult = await query(
            `SELECT 
                COUNT(id) as orders,
                SUM(total_amount)::DECIMAL(10,2) as revenue
             FROM orders
             WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`
        );

        // Pending orders
        const pendingResult = await query(
            `SELECT COUNT(id) as count FROM orders WHERE status = 'pending'`
        );

        // In-transit deliveries
        const inTransitResult = await query(
            `SELECT COUNT(id) as count FROM deliveries WHERE status = 'in_transit'`
        );

        // Low stock products
        const lowStockResult = await query(
            `SELECT COUNT(DISTINCT p.id) as count 
             FROM products p
             LEFT JOIN inventory i ON p.id = i.product_id
             WHERE SUM(i.stock_level) <= p.reorder_level`
        );

        res.json({
            success: true,
            data: {
                today: todayResult.rows[0],
                this_week: weekResult.rows[0],
                this_month: monthResult.rows[0],
                pending_orders: pendingResult.rows[0].count,
                in_transit_deliveries: inTransitResult.rows[0].count,
                low_stock_products: lowStockResult.rows[0].count
            }
        });
    } catch (error) {
        console.error('Get dashboard summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard summary'
        });
    }
});

/**
 * EXPORT ANALYTICS REPORT
 * GET /api/analytics/export?format=csv|json&type=sales|inventory&date_range=
 */
router.get('/export/report', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const format = req.query.format || 'json';
        const type = req.query.type || 'sales';

        let data;

        if (type === 'sales') {
            const result = await query(
                `SELECT o.order_number, o.customer_id, o.total_amount, o.status, o.created_at
                 FROM orders o
                 ORDER BY o.created_at DESC LIMIT 1000`
            );
            data = result.rows;
        } else if (type === 'inventory') {
            const result = await query(
                `SELECT p.name, i.rdc_location, i.stock_level, i.available_quantity
                 FROM inventory i
                 JOIN products p ON i.product_id = p.id
                 ORDER BY p.name, i.rdc_location`
            );
            data = result.rows;
        }

        if (format === 'csv') {
            // Convert to CSV
            const headers = Object.keys(data[0]);
            const csv = [headers.join(','), ...data.map(row => 
                headers.map(h => `"${row[h]}"`).join(',')
            )].join('\n');

            res.header('Content-Type', 'text/csv');
            res.header('Content-Disposition', `attachment; filename="analytics_${type}.csv"`);
            res.send(csv);
        } else {
            res.json({
                success: true,
                type,
                count: data.length,
                data
            });
        }
    } catch (error) {
        console.error('Export analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export analytics'
        });
    }
});

module.exports = router;
