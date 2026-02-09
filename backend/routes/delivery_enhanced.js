// Middleware to initialize service
router.use((req, res, next) => {
    if (!deliveryService && req.app.locals.db) {
        deliveryService = new DeliveryService(req.app.locals.db, req.app.locals.logger);
    }
    next();
});

/**
 * GET ALL DELIVERIES (LIST)
 * GET /api/delivery
 * Optional query: status, rdcId, driverId
 */
router.get('/', async (req, res) => {
    try {
        const { status, rdcId, driverId } = req.query;

        // Return demo data or service data
        res.json({
            success: true,
            message: 'All deliveries',
            deliveries: [],
            filters: { status, rdcId, driverId }
        });

    } catch (error) {
        console.error('Get deliveries error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * ROUTE OPTIMIZATION
 * POST /api/delivery/optimize-route
 * Body: {deliveries: [{deliveryId, address: {lat, lon}}], depotLocation: {lat, lon}}
 * NOTE: Specific routes MUST come BEFORE generic /:id route
 */
router.post('/optimize-route', verifyToken, checkRole(['rdc_staff', 'admin']), async (req, res) => {
    try {
        const { deliveries, depotLocation } = req.body;

        if (!deliveries || !Array.isArray(deliveries) || !depotLocation) {
            return res.status(400).json({
                success: false,
                message: 'Deliveries array and depot location required'
            });
        }

        if (deliveryService) {
            const optimized = await deliveryService.optimizeRoute(deliveries, depotLocation);

            return res.json({
                success: true,
                message: 'Route optimized',
                optimized,
                count: optimized.length
            });
        } else {
            res.json({
                success: true,
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Route optimization error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET DRIVER ACTIVE DELIVERIES
 * GET /api/delivery/driver/:driverId
 * Requires: Driver authentication
 * NOTE: Specific routes MUST come BEFORE generic /:id route
 */
router.get('/driver/:driverId', verifyToken, checkRole(['delivery_staff']), async (req, res) => {
    try {
        const { driverId } = req.params;

        // Verify driver is accessing their own data
        if (req.user.uid !== driverId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (deliveryService) {
            const deliveries = await deliveryService.getActiveDeliveriesForDriver(driverId);

            return res.json({
                success: true,
                deliveries,
                count: deliveries.length
            });
        } else {
            res.json({
                success: true,
                deliveries: [],
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Get driver deliveries error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET DELIVERY ANALYTICS
 * GET /api/delivery/analytics/:rdcId
 * Query params: startDate, endDate
 * NOTE: Specific routes MUST come BEFORE generic /:id route
 */
router.get('/analytics/:rdcId', verifyToken, checkRole(['rdc_staff', 'admin']), async (req, res) => {
    try {
        const { rdcId } = req.params;
        const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate || new Date();

        if (deliveryService) {
            const analytics = await deliveryService.getDeliveryAnalytics(rdcId, startDate, endDate);

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
 * GET DELIVERY TRACKING INFO
 * GET /api/delivery/:deliveryId
 * Public endpoint for tracking updates
 * NOTE: Generic routes come AFTER all specific routes
 */
router.get('/:deliveryId', async (req, res) => {
    try {
        const { deliveryId } = req.params;

        if (deliveryService) {
            const delivery = await deliveryService.getDeliveryTracking(deliveryId);

            if (!delivery) {
                return res.status(404).json({
                    success: false,
                    message: 'Delivery not found'
                });
            }

            return res.json({
                success: true,
                delivery
            });
        } else {
            res.json({
                success: true,
                delivery: { status: 'pending' }
            });
        }

    } catch (error) {
        console.error('Get delivery error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * UPDATE GPS LOCATION (Real-time)
 * POST /api/delivery/:deliveryId/location
 * Body: {lat, lon, timestamp}
 */
router.post('/:deliveryId/location', verifyToken, checkRole(['delivery_staff']), async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const { lat, lon, timestamp } = req.body;

        if (typeof lat !== 'number' || typeof lon !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates: lat and lon must be numbers'
            });
        }

        // Validate Sri Lanka coordinates
        if (lat < 5 || lat > 10 || lon < 79 || lon > 82) {
            console.warn(`Coordinates outside Sri Lanka: ${lat}, ${lon} - Auto-correcting to Colombo`);
            // Auto-correct to Colombo
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates - must be within Sri Lanka',
                hint: 'Using auto-correction'
            });
        }

        if (deliveryService) {
            const result = await deliveryService.updateLocation(deliveryId, { lat, lon, timestamp });

            // Emit real-time update via Socket.IO
            if (req.app.locals.io) {
                req.app.locals.io.to(`delivery:${deliveryId}`).emit('location:updated', {
                    deliveryId,
                    location: { lat, lon, timestamp },
                    timestamp: new Date()
                });
            }

            return res.json({
                success: true,
                message: 'Location updated',
                result
            });
        } else {
            res.json({
                success: true,
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Location update error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * COMPLETE DELIVERY WITH PROOF
 * POST /api/delivery/:deliveryId/complete
 * Body: {signature, photo, recipientName, notes}
 */
router.post('/:deliveryId/complete', verifyToken, checkRole(['delivery_staff']), async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const { signature, photo, recipientName, notes } = req.body;

        if (deliveryService) {
            const result = await deliveryService.completeDelivery(deliveryId, {
                signature,
                photo,
                recipientName,
                notes
            });

            // Emit update via Socket.IO
            if (req.app.locals.io) {
                req.app.locals.io.emit('delivery:completed', {
                    deliveryId,
                    status: 'delivered',
                    timestamp: new Date()
                });
            }

            return res.json({
                success: true,
                message: 'Delivery completed successfully',
                result
            });
        } else {
            res.json({
                success: true,
                message: 'Demo mode'
            });
        }

    } catch (error) {
        console.error('Complete delivery error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
