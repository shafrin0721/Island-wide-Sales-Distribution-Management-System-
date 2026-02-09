// Reports.js - Handle all report generation and display

let currentReportType = 'sales';

// Initialize reports when window fully loads
window.addEventListener('load', function() {
    setTimeout(function() {
        if (document.getElementById('reportChartsContainer')) {
            initializeReportCharts();
            generateSalesSummary();
        }
    }, 300);
});

// Fallback for DOMContentLoaded if needed
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('reportChartsContainer')) {
        // Initialize data
        loadData();
    }
});

function handleReportChange() {
    currentReportType = document.getElementById('report-type').value;
    
    // Hide all report sections
    document.getElementById('sales-report').style.display = 'none';
    document.getElementById('inventory-report').style.display = 'none';
    document.getElementById('delivery-report').style.display = 'none';
    document.getElementById('customer-report').style.display = 'none';
    
    // Show selected report section
    document.getElementById(currentReportType + '-report').style.display = 'block';
}

function generateSalesSummary() {
    const data = loadData();
    const orders = data.orders || [];
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthlyOrders = orders.filter(o => new Date(o.date || today) >= thisMonth);
    const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = monthlyOrders.length > 0 ? monthlyRevenue / monthlyOrders.length : 0;
    
    const content = `
        <div class="summary-grid">
            <div class="summary-item">
                <label>Total Sales (This Month)</label>
                <strong>$${monthlyRevenue.toFixed(2)}</strong>
            </div>
            <div class="summary-item">
                <label>Number of Orders</label>
                <strong>${monthlyOrders.length}</strong>
            </div>
            <div class="summary-item">
                <label>Average Order Value</label>
                <strong>$${avgOrderValue.toFixed(2)}</strong>
            </div>
            <div class="summary-item">
                <label>Total Customers</label>
                <strong>${data.users.filter(u => u.role === 'customer').length}</strong>
            </div>
        </div>
    `;
    document.getElementById('sales-summary-content').innerHTML = content;
}

function generateInventorySummary() {
    const data = loadData();
    const inventory = data.inventory || [];
    
    const totalItems = inventory.length;
    const totalQuantity = inventory.reduce((sum, i) => sum + i.quantity, 0);
    const lowStockItems = inventory.filter(i => i.quantity > 0 && i.quantity < 10).length;
    const outOfStockItems = inventory.filter(i => i.quantity === 0).length;
    
    const content = `
        <div class="summary-grid">
            <div class="summary-item">
                <label>Total Products</label>
                <strong>${totalItems}</strong>
            </div>
            <div class="summary-item">
                <label>Total Quantity in Stock</label>
                <strong>${totalQuantity} units</strong>
            </div>
            <div class="summary-item">
                <label>Low Stock Items</label>
                <strong>${lowStockItems}</strong>
            </div>
            <div class="summary-item">
                <label>Out of Stock Items</label>
                <strong>${outOfStockItems}</strong>
            </div>
        </div>
    `;
    document.getElementById('inventory-summary-content').innerHTML = content;
}

function generateDeliverySummary() {
    const data = loadData();
    const deliveries = data.deliveries || [];
    
    const totalDeliveries = deliveries.length;
    const delivered = deliveries.filter(d => d.status === 'Delivered').length;
    const inTransit = deliveries.filter(d => d.status === 'In Transit').length;
    const pending = deliveries.filter(d => d.status === 'Pending').length;
    
    const deliveryRate = totalDeliveries > 0 ? ((delivered / totalDeliveries) * 100).toFixed(1) : 0;
    
    const content = `
        <div class="summary-grid">
            <div class="summary-item">
                <label>Total Deliveries</label>
                <strong>${totalDeliveries}</strong>
            </div>
            <div class="summary-item">
                <label>Delivered</label>
                <strong>${delivered}</strong>
            </div>
            <div class="summary-item">
                <label>In Transit</label>
                <strong>${inTransit}</strong>
            </div>
            <div class="summary-item">
                <label>Delivery Success Rate</label>
                <strong>${deliveryRate}%</strong>
            </div>
        </div>
    `;
    document.getElementById('delivery-summary-content').innerHTML = content;
}

function generateCustomerSummary() {
    const data = loadData();
    const customers = data.users.filter(u => u.role === 'customer');
    const orders = data.orders || [];
    
    const totalCustomers = customers.length;
    const totalOrders = orders.length;
    const avgOrdersPerCustomer = totalCustomers > 0 ? (totalOrders / totalCustomers).toFixed(2) : 0;
    const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    const content = `
        <div class="summary-grid">
            <div class="summary-item">
                <label>Total Customers</label>
                <strong>${totalCustomers}</strong>
            </div>
            <div class="summary-item">
                <label>Total Orders</label>
                <strong>${totalOrders}</strong>
            </div>
            <div class="summary-item">
                <label>Avg Orders per Customer</label>
                <strong>${avgOrdersPerCustomer}</strong>
            </div>
            <div class="summary-item">
                <label>Total Revenue from Customers</label>
                <strong>$${totalSpent.toFixed(2)}</strong>
            </div>
        </div>
    `;
    document.getElementById('customer-summary-content').innerHTML = content;
}

