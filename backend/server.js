// =====================================================
// RDC BACKEND - MAIN SERVER FILE
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
app.use(helmet());
app.use(cors());
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

// Authentication Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// User Routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Product Routes
const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

// Order Routes
const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);

// Inventory Routes
const inventoryRoutes = require('./routes/inventory');
app.use('/api/inventory', inventoryRoutes);

// Delivery Routes
const deliveryRoutes = require('./routes/delivery');
app.use('/api/delivery', deliveryRoutes);

// Payment Routes
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

// Analytics Routes
const analyticsRoutes = require('./routes/analytics');
app.use('/api/analytics', analyticsRoutes);

// Notification Routes
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

// Recommendation Routes
const recommendationRoutes = require('./routes/recommendations');
app.use('/api/recommendations', recommendationRoutes);

// =====================================================
// REAL-TIME EVENTS (Socket.io)
// =====================================================

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Order events
    socket.on('order:created', (data) => {
        io.emit('order:updated', data);
    });

    socket.on('order:status_changed', (data) => {
        io.emit('order:status_changed', data);
    });

    // Delivery events
    socket.on('delivery:location_updated', (data) => {
        io.emit('delivery:location_updated', data);
    });

    socket.on('delivery:status_changed', (data) => {
        io.emit('delivery:status_changed', data);
    });

    // Inventory events
    socket.on('inventory:stock_changed', (data) => {
        io.emit('inventory:stock_changed', data);
    });

    // Notification events
    socket.on('notification:send', (data) => {
        io.emit('notification:received', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

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

server.listen(PORT, () => {
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
