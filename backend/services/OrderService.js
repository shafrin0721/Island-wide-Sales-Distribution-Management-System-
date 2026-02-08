// =====================================================
// ORDER SERVICE - Order Processing & Management
// Handles order creation, tracking, workflow, and analytics
// =====================================================

const { v4: uuidv4 } = require('uuid');

class OrderService {
    constructor(db, logger) {
        this.db = db;
        this.logger = logger || console;
    }

    /**
     * Create new order with full validation and workflow
     */
    async createOrder(orderData) {
        try {
            const {
                customerId,
                items, // [{productId, quantity, price}]
                deliveryAddress,
                paymentMethod,
                specialInstructions,
                rdcId
            } = orderData;

            // Validate required fields
            if (!customerId || !items || !items.length || !deliveryAddress || !paymentMethod) {
                throw new Error('Missing required order fields');
            }

            // Calculate order totals
            let subtotal = 0;
            let tax = 0;
            let shippingCost = 15; // Default shipping
            let discountAmount = 0;

            for (let item of items) {
                subtotal += item.price * item.quantity;
            }

            // Apply VAT (10%)
            tax = subtotal * 0.10;

            // Apply discount if applicable
            if (orderData.discountCode) {
                discountAmount = await this.applyDiscount(orderData.discountCode, subtotal);
            }

            const total = subtotal + tax + shippingCost - discountAmount;

            // Create order object
            const order = {
                orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                customerId,
                items: items.map(item => ({
                    ...item,
                    itemTotal: item.price * item.quantity
                })),
                deliveryAddress,
                paymentMethod,
                specialInstructions: specialInstructions || '',
                rdcId: rdcId || 'RDC-001', // Default RDC
                
                // Pricing
                subtotal: Number(subtotal.toFixed(2)),
                tax: Number(tax.toFixed(2)),
                shippingCost: shippingCost,
                discountAmount: Number(discountAmount.toFixed(2)),
                total: Number(total.toFixed(2)),
                
                // Status & Tracking
                status: 'pending', // pending, confirmed, packed, dispatched, delivered, cancelled
                paymentStatus: 'pending', // pending, completed, failed, refunded
                createdAt: new Date(),
                updatedAt: new Date(),
                estimatedDeliveryDate: this.calculateETA(),
                
                // Audit trail
                timeline: [
                    {
                        status: 'pending',
                        timestamp: new Date(),
                        note: 'Order created'
                    }
                ],
                notes: []
            };

            // Save to database
            if (this.db) {
                await this.db.collection('orders').doc(order.orderId).set(order);
            }

            this.logger.info(`Order created: ${order.orderId}`);
            return order;

        } catch (error) {
            this.logger.error('Order creation failed:', error);
            throw error;
        }
    }

