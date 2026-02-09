// =====================================================
// INVENTORY SERVICE - Stock Management & Real-time Sync
// Handles inventory updates, transfers, and sync via Socket.IO
// =====================================================

class InventoryService {
    constructor(db, io, logger) {
        this.db = db;
        this.io = io;
        this.logger = logger || console;
        this.inventory = new Map(); // In-memory cache for quick updates
    }

    /**
     * Get current stock level for a product at RDC
     */
    async getStock(productId, rdcId) {
        try {
            const key = `${productId}:${rdcId}`;
            
            if (this.inventory.has(key)) {
                return this.inventory.get(key);
            }

            if (this.db) {
                const doc = await this.db
                    .collection('inventory')
                    .doc(key)
                    .get();
                
                if (doc.exists) {
                    const data = doc.data();
                    this.inventory.set(key, data);
                    return data;
                }
            }

            return {
                productId,
                rdcId,
                quantity: 0,
                reserved: 0,
                available: 0
            };
        } catch (error) {
            this.logger.error('Get stock failed:', error);
            throw error;
        }
    }

    /**
     * Update stock after order confirmation
     */
    async reserveStock(productId, rdcId, quantity, orderId) {
        try {
            const stock = await this.getStock(productId, rdcId);
            
            if (stock.available < quantity) {
                throw new Error(`Insufficient stock for ${productId}. Available: ${stock.available}, Requested: ${quantity}`);
            }

            const key = `${productId}:${rdcId}`;
            const updatedStock = {
                ...stock,
                reserved: (stock.reserved || 0) + quantity,
                available: stock.available - quantity,
                updatedAt: new Date(),
                lastReservation: {
                    orderId,
                    quantity,
                    timestamp: new Date()
                }
            };

            if (this.db) {
                await this.db.collection('inventory').doc(key).set(updatedStock);
            }

            this.inventory.set(key, updatedStock);

            // Emit real-time update
            this.broadcastInventoryUpdate(rdcId, productId, updatedStock);

            this.logger.info(`Stock reserved: ${quantity} units of ${productId} at ${rdcId}`);
            return updatedStock;

        } catch (error) {
            this.logger.error('Reserve stock failed:', error);
            throw error;
        }
    }

    /**
     * Update stock after order fulfillment
     */
    async fulfillOrder(productId, rdcId, quantity, orderId) {
        try {
            const stock = await this.getStock(productId, rdcId);
            
            const key = `${productId}:${rdcId}`;
            const updatedStock = {
                ...stock,
                quantity: Math.max(0, stock.quantity - quantity),
                reserved: Math.max(0, (stock.reserved || 0) - quantity),
                available: stock.quantity - quantity,
                updatedAt: new Date(),
                lastFulfillment: {
                    orderId,
                    quantity,
                    timestamp: new Date()
                }
            };

            if (this.db) {
                await this.db.collection('inventory').doc(key).set(updatedStock);
            }

            this.inventory.set(key, updatedStock);

            // Emit real-time update
            this.broadcastInventoryUpdate(rdcId, productId, updatedStock);

            this.logger.info(`Order fulfilled: ${quantity} units of ${productId} from ${rdcId}`);
            return updatedStock;

        } catch (error) {
            this.logger.error('Fulfill order failed:', error);
            throw error;
        }
    }

    /**
     * Receive stock transfer from warehouse or other RDC
     */
    async receiveTransfer(productId, rdcId, quantity, sourceId) {
        try {
            const key = `${productId}:${rdcId}`;
            const stock = await this.getStock(productId, rdcId);

            const updatedStock = {
                ...stock,
                quantity: (stock.quantity || 0) + quantity,
                available: (stock.available || 0) + quantity,
                updatedAt: new Date(),
                lastReceived: {
                    sourceId,
                    quantity,
                    timestamp: new Date()
                }
            };

            if (this.db) {
                await this.db.collection('inventory').doc(key).set(updatedStock);
            }

            this.inventory.set(key, updatedStock);

            // Emit real-time update
            this.broadcastInventoryUpdate(rdcId, productId, updatedStock);

            this.logger.info(`Transfer received: ${quantity} units of ${productId} at ${rdcId} from ${sourceId}`);
            return updatedStock;

        } catch (error) {
            this.logger.error('Receive transfer failed:', error);
            throw error;
        }
    }

