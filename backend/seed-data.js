#!/usr/bin/env node

// =====================================================
// ISDN SYSTEM - DATA SEEDING SCRIPT
// Populates Firebase/Database with test data
// =====================================================

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Initialize Firebase
let db;
try {
    const serviceAccount = require('./firebase-key.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    db = admin.firestore();
    console.log('✓ Firebase initialized');
} catch (error) {
    console.warn('⚠️  Firebase initialization failed:', error.message);
    console.log('Using mock data structure instead');
    db = null;
}

const RDCs = [
    { id: 'RDC-001', name: 'Central Colombo', location: { lat: 6.9271, lon: 80.6369 } },
    { id: 'RDC-002', name: 'Western Region', location: { lat: 6.8367, lon: 80.7594 } },
    { id: 'RDC-003', name: 'Southern Region', location: { lat: 5.9497, lon: 80.7891 } },
    { id: 'RDC-004', name: 'Northern Region', location: { lat: 8.7641, lon: 80.7668 } },
    { id: 'RDC-005', name: 'Eastern Region', location: { lat: 6.9497, lon: 81.7891 } }
];

const PRODUCTS = [
    { id: 'P001', name: 'Rice (5kg)', category: 'Staples', price: 950, weight: 5000 },
    { id: 'P002', name: 'Sugar (2kg)', category: 'Staples', price: 380, weight: 2000 },
    { id: 'P003', name: 'Flour (1kg)', category: 'Staples', price: 250, weight: 1000 },
    { id: 'P004', name: 'Cooking Oil (1L)', category: 'Oils', price: 720, weight: 1000 },
    { id: 'P005', name: 'Milk Powder (400g)', category: 'Dairy', price: 520, weight: 400 },
    { id: 'P006', name: 'Bread (500g)', category: 'Bakery', price: 180, weight: 500 },
    { id: 'P007', name: 'Tea (500g)', category: 'Beverages', price: 850, weight: 500 },
    { id: 'P008', name: 'Coffee (250g)', category: 'Beverages', price: 600, weight: 250 },
    { id: 'P009', name: 'Salt (1kg)', category: 'Seasonings', price: 85, weight: 1000 },
    { id: 'P010', name: 'Sugar Crystals (1kg)', category: 'Seasonings', price: 210, weight: 1000 }
];

const USERS_TEST = [
    // Customers
    { uid: 'cust001', email: 'customer1@example.com', displayName: 'John Perera', role: 'customer', phone: '+94771234567' },
    { uid: 'cust002', email: 'customer2@example.com', displayName: 'Priya Silva', role: 'customer', phone: '+94772345678' },
    { uid: 'cust003', email: 'customer3@example.com', displayName: 'Raj Kumar', role: 'customer', phone: '+94773456789' },
    
    // RDC Staff
    { uid: 'rdc001', email: 'rdcstaff1@isdn.lk', displayName: 'Amith Jayasena', role: 'rdc_staff', phone: '+94774567890', rdcId: 'RDC-001' },
    { uid: 'rdc002', email: 'rdcstaff2@isdn.lk', displayName: 'Kasun Wijesinghe', role: 'rdc_staff', phone: '+94775678901', rdcId: 'RDC-002' },
    
    // Delivery Drivers
    { uid: 'drv001', email: 'driver1@isdn.lk', displayName: 'Arjun Fernando', role: 'delivery_staff', phone: '+94776789012', rdcId: 'RDC-001' },
    { uid: 'drv002', email: 'driver2@isdn.lk', displayName: 'Bimal Mendis', role: 'delivery_staff', phone: '+94777890123', rdcId: 'RDC-001' },
    
    // Admin
    { uid: 'admin001', email: 'admin@isdn.lk', displayName: 'ISDN Administrator', role: 'admin', phone: '+94778901234' }
];

async function seedData() {
    console.log('\n=== ISDN System Data Seeding ===\n');

    try {
        // Seed RDCs
        console.log('Seeding RDCs...');
        for (const rdc of RDCs) {
            if (db) {
                await db.collection('rdcs').doc(rdc.id).set(rdc);
            }
            console.log(`  ✓ ${rdc.id} - ${rdc.name}`);
        }

        // Seed Products
        console.log('\nSeeding Products...');
        for (const product of PRODUCTS) {
            if (db) {
                await db.collection('products').doc(product.id).set({
                    ...product,
                    stock_level: Math.floor(Math.random() * 5000) + 500,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            console.log(`  ✓ ${product.id} - ${product.name}`);
        }

        // Seed Users
        console.log('\nSeeding Users...');
        for (const user of USERS_TEST) {
            if (db) {
                await db.collection('users').doc(user.uid).set({
                    ...user,
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    emailVerified: true
                });
            }
            console.log(`  ✓ ${user.uid} - ${user.displayName} (${user.role})`);
        }

        // Seed Inventory (stock at each RDC)
        console.log('\nSeeding Inventory...');
        for (const rdc of RDCs) {
            for (const product of PRODUCTS) {
                const key = `${product.id}:${rdc.id}`;
                const quantity = Math.floor(Math.random() * 1000) + 100;
                if (db) {
                    await db.collection('inventory').doc(key).set({
                        productId: product.id,
                        rdcId: rdc.id,
                        quantity,
                        available: quantity,
                        reserved: 0,
                        reorderLevel: 500,
                        unitPrice: product.price,
                        lastSync: new Date()
                    });
                }
            }
            console.log(`  ✓ Inventory created for ${rdc.id}`);
        }

        // Seed Sample Orders
        console.log('\nSeeding Sample Orders...');
        const statuses = ['pending', 'confirmed', 'packed', 'dispatched', 'delivered'];
        for (let i = 0; i < 5; i++) {
            const customerId = USERS_TEST[i % 3].uid;
            const rdcId = RDCs[i % 5].id;
            const items = [
                { productId: PRODUCTS[i % 10].id, quantity: 10, price: PRODUCTS[i % 10].price }
            ];
            
            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = subtotal * 0.10;
            const total = subtotal + tax + 15;

            const order = {
                orderId: `ORD-${Date.now()}-${i}`,
                customerId,
                items,
                deliveryAddress: {
                    address: `123 Main Street, Colombo ${i + 1}`,
                    city: 'Colombo',
                    postalCode: '100' + i,
                    lat: 6.9271 + (Math.random() - 0.5) * 0.5,
                    lon: 80.6369 + (Math.random() - 0.5) * 0.5
                },
                paymentMethod: 'card',
                rdcId,
                status: statuses[i % 5],
                paymentStatus: 'completed',
                subtotal,
                tax,
                shippingCost: 15,
                discountAmount: 0,
                total,
                createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
                timeline: [{
                    status: statuses[i % 5],
                    timestamp: new Date(),
                    note: 'Order created'
                }]
            };

            if (db) {
                await db.collection('orders').doc(order.orderId).set(order);
            }
            console.log(`  ✓ ${order.orderId} - ${order.status}`);
        }

        // Seed Sample Deliveries
        console.log('\nSeeding Sample Deliveries...');
        for (let i = 0; i < 3; i++) {
            const delivery = {
                deliveryId: `DEL-${Date.now()}-${i}`,
                orderId: `ORD-${Date.now()}-${i}`,
                driverId: USERS_TEST[4 + (i % 2)].uid,
                vehicleId: `VEH-${i + 1}`,
                status: ['in_transit', 'delivered'][i % 2],
                estimatedMinutes: 30,
                estimatedDeliveryTime: new Date(Date.now() + 30 * 60000),
                currentLocation: {
                    lat: 6.9271 + (Math.random() - 0.5) * 0.3,
                    lon: 80.6369 + (Math.random() - 0.5) * 0.3,
                    timestamp: new Date()
                },
                driver: {
                    id: USERS_TEST[4 + (i % 2)].uid,
                    name: USERS_TEST[4 + (i % 2)].displayName,
                    phone: USERS_TEST[4 + (i % 2)].phone
                },
                createdAt: new Date(Date.now() - i * 60 * 60 * 1000),
                updatedAt: new Date(),
                timeline: [{
                    status: 'assigned',
                    timestamp: new Date(),
                    note: 'Delivery assigned'
                }]
            };

            if (db) {
                await db.collection('deliveries').doc(delivery.deliveryId).set(delivery);
            }
            console.log(`  ✓ ${delivery.deliveryId} - ${delivery.status}`);
        }

        console.log('\n✓ Data seeding completed successfully!\n');
        console.log('Summary:');
        console.log(`  - ${RDCs.length} RDCs`);
        console.log(`  - ${PRODUCTS.length} Products`);
        console.log(`  - ${USERS_TEST.length} Users`);
        console.log(`  - ${RDCs.length * PRODUCTS.length} Inventory records`);
        console.log(`  - 5 Sample orders`);
        console.log(`  - 3 Sample deliveries\n`);

        process.exit(0);
    } catch (error) {
        console.error('✗ Seeding failed:', error);
        process.exit(1);
    }
}

// Run seeding
seedData();
