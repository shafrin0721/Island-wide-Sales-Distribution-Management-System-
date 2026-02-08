// =====================================================
// ISDN - CENTRALISED DISTRIBUTION MANAGEMENT SYSTEM
// Backend Server - Node.js + Express
// =====================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const i18n = require('i18n');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'ws:', 'wss:']
        }
    }
}));
app.use(cors());
// Allow 'unload' permission for this site to reduce extension/Permissions-Policy warnings in console
// Note: This relaxes a browser permissions policy and is optional. Remove if undesired.
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', "unload=(self)");
    next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// i18n Configuration
i18n.configure({
    locales: ['en', 'es', 'fr', 'pt', 'ar'],
    defaultLocale: 'en',
    directory: path.join(__dirname, 'locales'),
    updateFiles: false,
    indent: '\t'
});

app.use(i18n.init);

// =====================================================
// STATIC FILE SERVING (FRONTEND)
// =====================================================

// Serve static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Serve pages directory
app.use('/pages', express.static(path.join(__dirname, '../pages')));

// Serve CSS and JS
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));

// Root route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Firebase Connection (Cloud Database)
const { db, auth, testConnection } = require('./config/firebase');

// Initialize Firebase on startup
testConnection().then(() => {
    console.log('✓ Firebase initialized successfully');
}).catch((error) => {
    console.error('✗ Firebase connection failed:', error.message);
    console.log('⚠️  Continuing with mock authentication system...');
});

// Store Firebase connections in app
app.locals.db = db;
app.locals.auth = auth;
app.locals.io = io;

// =====================================================
// API ROUTES
// =====================================================

// Health & Status
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

app.get('/api', (req, res) => {
    res.json({
        name: 'ISDN API v1',
        status: 'running',
        endpoints: [
            '/api/health',
            '/api/auth',
            '/api/users',
            '/api/products',
            '/api/orders',
            '/api/inventory',
            '/api/delivery',
            '/api/payments',
            '/api/dashboard',
            '/api/analytics'
        ]
    });
});

// Authentication Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// User Routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Product Routes
const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

// Order Routes (try enhanced first, fall back to original)
try {
    const orderRoutesEnhanced = require('./routes/orders_enhanced');
    app.use('/api/orders', orderRoutesEnhanced);
    console.log('✓ Enhanced order routes loaded');
} catch (e) {
    const orderRoutes = require('./routes/orders');
    app.use('/api/orders', orderRoutes);
    console.log('⚠️  Using standard order routes');
}

// Inventory Routes (try enhanced first)
try {
    const inventoryRoutesEnhanced = require('./routes/inventory_enhanced');
    app.use('/api/inventory', inventoryRoutesEnhanced);
    console.log('✓ Enhanced inventory routes loaded');
} catch (e) {
    const inventoryRoutes = require('./routes/inventory');
    app.use('/api/inventory', inventoryRoutes);
    console.log('⚠️  Using standard inventory routes');
}

// Delivery Routes (try enhanced first)
try {
    const deliveryRoutesEnhanced = require('./routes/delivery_enhanced');
    app.use('/api/delivery', deliveryRoutesEnhanced);
    console.log('✓ Enhanced delivery routes loaded');
} catch (e) {
    const deliveryRoutes = require('./routes/delivery');
    app.use('/api/delivery', deliveryRoutes);
    console.log('⚠️  Using standard delivery routes');
}

// Payment Routes
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

// Analytics Routes
const analyticsRoutes = require('./routes/analytics');
app.use('/api/analytics', analyticsRoutes);

// Dashboard Routes (NEW)
try {
    const dashboardRoutes = require('./routes/dashboard');
    app.use('/api/dashboard', dashboardRoutes);
    console.log('✓ Dashboard routes loaded');
} catch (e) {
    console.log('⚠️  Dashboard routes not available');
}

// Notification Routes
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

// Recommendation Routes
const recommendationRoutes = require('./routes/recommendations');
app.use('/api/recommendations', recommendationRoutes);

// Promotions Routes
const promotionsRoutes = require('./routes/promotions');
app.use('/api/promotions', promotionsRoutes);

// =====================================================
// REAL-TIME EVENTS (Socket.io)
// Enhanced with inventory and delivery tracking
// =====================================================