    /**
     * Transfer stock between RDCs
     */
    async transferStock(productId, fromRdc, toRdc, quantity) {
        try {
            // Remove from source RDC
            const sourceKey = `${productId}:${fromRdc}`;
            const sourceStock = await this.getStock(productId, fromRdc);

            if (sourceStock.available < quantity) {
                throw new Error(`Insufficient stock at source RDC. Available: ${sourceStock.available}`);
            }

            const updatedSourceStock = {
                ...sourceStock,
                quantity: sourceStock.quantity - quantity,
                available: sourceStock.available - quantity,
                updatedAt: new Date(),
                lastTransfer: {
                    to: toRdc,
                    quantity,
                    timestamp: new Date()
                }
            };

            if (this.db) {
                await this.db.collection('inventory').doc(sourceKey).set(updatedSourceStock);
            }
            this.inventory.set(sourceKey, updatedSourceStock);

            // Add to destination RDC
            await this.receiveTransfer(productId, toRdc, quantity, fromRdc);

            // Emit updates
            this.broadcastInventoryUpdate(fromRdc, productId, updatedSourceStock);

            this.logger.info(`Stock transferred: ${quantity} units of ${productId} from ${fromRdc} to ${toRdc}`);
            return { success: true };

        } catch (error) {
            this.logger.error('Transfer failed:', error);
            throw error;
        }
    }

    /**
     * Get all products with stock at RDC
     */
    async getRDCInventory(rdcId) {
        try {
            const inventory = [];

            if (this.db) {
                const snapshot = await this.db
                    .collection('inventory')
                    .where('rdcId', '==', rdcId)
                    .get();

                snapshot.forEach(doc => {
                    inventory.push({ id: doc.id, ...doc.data() });
                });
            }

            return inventory;
        } catch (error) {
            this.logger.error('Get RDC inventory failed:', error);
            throw error;
        }
    }

    /**
     * Get all locations and quantities for a product
     */
    async getProductInventory(productId) {
        try {
            const locations = [];

            if (this.db) {
                const snapshot = await this.db
                    .collection('inventory')
                    .where('productId', '==', productId)
                    .get();

                snapshot.forEach(doc => {
                    locations.push({ id: doc.id, ...doc.data() });
                });
            }

            return locations;
        } catch (error) {
            this.logger.error('Get product inventory failed:', error);
            throw error;
        }
    }

    /**
     * Get low stock alerts
     */
    async getLowStockAlerts(rdcId, threshold = 50) {
        try {
            const alerts = [];

            if (this.db) {
                const snapshot = await this.db
                    .collection('inventory')
                    .where('rdcId', '==', rdcId)
                    .get();

                snapshot.forEach(doc => {
                    const item = doc.data();
                    if (item.available < threshold) {
                        alerts.push({
                            id: doc.id,
                            ...item,
                            severity: item.available === 0 ? 'critical' : 'warning'
                        });
                    }
                });
            }

            return alerts;
        } catch (error) {
            this.logger.error('Get low stock alerts failed:', error);
            throw error;
        }
    }

    /**
     * Broadcast inventory update via Socket.IO
     */
    broadcastInventoryUpdate(rdcId, productId, stock) {
        if (this.io) {
            // Notify RDC
            this.io.to(`rdc:${rdcId}`).emit('inventory:updated', {
                productId,
                rdcId,
                stock,
                timestamp: new Date()
            });

            // Notify relevant customer rooms if stock is critical
            if (stock.available === 0) {
                this.io.to(`product:${productId}`).emit('product:out-of-stock', {
                    productId,
                    rdcId,
                    timestamp: new Date()
                });
            }
        }
    }

    /**
     * Get inventory analytics
     */
    async getInventoryAnalytics(rdcId) {
        try {
            const inventory = await this.getRDCInventory(rdcId);
            
            let totalValue = 0;
            let totalQuantity = 0;
            const turnoverRate = {};
            const outOfStock = [];

            for (let item of inventory) {
                totalQuantity += item.quantity || 0;
                totalValue += (item.quantity || 0) * (item.unitPrice || 0);

                if (item.quantity === 0) {
                    outOfStock.push(item.productId);
                }
            }

            return {
                totalItems: inventory.length,
                totalQuantity,
                totalValue: Number(totalValue.toFixed(2)),
                outOfStockItems: outOfStock.length,
                averageInventoryValue: inventory.length > 0 
                    ? Number((totalValue / inventory.length).toFixed(2))
                    : 0
            };
        } catch (error) {
            this.logger.error('Inventory analytics failed:', error);
            throw error;
        }
    }

    /**
     * Sync inventory from multiple sources
     */
    async syncInventory(rdcId, sourceData) {
        try {
            const updates = [];

            for (let item of sourceData) {
                const { productId, quantity } = item;
                const key = `${productId}:${rdcId}`;
                
                const stock = {
                    productId,
                    rdcId,
                    quantity,
                    available: quantity,
                    reserved: 0,
                    lastSync: new Date(),
                    unitPrice: item.unitPrice || 0,
                    reorderLevel: item.reorderLevel || 100
                };

                if (this.db) {
                    await this.db.collection('inventory').doc(key).set(stock);
                }

                this.inventory.set(key, stock);
                updates.push(stock);

                this.broadcastInventoryUpdate(rdcId, productId, stock);
            }

            this.logger.info(`Inventory synced for ${rdcId}: ${updates.length} items`);
            return updates;

        } catch (error) {
            this.logger.error('Inventory sync failed:', error);
            throw error;
        }
    }
}

module.exports = InventoryService;