    /**
     * Update order status with validation
     */
    async updateOrderStatus(orderId, newStatus, notes = '') {
        try {
            const validStatuses = ['pending', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled'];
            
            if (!validStatuses.includes(newStatus)) {
                throw new Error(`Invalid status: ${newStatus}`);
            }

            const update = {
                status: newStatus,
                updatedAt: new Date()
            };

            if (this.db) {
                const ref = this.db.collection('orders').doc(orderId);
                const order = await ref.get();
                
                if (!order.exists) {
                    throw new Error(`Order not found: ${orderId}`);
                }

                const oldData = order.data();
                
                // Add to timeline
                const timeline = oldData.timeline || [];
                timeline.push({
                    status: newStatus,
                    timestamp: new Date(),
                    note: notes
                });

                await ref.update({
                    ...update,
                    timeline
                });
            }

            this.logger.info(`Order ${orderId} status updated to ${newStatus}`);
            return update;

        } catch (error) {
            this.logger.error('Status update failed:', error);
            throw error;
        }
    }

    /**
     * Get order with all details
     */
    async getOrder(orderId) {
        try {
            if (this.db) {
                const doc = await this.db.collection('orders').doc(orderId).get();
                if (doc.exists) {
                    return { orderId: doc.id, ...doc.data() };
                }
            }
            return null;
        } catch (error) {
            this.logger.error('Get order failed:', error);
            throw error;
        }
    }

    /**
     * Get customer orders with pagination
     */
    async getCustomerOrders(customerId, limit = 50, offset = 0) {
        try {
            const orders = [];
            
            if (this.db) {
                const snapshot = await this.db
                    .collection('orders')
                    .where('customerId', '==', customerId)
                    .orderBy('createdAt', 'desc')
                    .limit(limit)
                    .offset(offset)
                    .get();

                snapshot.forEach(doc => {
                    orders.push({ orderId: doc.id, ...doc.data() });
                });
            }

            return orders;
        } catch (error) {
            this.logger.error('Get customer orders failed:', error);
            throw error;
        }
    }

    /**
     * Get RDC orders awaiting confirmation/packing
     */
    async getRDCOrders(rdcId, statuses = ['pending', 'confirmed'], limit = 50) {
        try {
            const orders = [];
            
            if (this.db) {
                const snapshot = await this.db
                    .collection('orders')
                    .where('rdcId', '==', rdcId)
                    .where('status', 'in', statuses)
                    .orderBy('createdAt', 'desc')
                    .limit(limit)
                    .get();

                snapshot.forEach(doc => {
                    orders.push({ orderId: doc.id, ...doc.data() });
                });
            }

            return orders;
        } catch (error) {
            this.logger.error('Get RDC orders failed:', error);
            throw error;
        }
    }

    /**
     * Calculate ETA based on business days
     */
    calculateETA(days = 3) {
        const eta = new Date();
        let daysAdded = 0;

        while (daysAdded < days) {
            eta.setDate(eta.getDate() + 1);
            // Skip weekends (5=Saturday, 6=Sunday)
            if (eta.getDay() !== 5 && eta.getDay() !== 6) {
                daysAdded++;
            }
        }

        return eta;
    }

    /**
     * Apply discount code validation
     */
    async applyDiscount(discountCode, subtotal) {
        try {
            if (!this.db) return 0;

            const doc = await this.db.collection('discounts').doc(discountCode).get();
            
            if (!doc.exists) {
                this.logger.warn(`Discount not found: ${discountCode}`);
                return 0;
            }

            const discount = doc.data();
            
            // Check if discount is valid
            if (discount.expiryDate && new Date(discount.expiryDate) < new Date()) {
                this.logger.warn(`Discount expired: ${discountCode}`);
                return 0;
            }

            // Calculate discount amount
            if (discount.type === 'percentage') {
                return (subtotal * discount.value) / 100;
            } else if (discount.type === 'fixed') {
                return discount.value;
            }

            return 0;
        } catch (error) {
            this.logger.error('Discount application failed:', error);
            return 0;
        }
    }

    /**
     * Get order analytics
     */
    async getOrderAnalytics(rdcId, startDate, endDate) {
        try {
            const analytics = {
                totalOrders: 0,
                totalRevenue: 0,
                averageOrderValue: 0,
                ordersByStatus: {},
                topProducts: [],
                customerCount: new Set()
            };

            if (!this.db) return analytics;

            const snapshot = await this.db
                .collection('orders')
                .where('rdcId', '==', rdcId)
                .where('createdAt', '>=', new Date(startDate))
                .where('createdAt', '<=', new Date(endDate))
                .get();

            const products = {};

            snapshot.forEach(doc => {
                const order = doc.data();
                analytics.totalOrders++;
                analytics.totalRevenue += order.total || 0;
                analytics.customerCount.add(order.customerId);

                // Count by status
                const status = order.status || 'unknown';
                analytics.ordersByStatus[status] = (analytics.ordersByStatus[status] || 0) + 1;

                // Track products
                if (order.items) {
                    order.items.forEach(item => {
                        const key = item.productId;
                        products[key] = (products[key] || 0) + item.quantity;
                    });
                }
            });

            analytics.averageOrderValue = analytics.totalOrders > 0 
                ? Number((analytics.totalRevenue / analytics.totalOrders).toFixed(2))
                : 0;

            analytics.topProducts = Object.entries(products)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([productId, quantity]) => ({ productId, quantity }));

            analytics.uniqueCustomers = analytics.customerCount.size;

            return analytics;
        } catch (error) {
            this.logger.error('Analytics generation failed:', error);
            throw error;
        }
    }
}

module.exports = OrderService;
