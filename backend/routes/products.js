// =====================================================
// PRODUCTS ROUTES
// Product Catalog Management and Inventory
// =====================================================

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * GET ALL PRODUCTS (with pagination and filtering)
 * GET /api/products?page=1&limit=20&category=electronics&search=phone
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const category = req.query.category;
        const search = req.query.search;
        const sortBy = req.query.sortBy || 'created_at';
        const order = req.query.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        let whereConditions = ['is_active = true', 'deleted_at IS NULL'];
        let params = [];
        let paramIndex = 1;

        if (category) {
            whereConditions.push(`category = $${paramIndex}`);
            params.push(category);
            paramIndex++;
        }

        if (search) {
            whereConditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) as total FROM products WHERE ${whereClause}`,
            params
        );

        const total = parseInt(countResult.rows[0].total);

        // Get paginated results
        const result = await query(
            `SELECT id, name, price, category, stock_level, image_url, rating, rating_count
             FROM products
             WHERE ${whereClause}
             ORDER BY ${sortBy} ${order}
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
});

/**
 * GET SINGLE PRODUCT
 * GET /api/products/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT p.*, c.name as category_name
             FROM products p
             LEFT JOIN categories c ON p.category = c.name
             WHERE p.id = $1 AND p.deleted_at IS NULL`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Get inventory by location
        const inventoryResult = await query(
            'SELECT rdc_location, stock_level, available_quantity FROM inventory WHERE product_id = $1',
            [id]
        );

        const product = result.rows[0];
        product.inventory_by_location = inventoryResult.rows;

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product'
        });
    }
});

/**
 * CREATE PRODUCT (Admin only)
 * POST /api/products
 */
router.post('/', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const {
            name, description, category, price, cost_price, sku,
            stock_level, reorder_level, image_url, weight_kg
        } = req.body;

        // Validation
        if (!name || !category || !price || !sku) {
            return res.status(400).json({
                success: false,
                message: 'Name, category, price, and SKU are required'
            });
        }

        // Check if SKU exists
        const existingProduct = await query(
            'SELECT id FROM products WHERE sku = $1',
            [sku]
        );

        if (existingProduct.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'SKU already exists'
            });
        }

        // Create product
        const result = await query(
            `INSERT INTO products 
             (name, description, category, price, cost_price, sku, stock_level, 
              reorder_level, image_url, weight_kg, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING id, name, price, category, stock_level, created_at`,
            [name, description, category, price, cost_price, sku, stock_level || 0,
             reorder_level || 10, image_url, weight_kg, req.user.id]
        );

        const product = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product'
        });
    }
});

/**
 * UPDATE PRODUCT (Admin only)
 * PUT /api/products/:id
 */
router.put('/:id', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Build update query dynamically
        const allowedFields = ['name', 'description', 'category', 'price', 'cost_price',
                             'stock_level', 'reorder_level', 'image_url', 'is_featured'];
        const setClause = [];
        const params = [];
        let paramIndex = 1;

        for (const field of allowedFields) {
            if (field in updates) {
                setClause.push(`${field} = $${paramIndex}`);
                params.push(updates[field]);
                paramIndex++;
            }
        }

        if (setClause.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        setClause.push(`updated_at = NOW()`);
        params.push(id);

        const result = await query(
            `UPDATE products SET ${setClause.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product'
        });
    }
});

/**
 * DELETE PRODUCT (Soft delete)
 * DELETE /api/products/:id
 */
router.delete('/:id', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'UPDATE products SET deleted_at = NOW() WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product'
        });
    }
});

/**
 * GET PRODUCT RECOMMENDATIONS
 * GET /api/products/:id/recommendations
 */
router.get('/:id/recommendations', async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 5;

        const result = await query(
            `SELECT DISTINCT p.id, p.name, p.price, p.image_url, p.category
             FROM products p
             WHERE p.category = (SELECT category FROM products WHERE id = $1)
             AND p.id != $1
             AND p.is_active = true
             AND p.deleted_at IS NULL
             LIMIT $2`,
            [id, limit]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recommendations'
        });
    }
});

/**
 * GET CATEGORIES
 * GET /api/products/categories/list
 */
router.get('/categories/list', async (req, res) => {
    try {
        const result = await query(
            `SELECT DISTINCT category FROM products 
             WHERE deleted_at IS NULL AND is_active = true
             ORDER BY category`
        );

        const categories = result.rows.map(row => row.category);

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
});

module.exports = router;
