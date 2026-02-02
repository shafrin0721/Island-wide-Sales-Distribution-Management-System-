// =====================================================
// SHARED DATA - GLOBAL DATA STORE
// =====================================================

const systemData = {
    users: [
        { userID: 1, name: 'John Customer', email: 'customer@email.com', password: 'pass123', role: 'customer' },
        { userID: 2, name: 'Admin User', email: 'admin@email.com', password: 'admin123', role: 'admin' },
        { userID: 3, name: 'RDC Staff', email: 'rdc@email.com', password: 'rdc123', role: 'rdc_staff' },
        { userID: 4, name: 'Delivery Driver', email: 'delivery@email.com', password: 'delivery123', role: 'delivery_staff' }
    ],
    products: [
        { productID: 1, name: 'Laptop Pro', price: 1299, quantity: 15, description: 'High-performance laptop with latest processor', category: 'Electronics', emoji: '💻' },
        { productID: 2, name: 'Wireless Mouse', price: 45, quantity: 50, description: 'Ergonomic wireless mouse with long battery life', category: 'Electronics', emoji: '🖱️' },
        { productID: 3, name: 'USB-C Cable', price: 12, quantity: 100, description: 'Fast charging USB-C cable 2 meters', category: 'Electronics', emoji: '🔌' },
        { productID: 4, name: 'Winter Jacket', price: 150, quantity: 25, description: 'Warm and comfortable winter jacket', category: 'Clothing', emoji: '🧥' },
        { productID: 5, name: 'Running Shoes', price: 120, quantity: 40, description: 'Professional running shoes with cushioning', category: 'Clothing', emoji: '👟' },
        { productID: 6, name: 'Garden Tools Set', price: 89, quantity: 20, description: 'Complete garden tools set with 10 pieces', category: 'Home', emoji: '🌱' },
        { productID: 7, name: 'Coffee Maker', price: 75, quantity: 18, description: 'Automatic coffee maker with timer', category: 'Home', emoji: '☕' },
        { productID: 8, name: 'JavaScript Book', price: 45, quantity: 35, description: 'Complete guide to JavaScript programming', category: 'Books', emoji: '📚' },
        { productID: 9, name: 'Board Game', price: 30, quantity: 22, description: 'Fun family board game for 2-6 players', category: 'Toys', emoji: '🎲' },
        { productID: 10, name: 'LEGO Set', price: 89, quantity: 28, description: 'Building blocks creative set', category: 'Toys', emoji: '🧩' }
    ],
    orders: [
        { orderID: 1001, userID: 1, orderDate: '2024-01-10', status: 'delivered', totalAmount: 1356, paymentStatus: 'paid', items: [{productID: 1, quantity: 1}, {productID: 2, quantity: 1}] },
        { orderID: 1002, userID: 1, orderDate: '2024-01-12', status: 'shipped', totalAmount: 165, paymentStatus: 'paid', items: [{productID: 4, quantity: 1}] }
    ],
    inventory: [
        { inventoryID: 1, productID: 1, stockLevel: 15, reorderLevel: 5 },
        { inventoryID: 2, productID: 2, stockLevel: 50, reorderLevel: 10 },
        { inventoryID: 3, productID: 3, stockLevel: 100, reorderLevel: 20 },
        { inventoryID: 4, productID: 4, stockLevel: 25, reorderLevel: 8 },
        { inventoryID: 5, productID: 5, stockLevel: 40, reorderLevel: 10 },
        { inventoryID: 6, productID: 6, stockLevel: 20, reorderLevel: 5 },
        { inventoryID: 7, productID: 7, stockLevel: 18, reorderLevel: 5 },
        { inventoryID: 8, productID: 8, stockLevel: 35, reorderLevel: 8 },
        { inventoryID: 9, productID: 9, stockLevel: 22, reorderLevel: 5 },
        { inventoryID: 10, productID: 10, stockLevel: 28, reorderLevel: 6 }
    ],
    deliveries: [
        { deliveryID: 1, orderID: 1001, userID: 1, status: 'delivered', route: 'North District', estimatedTime: '2024-01-11 2:00 PM', assignedStaff: 4 },
        { deliveryID: 2, orderID: 1002, userID: 1, status: 'out for delivery', route: 'South District', estimatedTime: '2024-01-14 3:30 PM', assignedStaff: 4 }
    ],
    payments: [
        { paymentID: 1, orderID: 1001, amount: 1356, method: 'card', paymentDate: '2024-01-10', status: 'completed' },
        { paymentID: 2, orderID: 1002, amount: 165, method: 'card', paymentDate: '2024-01-12', status: 'completed' }
    ]
};

let currentUser = null;
let currentCart = [];

// =====================================================
// DATA PERSISTENCE - LocalStorage
// =====================================================

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem('rdc_systemData', JSON.stringify(systemData));
    } catch (e) {
        console.error('Failed to save data:', e);
    }
}

// Load data from localStorage
function loadData() {
    try {
        const saved = localStorage.getItem('rdc_systemData');
        if (saved) {
            const parsedData = JSON.parse(saved);
            // Merge with existing data to preserve structure
            Object.assign(systemData, parsedData);
        }
    } catch (e) {
        console.error('Failed to load data:', e);
    }
    return systemData;
}

// Initialize data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadData();
});

// Auto-save on interval
setInterval(saveData, 5000);
