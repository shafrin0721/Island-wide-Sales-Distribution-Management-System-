// =====================================================
// DELIVERY SERVICE - Delivery Tracking & Assignment
// Handles route optimization, GPS tracking, and assignment
// =====================================================

const { v4: uuidv4 } = require('uuid');

class DeliveryService {
    constructor(db, logger) {
        this.db = db;
        this.logger = logger || console;
        this.deliveryVehicles = new Map();
    }

    /**
     * Assign delivery to driver
     */
    async assignDelivery(orderId, deliveryData) {
        try {
            const {
                driverId,
                vehicleId,
                routeId,
                estimatedMinutes = 30
            } = deliveryData;

            const delivery = {
                deliveryId: `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                orderId,
                driverId,
                vehicleId,
                routeId,
                status: 'assigned', // assigned, picked_up, in_transit, delivered, cancelled
                estimatedMinutes,
                estimatedDeliveryTime: new Date(Date.now() + estimatedMinutes * 60000),
                actualDeliveryTime: null,
                
                // GPS Tracking
                currentLocation: null, // {lat, lon, timestamp}
                route: [], // [{lat, lon, timestamp}]
                
                // Driver info
                driver: null, // Will be populated from users collection
                vehicle: null, // Will be populated from vehicles collection
                
                // Status tracking
                createdAt: new Date(),
                updatedAt: new Date(),
                timeline: [
                    {
                        status: 'assigned',
                        timestamp: new Date(),
                        location: null,
                        note: 'Delivery assigned to driver'
                    }
                ]
            };

            if (this.db) {
                // Get driver and vehicle info
                const driverDoc = await this.db.collection('users').doc(driverId).get();
                if (driverDoc.exists) {
                    const driverData = driverDoc.data();
                    delivery.driver = {
                        id: driverId,
                        name: driverData.displayName || driverData.full_name,
                        phone: driverData.phone,
                        email: driverData.email
                    };
                }

                const vehicleDoc = await this.db.collection('vehicles').doc(vehicleId).get();
                if (vehicleDoc.exists) {
                    const vehicleData = vehicleDoc.data();
                    delivery.vehicle = {
                        id: vehicleId,
                        registration: vehicleData.registration,
                        model: vehicleData.model,
                        type: vehicleData.type
                    };
                }

                await this.db.collection('deliveries').doc(delivery.deliveryId).set(delivery);
            }

            this.logger.info(`Delivery assigned: ${delivery.deliveryId} to driver ${driverId}`);
            return delivery;

        } catch (error) {
            this.logger.error('Delivery assignment failed:', error);
            throw error;
        }
    }

    /**
     * Update GPS location and optimize ETA
     */
    async updateLocation(deliveryId, location) {
        try {
            const { lat, lon, timestamp = new Date() } = location;

            // Validate coordinates (Sri Lanka bounds)
            if (lat < 5 || lat > 10 || lon < 79 || lon > 82) {
                this.logger.warn(`Invalid coordinates for delivery ${deliveryId}:`, { lat, lon });
                // Auto-correct to Colombo
                location = { lat: 6.9271, lon: 80.6369, timestamp };
            }

            if (this.db) {
                const ref = this.db.collection('deliveries').doc(deliveryId);
                const delivery = await ref.get();

                if (!delivery.exists) {
                    throw new Error(`Delivery not found: ${deliveryId}`);
                }

                const deliveryData = delivery.data();
                const route = deliveryData.route || [];
                
                route.push({
                    lat: location.lat,
                    lon: location.lon,
                    timestamp: location.timestamp
                });

                // Calculate new ETA based on current location and speed
                const newETA = this.calculateETA(location, deliveryData.estimatedDeliveryTime);

                await ref.update({
                    currentLocation: {
                        lat: location.lat,
                        lon: location.lon,
                        timestamp: location.timestamp
                    },
                    route: route,
                    estimatedDeliveryTime: newETA,
                    updatedAt: new Date()
                });
            }

            this.logger.info(`Location updated for delivery ${deliveryId}`);
            return { success: true, location };

        } catch (error) {
            this.logger.error('Location update failed:', error);
            throw error;
        }
    }

    /**
     * Mark delivery as completed
     */
    async completeDelivery(deliveryId, proofData = {}) {
        try {
            const completionData = {
                status: 'delivered',
                actualDeliveryTime: new Date(),
                proof: {
                    signature: proofData.signature || null,
                    photo: proofData.photo || null,
                    recipientName: proofData.recipientName || 'Customer',
                    notes: proofData.notes || '',
                    timestamp: new Date()
                },
                updatedAt: new Date()
            };

            if (this.db) {
                const ref = this.db.collection('deliveries').doc(deliveryId);
                const delivery = await ref.get();

                if (!delivery.exists) {
                    throw new Error(`Delivery not found: ${deliveryId}`);
                }

                const timeline = delivery.data().timeline || [];
                timeline.push({
                    status: 'delivered',
                    timestamp: new Date(),
                    location: delivery.data().currentLocation,
                    note: 'Delivery completed'
                });

                await ref.update({
                    ...completionData,
                    timeline
                });

                // Update related order status
                const orderId = delivery.data().orderId;
                await this.db.collection('orders').doc(orderId).update({
                    status: 'delivered',
                    deliveryId: deliveryId,
                    updatedAt: new Date()
                });
            }

            this.logger.info(`Delivery completed: ${deliveryId}`);
            return completionData;

        } catch (error) {
            this.logger.error('Delivery completion failed:', error);
            throw error;
        }
    }

    /**
     * Get active deliveries for driver
     */
    async getActiveDeliveriesForDriver(driverId) {
        try {
            const deliveries = [];

            if (this.db) {
                const snapshot = await this.db
                    .collection('deliveries')
                    .where('driverId', '==', driverId)
                    .where('status', 'in', ['assigned', 'picked_up', 'in_transit'])
                    .orderBy('createdAt', 'desc')
                    .get();

                snapshot.forEach(doc => {
                    deliveries.push({ deliveryId: doc.id, ...doc.data() });
                });
            }

            return deliveries;
        } catch (error) {
            this.logger.error('Get active deliveries failed:', error);
            throw error;
        }
    }

    /**
     * Get delivery details with tracking info
     */
    async getDeliveryTracking(deliveryId) {
        try {
            if (this.db) {
                const doc = await this.db.collection('deliveries').doc(deliveryId).get();
                if (doc.exists) {
                    const delivery = doc.data();
                    return {
                        deliveryId,
                        ...delivery,
                        etaMinutes: this.getETAMinutes(delivery.estimatedDeliveryTime)
                    };
                }
            }
            return null;
        } catch (error) {
            this.logger.error('Get delivery tracking failed:', error);
            throw error;
        }
    }

    /**
     * Optimize delivery routes for a set of orders
     */
    async optimizeRoute(deliveries, depotLocation) {
        try {
            // Simple algorithm: Sort by distance from depot
            // In production, use Google Maps API or specialized routing engine

            const optimized = deliveries.map(delivery => {
                const distance = this.calculateDistance(
                    depotLocation.lat,
                    depotLocation.lon,
                    delivery.deliveryAddress.lat,
                    delivery.deliveryAddress.lon
                );
                return { ...delivery, distance };
            });

            optimized.sort((a, b) => a.distance - b.distance);

            return optimized.map((d, index) => ({
                ...d,
                sequence: index + 1
            }));

        } catch (error) {
            this.logger.error('Route optimization failed:', error);
            throw error;
        }
    }

    /**
     * Calculate distance between two coordinates
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Calculate ETA based on current location and destination
     */
    calculateETA(currentLocation, estimatedDeliveryTime) {
        // In production, use Google Maps Distance Matrix API
        // For now, reduce ETA by 5 minutes for each location update
        
        const now = new Date();
        const eta = new Date(estimatedDeliveryTime);
        const minutesUntilETA = (eta - now) / 60000;
        
        if (minutesUntilETA > 5) {
            return new Date(now.getTime() + (minutesUntilETA - 5) * 60000);
        }
        
        return eta;
    }

    /**
     * Get ETA in minutes
     */
    getETAMinutes(eta) {
        const now = new Date();
        const minutes = Math.round((new Date(eta) - now) / 60000);
        return Math.max(0, minutes);
    }

    /**
     * Get delivery analytics
     */
    async getDeliveryAnalytics(rdcId, startDate, endDate) {
        try {
            const analytics = {
                totalDeliveries: 0,
                completedDeliveries: 0,
                averageDeliveryTime: 0,
                averageDistance: 0,
                successRate: 0,
                deliveriesByDriver: {}
            };

            if (!this.db) return analytics;

            const snapshot = await this.db
                .collection('deliveries')
                .where('createdAt', '>=', new Date(startDate))
                .where('createdAt', '<=', new Date(endDate))
                .get();

            let totalTime = 0;
            let totalDistance = 0;
            const driverStats = {};

            snapshot.forEach(doc => {
                const delivery = doc.data();
                analytics.totalDeliveries++;

                if (delivery.status === 'delivered') {
                    analytics.completedDeliveries++;
                    
                    // Calculate delivery time
                    if (delivery.actualDeliveryTime && delivery.createdAt) {
                        const time = (new Date(delivery.actualDeliveryTime) - new Date(delivery.createdAt)) / 60000;
                        totalTime += time;
                    }
                }

                // Track driver stats
                const driverId = delivery.driverId;
                if (!driverStats[driverId]) {
                    driverStats[driverId] = { total: 0, completed: 0 };
                }
                driverStats[driverId].total++;
                if (delivery.status === 'delivered') {
                    driverStats[driverId].completed++;
                }
            });

            analytics.averageDeliveryTime = analytics.completedDeliveries > 0
                ? Number((totalTime / analytics.completedDeliveries).toFixed(2))
                : 0;

            analytics.successRate = analytics.totalDeliveries > 0
                ? Number(((analytics.completedDeliveries / analytics.totalDeliveries) * 100).toFixed(2))
                : 0;

            analytics.deliveriesByDriver = driverStats;

            return analytics;
        } catch (error) {
            this.logger.error('Analytics generation failed:', error);
            throw error;
        }
    }
}

module.exports = DeliveryService;
