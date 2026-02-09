// Charts.js - Initialize and manage all dashboard and report charts

let revenueChart, statusChart, productsChart, inventoryChart;

// Initialize all charts when page fully loads
window.addEventListener('load', function() {
    console.log('Charts initializing on window load...');
    
    // Ensure data is loaded
    loadData();
    
    // Small delay to ensure all DOM elements are ready
    setTimeout(function() {
        // Check if we're on admin dashboard
        if (document.getElementById('revenueChart')) {
            console.log('Initializing admin dashboard charts...');
            initializeAdminDashboardCharts();
            updateAdminDashboard();
        }
    }, 300);
});

// Also initialize on DOMContentLoaded as backup
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - charts.js ready');
});

// ===== ADMIN DASHBOARD CHARTS =====

function initializeAdminDashboardCharts() {
    try {
        const data = loadData();
        console.log('Data loaded:', data);
        
        // Revenue Trend Chart (Last 7 days)
        const revenueCanvas = document.getElementById('revenueChart');
        if (revenueCanvas) {
            console.log('Revenue canvas found, initializing...');
            revenueCanvas.width = revenueCanvas.offsetWidth;
            revenueCanvas.height = revenueCanvas.offsetHeight;
            const revenueCtx = revenueCanvas.getContext('2d');
            revenueChart = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: getLast7Days(),
                    datasets: [{
                        label: 'Daily Revenue ($)',
                        data: getRevenueByDay(data.orders),
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 5,
                        pointBackgroundColor: '#4CAF50'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { callback: (v) => '$' + v } }
                    }
                }
            });
            console.log('Revenue chart created successfully');
        } else {
            console.warn('Revenue canvas not found!');
        }

        // Order Status Distribution (Pie Chart)
        const statusCanvas = document.getElementById('statusChart');
        if (statusCanvas) {
            console.log('Status canvas found, initializing...');
            statusCanvas.width = statusCanvas.offsetWidth;
            statusCanvas.height = statusCanvas.offsetHeight;
            const statusCtx = statusCanvas.getContext('2d');
            const statusData = getOrderStatusDistribution(data.orders);
            statusChart = new Chart(statusCtx, {
                type: 'pie',
                data: {
                    labels: Object.keys(statusData),
                    datasets: [{
                        data: Object.values(statusData),
                        backgroundColor: ['#4CAF50', '#FFC107', '#FF6B6B', '#2196F3']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
            console.log('Status chart created successfully');
        } else {
            console.warn('Status canvas not found!');
        }

        // Top Products by Revenue (Bar Chart)
        const productsCanvas = document.getElementById('productsChart');
        if (productsCanvas) {
            console.log('Products canvas found, initializing...');
            productsCanvas.width = productsCanvas.offsetWidth;
            productsCanvas.height = productsCanvas.offsetHeight;
            const productsCtx = productsCanvas.getContext('2d');
            const topProducts = getTopProductsByRevenue(data.orders, data.products, 5);
            productsChart = new Chart(productsCtx, {
                type: 'bar',
                data: {
                    labels: topProducts.names,
                    datasets: [{
                        label: 'Revenue ($)',
                        data: topProducts.revenues,
                        backgroundColor: '#2196F3'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { ticks: { callback: (v) => '$' + v } }
                    }
                }
            });
            console.log('Products chart created successfully');
        } else {
            console.warn('Products canvas not found!');
        }

        // Inventory Status (Doughnut Chart)
        const inventoryCanvas = document.getElementById('inventoryChart');
        if (inventoryCanvas) {
            console.log('Inventory canvas found, initializing...');
            inventoryCanvas.width = inventoryCanvas.offsetWidth;
            inventoryCanvas.height = inventoryCanvas.offsetHeight;
            const inventoryCtx = inventoryCanvas.getContext('2d');
            const inventoryData = getInventoryStatus(data.inventory);
            inventoryChart = new Chart(inventoryCtx, {
                type: 'doughnut',
                data: {
                    labels: ['In Stock', 'Low Stock', 'Out of Stock'],
                    datasets: [{
                        data: inventoryData,
                        backgroundColor: ['#4CAF50', '#FFC107', '#FF6B6B']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
            console.log('Inventory chart created successfully');
        } else {
            console.warn('Inventory canvas not found!');
        }
    } catch (error) {
        console.error('Error initializing dashboard charts:', error);
    }
}

function updateAdminDashboard() {
    const data = loadData();
    const orders = data.orders || [];
    const products = data.products || [];
    const inventory = data.inventory || [];
    const deliveries = data.deliveries || [];

    // Update stat cards
    document.getElementById('stat-total-orders').textContent = orders.length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    document.getElementById('stat-total-revenue').textContent = '$' + totalRevenue.toFixed(2);
    
    const pendingDeliveries = deliveries.filter(d => d.status !== 'Delivered').length;
    document.getElementById('stat-pending-deliveries').textContent = pendingDeliveries;
    
    const lowStock = inventory.filter(i => i.quantity < 10).length;
    document.getElementById('stat-low-stock').textContent = lowStock;

    // Update alerts
    updateAlerts(data);
}

function updateAlerts(data) {
    const alertsDiv = document.getElementById('admin-alerts');
    alertsDiv.innerHTML = '';

    const alerts = [];

    // Check for low stock
    const lowStock = data.inventory.filter(i => i.quantity < 10);
    if (lowStock.length > 0) {
        alerts.push({
            type: 'warning',
            message: `${lowStock.length} products have low stock levels`
        });
    }

    // Check for pending orders
    const pendingOrders = data.orders.filter(o => o.status === 'Pending');
    if (pendingOrders.length > 0) {
        alerts.push({
            type: 'info',
            message: `${pendingOrders.length} orders are pending processing`
        });
    }

    // Check for pending deliveries
    const pendingDeliveries = data.deliveries.filter(d => d.status !== 'Delivered');
    if (pendingDeliveries.length > 0) {
        alerts.push({
            type: 'info',
            message: `${pendingDeliveries.length} deliveries are in progress`
        });
    }

    if (alerts.length === 0) {
        alertsDiv.innerHTML = '<p style="color: #4CAF50;">✓ No alerts. System operating normally.</p>';
    } else {
        alerts.forEach(alert => {
            const alertEl = document.createElement('div');
            alertEl.className = `alert alert-${alert.type}`;
            alertEl.textContent = alert.message;
            alertsDiv.appendChild(alertEl);
        });
    }
}

// ===== HELPER FUNCTIONS =====

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return days;
}

function getLast30Days() {
    const days = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return days;
}

function getRevenueByDay(orders) {
    const revenue = Array(7).fill(0);
    const today = new Date();
    
    orders.forEach(order => {
        const orderDate = new Date(order.orderDate || order.date || today);
        const daysAgo = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));
        
        if (daysAgo >= 0 && daysAgo < 7) {
            revenue[6 - daysAgo] += order.totalAmount || order.total || 0;
        }
    });
    
    return revenue.map(r => Math.round(r * 100) / 100);
}

function getSalesByDay(orders, days) {
    const sales = Array(days).fill(0);
    const today = new Date();
    
    orders.forEach(order => {
        const orderDate = new Date(order.orderDate || order.date || today);
        const daysAgo = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));
        
        if (daysAgo >= 0 && daysAgo < days) {
            sales[days - 1 - daysAgo] += 1;
        }
    });
    
    return sales;
}

function getOrderStatusDistribution(orders) {
    const distribution = {
        'pending': 0,
        'processing': 0,
        'shipped': 0,
        'delivered': 0
    };
    
    orders.forEach(order => {
        const status = (order.status || 'pending').toLowerCase();
        if (distribution.hasOwnProperty(status)) {
            distribution[status]++;
        } else {
            distribution[status] = 1;
        }
    });
    
    return distribution;
}

function getTopProductsByRevenue(orders, products, limit) {
    const productRevenue = {};
    
    orders.forEach(order => {
        (order.items || []).forEach(item => {
            if (!productRevenue[item.productID]) {
                productRevenue[item.productID] = 0;
            }
            productRevenue[item.productID] += item.subtotal || 0;
        });
    });
    
    const sorted = Object.entries(productRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
    
    return {
        names: sorted.map(entry => {
            const product = products.find(p => p.productID === parseInt(entry[0]));
            return product ? product.name : 'Unknown';
        }),
        revenues: sorted.map(entry => Math.round(entry[1] * 100) / 100)
    };
}

function getInventoryStatus(inventory) {
    const inStock = inventory.filter(i => i.stockLevel > 10).length;
    const lowStock = inventory.filter(i => i.stockLevel > 0 && i.stockLevel <= 10).length;
    const outOfStock = inventory.filter(i => i.stockLevel === 0).length;
    
    return [inStock, lowStock, outOfStock];
}

function getDeliveryPerformance(deliveries) {
    const delivered = deliveries.filter(d => d.status && d.status.toLowerCase() === 'delivered').length;
    const inTransit = deliveries.filter(d => d.status && d.status.toLowerCase().includes('transit')).length;
    const pending = deliveries.filter(d => d.status && !d.status.toLowerCase().includes('delivered') && !d.status.toLowerCase().includes('transit')).length;
    
    return {
        'Delivered': delivered,
        'In Transit': inTransit,
        'Pending': pending
    };
}