function downloadReport() {
    console.log('downloadReport called');
    const reportType = document.getElementById('report-type').value;
    console.log('Report type:', reportType);
    const data = loadData();
    console.log('Data loaded:', data);
    let csvContent = '';
    let fileName = `${reportType}-report.csv`;
    
    if (reportType === 'sales') {
        csvContent = generateSalesReportCSV(data.orders);
        console.log('Sales CSV generated, length:', csvContent.length);
    } else if (reportType === 'inventory') {
        csvContent = generateInventoryReportCSV(data.inventory);
    } else if (reportType === 'delivery') {
        csvContent = generateDeliveryReportCSV(data.deliveries);
    }
    
    downloadCSV(csvContent, fileName);
}

function generateSalesReportCSV(orders) {
    let csv = 'Order ID,Date,User ID,Total Amount,Status\n';
    orders.forEach(order => {
        csv += `${order.orderID},${order.orderDate || 'N/A'},${order.userID || 'N/A'},${order.totalAmount || 0},${order.status || 'N/A'}\n`;
    });
    return csv;
}

function generateInventoryReportCSV(inventory) {
    let csv = 'Inventory ID,Product ID,Stock Level,Reorder Level,Status\n';
    inventory.forEach(item => {
        const status = item.stockLevel === 0 ? 'Out of Stock' : item.stockLevel < 10 ? 'Low Stock' : 'In Stock';
        csv += `${item.inventoryID},${item.productID},${item.stockLevel},${item.reorderLevel || 10},${status}\n`;
    });
    return csv;
}

function generateDeliveryReportCSV(deliveries) {
    let csv = 'Delivery ID,Order ID,Status,Route,Estimated Time\n';
    deliveries.forEach(delivery => {
        csv += `${delivery.deliveryID},${delivery.orderID || 'N/A'},${delivery.status || 'N/A'},${delivery.route || 'N/A'},${delivery.estimatedTime || 'N/A'}\n`;
    });
    return csv;
}

function downloadCSV(csvContent, fileName) {
    console.log('downloadCSV called with file:', fileName, 'content length:', csvContent.length);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    console.log('Blob created, size:', blob.size);
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    console.log('Object URL created:', url);
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    console.log('Link appended to body, clicking...');
    link.click();
    console.log('Link clicked');
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

function initializeReportCharts() {
    try {
        const data = loadData();
        console.log('Report charts initializing, data:', data);
        
        // Sales trend chart
        if (document.getElementById('salesTrendChart')) {
            const salesCanvas = document.getElementById('salesTrendChart');
            salesCanvas.width = salesCanvas.offsetWidth;
            salesCanvas.height = salesCanvas.offsetHeight || 300;
            const salesCtx = salesCanvas.getContext('2d');
            new Chart(salesCtx, {
                type: 'line',
                data: {
                    labels: getLast30Days(),
                    datasets: [{
                        label: 'Daily Sales',
                        data: getSalesByDay(data.orders, 30),
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true } },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
            console.log('Sales trend chart created');
            generateSalesSummary();
        }
        
        // Product performance chart
        if (document.getElementById('productPerformanceChart')) {
            const perfCanvas = document.getElementById('productPerformanceChart');
            perfCanvas.width = perfCanvas.offsetWidth;
            perfCanvas.height = perfCanvas.offsetHeight || 300;
            const topProducts = getTopProductsByRevenue(data.orders, data.products, 8);
            const perfCtx = perfCanvas.getContext('2d');
            new Chart(perfCtx, {
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
                    scales: {
                        x: { ticks: { callback: (v) => '$' + v } }
                    }
                }
            });
            console.log('Product performance chart created');
        }
        
        // Inventory status chart
        if (document.getElementById('inventoryStatusChart')) {
            const invCanvas = document.getElementById('inventoryStatusChart');
            invCanvas.width = invCanvas.offsetWidth;
            invCanvas.height = invCanvas.offsetHeight || 300;
            const inventoryData = getInventoryStatus(data.inventory);
            const invCtx = invCanvas.getContext('2d');
            new Chart(invCtx, {
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
                plugins: { legend: { position: 'bottom' } }
            }
        });
        console.log('Inventory status chart created');
        generateInventorySummary();
    }
    
    // Delivery performance chart
    if (document.getElementById('deliveryPerformanceChart')) {
        const delCanvas = document.getElementById('deliveryPerformanceChart');
        delCanvas.width = delCanvas.offsetWidth;
        delCanvas.height = delCanvas.offsetHeight || 300;
        const deliveryData = getDeliveryPerformance(data.deliveries);
        const delCtx = delCanvas.getContext('2d');
        new Chart(delCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(deliveryData),
                datasets: [{
                    data: Object.values(deliveryData),
                    backgroundColor: ['#4CAF50', '#FFC107', '#FF6B6B']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
        console.log('Delivery performance chart created');
        generateDeliverySummary();
    }
    
    // Customer activity chart
    if (document.getElementById('customerActivityChart')) {
        const custCanvas = document.getElementById('customerActivityChart');
        custCanvas.width = custCanvas.offsetWidth;
        custCanvas.height = custCanvas.offsetHeight || 300;
        const customerCtx = custCanvas.getContext('2d');
        new Chart(customerCtx, {
            type: 'line',
            data: {
                labels: getLast30Days(),
                datasets: [{
                    label: 'Customer Orders',
                    data: getSalesByDay(data.orders, 30),
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true } }
            }
        });
        console.log('Customer activity chart created');
        generateCustomerSummary();
    }
    } catch (error) {
        console.error('Error initializing report charts:', error);
    }
}
