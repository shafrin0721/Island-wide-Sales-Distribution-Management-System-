// =====================================================
// ENHANCED INVENTORY ROUTES - Real-time Stock Management
// =====================================================

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const InventoryService = require('../services/InventoryService');

let inventoryService;

// Middleware to initialize service
router.use((req, res, next) => {
    if (!inventoryService && req.app.locals.db) {
        inventoryService = new InventoryService(req.app.locals.db, req.app.locals.io, req.app.locals.logger);
    }
    next();
});

/**
 * GET RDC INVENTORY
 * GET /api/inventory/rdc/:rdcId
 */
router.get('/rdc/:rdcId', verifyToken, checkRole(['rdc_staff', 'admin']), async (req, res) => {
    try {
        const { rdcId } = req.params;

        if (inventoryService) {
            const inventory = await inventoryService.getRDCInventory(rdcId);

            return res.json({
                success: true,
                inventory,
                count: inventory.length
            });
        } else {
            res.json({
                success: true,
                inventory: [],
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Get RDC inventory error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET PRODUCT INVENTORY (All RDCs)
 * GET /api/inventory/product/:productId
 */
router.get('/product/:productId', verifyToken, async (req, res) => {
    try {
        const { productId } = req.params;

        if (inventoryService) {
            const locations = await inventoryService.getProductInventory(productId);

            return res.json({
                success: true,
                productId,
                locations,
                totalQuantity: locations.reduce((sum, loc) => sum + (loc.quantity || 0), 0)
            });
        } else {
            res.json({
                success: true,
                locations: [],
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Get product inventory error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET STOCK LEVEL
 * GET /api/inventory/stock/:productId/:rdcId
 */
router.get('/stock/:productId/:rdcId', async (req, res) => {
    try {
        const { productId, rdcId } = req.params;

        if (inventoryService) {
            const stock = await inventoryService.getStock(productId, rdcId);

            return res.json({
                success: true,
                stock
            });
        } else {
            res.json({
                success: true,
                stock: { quantity: 0, available: 0 }
            });
        }

    } catch (error) {
        console.error('Get stock error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET LOW STOCK ALERTS
 * GET /api/inventory/alerts/:rdcId
 */
router.get('/alerts/:rdcId', verifyToken, checkRole(['rdc_staff', 'admin']), async (req, res) => {
    try {
        const { rdcId } = req.params;
        const threshold = parseInt(req.query.threshold) || 50;

        if (inventoryService) {
            const alerts = await inventoryService.getLowStockAlerts(rdcId, threshold);

            return res.json({
                success: true,
                alerts,
                count: alerts.length
            });
        } else {
            res.json({
                success: true,
                alerts: [],
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * RESERVE STOCK (After Order Confirmation)
 * POST /api/inventory/reserve
 */
router.post('/reserve', verifyToken, checkRole(['rdc_staff', 'admin']), async (req, res) => {
    try {
        const { productId, rdcId, quantity, orderId } = req.body;

        if (!productId || !rdcId || !quantity || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: productId, rdcId, quantity, orderId'
            });
        }

        if (inventoryService) {
            const stock = await inventoryService.reserveStock(productId, rdcId, quantity, orderId);

            return res.json({
                success: true,
                message: 'Stock reserved',
                stock
            });
        } else {
            res.json({
                success: true,
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Reserve stock error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * FULFILL ORDER (Remove from Stock)
 * POST /api/inventory/fulfill
 */
router.post('/fulfill', verifyToken, checkRole(['rdc_staff', 'admin']), async (req, res) => {
    try {
        const { productId, rdcId, quantity, orderId } = req.body;

        if (!productId || !rdcId || !quantity || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        if (inventoryService) {
            const stock = await inventoryService.fulfillOrder(productId, rdcId, quantity, orderId);

            return res.json({
                success: true,
                message: 'Order fulfilled',
                stock
            });
        } else {
            res.json({
                success: true,
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Fulfill order error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * TRANSFER STOCK BETWEEN RDCs
 * POST /api/inventory/transfer
 */
router.post('/transfer', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { productId, fromRdc, toRdc, quantity } = req.body;

        if (!productId || !fromRdc || !toRdc || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        if (inventoryService) {
            const result = await inventoryService.transferStock(productId, fromRdc, toRdc, quantity);

            return res.json({
                success: true,
                message: `Transferred ${quantity} units from ${fromRdc} to ${toRdc}`,
                result
            });
        } else {
            res.json({
                success: true,
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Transfer stock error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * SYNC INVENTORY
 * POST /api/inventory/sync/:rdcId
 */
router.post('/sync/:rdcId', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { rdcId } = req.params;
        const { items } = req.body; // Array of {productId, quantity, unitPrice, reorderLevel}

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: 'Items array required'
            });
        }

        if (inventoryService) {
            const updates = await inventoryService.syncInventory(rdcId, items);

            return res.json({
                success: true,
                message: `Synced ${updates.length} items for ${rdcId}`,
                updates
            });
        } else {
            res.json({
                success: true,
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Sync inventory error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET INVENTORY ANALYTICS
 * GET /api/inventory/analytics/:rdcId
 */
router.get('/analytics/:rdcId', verifyToken, checkRole(['rdc_staff', 'admin']), async (req, res) => {
    try {
        const { rdcId } = req.params;

        if (inventoryService) {
            const analytics = await inventoryService.getInventoryAnalytics(rdcId);

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

module.exports = router;