// Track active user connections
const userConnections = new Map();
const deliveryTracking = new Map();

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // User joins - track for real-time updates
    socket.on('user:join', (data) => {
        const userId = data.userId;
        userConnections.set(userId, socket.id);
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined`);
    });

    // ===== ORDER EVENTS =====
    socket.on('order:created', (data) => {
        io.emit('order:created', {
            ...data,
            timestamp: new Date()
        });
        console.log('Order created:', data.orderNumber);
    });

    socket.on('order:status_changed', (data) => {
        io.emit('order:status_changed', {
            ...data,
            timestamp: new Date()
        });
        // Notify specific customer
        io.to(`user:${data.customerId}`).emit('my-order:updated', data);
    });

    socket.on('order:payment_received', (data) => {
        io.emit('order:payment_confirmed', {
            ...data,
            timestamp: new Date()
        });
        io.to(`user:${data.customerId}`).emit('payment:confirmed', data);
    });

    // ===== DELIVERY EVENTS =====
    socket.on('delivery:created', (data) => {
        const deliveryId = data.deliveryId;
        deliveryTracking.set(deliveryId, {
            id: deliveryId,
            orderId: data.orderId,
            customerId: data.customerId,
            startTime: new Date()
        });
        
        io.emit('delivery:assigned', {
            ...data,
            timestamp: new Date()
        });
        io.to(`user:${data.customerId}`).emit('delivery:on-way', data);
    });

    socket.on('delivery:location_updated', (data) => {
        const deliveryId = data.deliveryId;
        
        // Update tracking cache
        if (deliveryTracking.has(deliveryId)) {
            const tracking = deliveryTracking.get(deliveryId);
            tracking.lastLocation = {
                lat: data.latitude,
                lon: data.longitude,
                timestamp: new Date()
            };
            tracking.lastUpdate = new Date();
        }

        // Broadcast to all users tracking this delivery
        io.emit('delivery:location_update', {
            deliveryId: data.deliveryId,
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed || 0,
            accuracy: data.accuracy || 10,
            timestamp: new Date()
        });

        // Notify customer
        const tracking = deliveryTracking.get(deliveryId);
        if (tracking) {
            io.to(`user:${tracking.customerId}`).emit('delivery:location_real-time', data);
        }
    });

    socket.on('delivery:status_changed', (data) => {
        io.emit('delivery:status_update', {
            ...data,
            timestamp: new Date()
        });

        const tracking = deliveryTracking.get(data.deliveryId);
        if (tracking) {
            io.to(`user:${tracking.customerId}`).emit('delivery:status_update', data);
        }

        // Clean up completed deliveries
        if (data.status === 'completed' || data.status === 'failed') {
            setTimeout(() => {
                deliveryTracking.delete(data.deliveryId);
            }, 60000); // Keep for 1 minute
        }
    });

    socket.on('delivery:arrived', (data) => {
        io.emit('delivery:arrived_notification', {
            ...data,
            timestamp: new Date()
        });
    });

    // ===== INVENTORY EVENTS =====
    socket.on('inventory:stock_updated', (data) => {
        io.emit('inventory:stock_changed', {
            productId: data.productId,
            oldStock: data.oldStock,
            newStock: data.newStock,
            location: data.location,
            reason: data.reason, // 'order', 'restock', 'adjustment'
            timestamp: new Date()
        });
        console.log(`Inventory updated: Product ${data.productId}, Stock: ${data.oldStock} → ${data.newStock}`);
    });

    socket.on('inventory:low_stock_alert', (data) => {
        io.emit('inventory:alert', {
            type: 'low_stock',
            productId: data.productId,
            productName: data.productName,
            currentStock: data.currentStock,
            reorderLevel: data.reorderLevel,
            location: data.location,
            timestamp: new Date()
        });
    });

    socket.on('inventory:stock_transfer', (data) => {
        io.emit('inventory:transfer_initiated', {
            ...data,
            status: 'in_transit',
            timestamp: new Date()
        });
    });

    socket.on('inventory:transfer_received', (data) => {
        io.emit('inventory:transfer_completed', {
            ...data,
            status: 'completed',
            timestamp: new Date()
        });
    });

    // ===== PAYMENT EVENTS =====
    socket.on('payment:processing', (data) => {
        io.to(`user:${data.customerId}`).emit('payment:status', {
            orderId: data.orderId,
            status: 'processing',
            amount: data.amount,
            timestamp: new Date()
        });
    });

    socket.on('payment:completed', (data) => {
        io.emit('payment:success', {
            ...data,
            timestamp: new Date()
        });
        io.to(`user:${data.customerId}`).emit('order:paid', data);
    });

    socket.on('payment:failed', (data) => {
        io.to(`user:${data.customerId}`).emit('payment:error', {
            orderId: data.orderId,
            reason: data.reason,
            timestamp: new Date()
        });
    });

    // ===== NOTIFICATION EVENTS =====
    socket.on('notification:send', (data) => {
        if (data.userId) {
            io.to(`user:${data.userId}`).emit('notification:received', {
                ...data,
                timestamp: new Date()
            });
        } else {
            io.emit('notification:broadcast', {
                ...data,
                timestamp: new Date()
            });
        }
    });

    socket.on('notification:read', (data) => {
        socket.broadcast.emit('notification:marked_read', {
            notificationId: data.notificationId,
            userId: data.userId
        });
    });

    // ===== DASHBOARD/ANALYTICS EVENTS =====
    socket.on('dashboard:subscribe', (data) => {
        socket.join('dashboard:updates');
        socket.emit('dashboard:subscribed', {
            message: 'Subscribed to real-time dashboard updates',
            timestamp: new Date()
        });
    });

    socket.on('analytics:subscribe', (data) => {
        socket.join('analytics:updates');
    });

    // ===== LIVE TRACKING SUBSCRIPTION =====
    socket.on('tracking:subscribe', (data) => {
        socket.join(`delivery:${data.deliveryId}`);
        socket.emit('tracking:subscribed', {
            deliveryId: data.deliveryId,
            timestamp: new Date()
        });
    });

    socket.on('tracking:unsubscribe', (data) => {
        socket.leave(`delivery:${data.deliveryId}`);
    });

    // ===== USER DISCONNECT =====
    socket.on('disconnect', () => {
        // Remove user from connections
        for (let [userId, socketId] of userConnections.entries()) {
            if (socketId === socket.id) {
                userConnections.delete(userId);
                console.log(`User ${userId} disconnected`);
                break;
            }
        }
        console.log('Client disconnected:', socket.id);
    });

    // Error handling
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// ===== BROADCAST FUNCTIONS FOR SERVER-SIDE EVENTS =====
global.broadcastInventoryUpdate = (data) => {
    io.emit('inventory:stock_changed', {
        ...data,
        timestamp: new Date()
    });
};

global.broadcastDeliveryUpdate = (data) => {
    io.emit('delivery:status_update', {
        ...data,
        timestamp: new Date()
    });
};

global.broadcastOrderUpdate = (data) => {
    io.emit('order:status_changed', {
        ...data,
        timestamp: new Date()
    });
};

global.notifyUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, {
        ...data,
        timestamp: new Date()
    });
};

// =====================================================
// ERROR HANDLING
// =====================================================

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// =====================================================
// SERVER START
// =====================================================

const PORT = process.env.PORT || 5000;

// =====================================================
// ERROR HANDLING
// =====================================================

// Catch all undefined routes
app.use((req, res) => {
    console.warn(`❌ Route not found: ${req.method} ${req.path}`);
    console.warn(`   Available base paths: /api/auth, /api/orders, /api/inventory, /api/delivery, /api/payments, etc.`);
    
    res.status(404).json({
        success: false,
        message: 'Route not found',
        endpoint: `${req.method} ${req.path}`,
        hint: 'Check that the URL is correct. Use GET /api to see available endpoints.',
        availableEndpoints: [
            '/api/health',
            '/api (main API info)',
            '/api/auth (login, register)',
            '/api/users (user management)',
            '/api/products (product catalog)',
            '/api/orders (order management)',
            '/api/inventory (stock management)',
            '/api/delivery (delivery tracking)',
            '/api/payments (payment processing)',
            '/api/dashboard (analytics)',
            '/api/analytics (reports)',
            '/api/notifications (alerts)',
            '/api/recommendations (product suggestions)',
            '/api/promotions (special offers)'
        ]
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

server.listen(PORT, () => {
    // Initialize demo test users for development
    const bcryptjs = require('bcryptjs');
    const crypto = require('crypto');
    
    if (process.env.NODE_ENV !== 'production') {
        // Create test users for demo
        global.mockUsers = global.mockUsers || {};
        global.mockUsersByEmail = global.mockUsersByEmail || {};
        
        const testUsers = [
            {
                email: 'customer@test.com',
                password: 'password123',
                fullName: 'John Customer',
                role: 'customer',
                phone: '1234567890',
                address: '123 Main St'
            },
            {
                email: 'rdc@test.com',
                password: 'password123',
                fullName: 'RDC Admin',
                role: 'rdc',
                phone: '0987654321',
                address: '456 RDC St'
            },
            {
                email: 'delivery@test.com',
                password: 'password123',
                fullName: 'Delivery Driver',
                role: 'delivery',
                phone: '5555555555',
                address: '789 Delivery Ave'
            }
        ];
        
        testUsers.forEach(user => {
            const uid = crypto.randomUUID();
            const passwordHash = bcryptjs.hashSync(user.password, 10);
            
            global.mockUsers[uid] = {
                uid,
                email: user.email,
                password: user.password,  // Store plain password for fallback
                passwordHash,
                displayName: user.fullName,
                phone: user.phone,
                address: user.address,
                role: user.role,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            global.mockUsersByEmail[user.email] = uid;
        });
        
        console.log(`\n✓ Demo test users initialized for development mode`);
        console.log(`  - customer@test.com (password123)`);
        console.log(`  - rdc@test.com (password123)`);
        console.log(`  - delivery@test.com (password123)\n`);
    }

    console.log(`
    ╔═════════════════════════════════════════╗
    ║   RDC BACKEND SERVER STARTED            ║
    ║   Port: ${PORT}                             ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}        ║
    ║   Database: Firebase (Cloud)            ║
    ╚═════════════════════════════════════════╝
    `);
});

module.exports = { app, server, io, db, auth };
