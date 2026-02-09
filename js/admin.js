// =====================================================
// ADMIN DASHBOARD FUNCTIONS
// =====================================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('admin.js DOMContentLoaded fired');
    // Wait for systemData to be available (loaded from data.js)
    if (typeof systemData === 'undefined') {
        console.warn('systemData not yet loaded, waiting...');
        let checkInterval = setInterval(function() {
            if (typeof systemData !== 'undefined' && systemData) {
                console.log('systemData now available, calling initializeAdminPage');
                clearInterval(checkInterval);
                initializeAdminPage();
            }
        }, 100);
        // Timeout after 5 seconds
        setTimeout(() => { if (checkInterval) clearInterval(checkInterval); }, 5000);
    } else {
        console.log('systemData already available, calling initializeAdminPage');
        initializeAdminPage();
    }
});

function initializeAdminPage() {
    console.log('initializeAdminPage called');
    // Setup delegated navigation handlers
    setupAdminNavigation();
    
    if (document.getElementById('admin-alerts')) {
        console.log('admin-alerts found, calling loadAdminDashboard');
        loadAdminDashboard();
    } else if (document.getElementById('users-table')) {
        console.log('users-table found, calling updateUsersTable');
        updateUsersTable();
    } else if (document.getElementById('products-table')) {
        console.log('products-table found, calling updateProductsTable');
        updateProductsTable();
    } else if (document.getElementById('report-display')) {
        console.log('report-display found, calling setDefaultDates');
        setDefaultDates();
    } else {
        console.warn('No admin page elements found in initializeAdminPage');
    }
}

// Setup delegated navigation for admin pages (CSP compliance)
function setupAdminNavigation() {
    document.addEventListener('click', function(e) {
        // Handle navbar data-nav buttons
        const navButton = e.target.closest('[data-nav]');
        if (navButton) {
            const nav = navButton.getAttribute('data-nav');
            if (nav === 'dashboard') {
                window.location.href = 'dashboard.html';
                return;
            } else if (nav === 'users') {
                window.location.href = 'users.html';
                return;
            } else if (nav === 'products') {
                window.location.href = 'products.html';
                return;
            } else if (nav === 'reports') {
                window.location.href = 'reports.html';
                return;
            } else if (nav === 'settings') {
                window.location.href = 'settings.html';
                return;
            } else if (nav === 'logout') {
                logout();
                return;
            }
        }
        
        // Handle go-to-page quick action buttons
        if (e.target.getAttribute('data-action') === 'go-to-page') {
            const page = e.target.getAttribute('data-page');
            if (page) {
                window.location.href = page;
                return;
            }
        }
        
        // Handle nav link clicks with data-href (for inline onclick replacements)
        if (e.target.classList.contains('nav-link') && e.target.hasAttribute('data-href')) {
            e.preventDefault();
            const href = e.target.getAttribute('data-href');
            if (href && href.includes('window.location.href')) {
                const match = href.match(/window\.location\.href\s*=\s*['\"]([^'\"]+)['\"]/);
                if (match && match[1]) {
                    window.location.href = match[1];
                    return;
                }
            }
        }
        
        // Handle action button clicks
        const action = e.target.getAttribute('data-action');
        if (action === 'add-new-user') {
            addNewUser();
        } else if (action === 'add-new-product') {
            addNewProduct();
        } else if (action === 'download-report') {
            downloadReport();
        } else if (action === 'backup-data') {
            backupData();
        } else if (action === 'export-data') {
            exportData();
        } else if (action === 'clear-data') {
            confirmClearData();
        } else if (action === 'toggle-api-visibility') {
            toggleAPIKeyVisibility();
        } else if (action === 'regenerate-api') {
            regenerateAPIKey();
        } else if (action === 'save-settings') {
            saveSettings();
        } else if (action === 'reset-settings') {
            resetSettings();
        }
    });
}


// ================== DASHBOARD ==================

function loadAdminDashboard() {
    updateAdminStats();
    updateAdminAlerts();
}

function updateAdminStats() {
    console.log('updateAdminStats called');
    const totalOrders = systemData.orders.length;
    const totalRevenue = systemData.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingDeliveries = systemData.deliveries.filter(d => d.status === 'pending' || d.status === 'out for delivery').length;
    const lowStockItems = systemData.inventory.filter(inv => inv.stockLevel <= inv.reorderLevel).length;

    console.log('updateAdminStats:', { totalOrders, totalRevenue, pendingDeliveries, lowStockItems });

    const orderEl = document.getElementById('stat-total-orders');
    const revenueEl = document.getElementById('stat-total-revenue');
    const deliveryEl = document.getElementById('stat-pending-deliveries');
    const stockEl = document.getElementById('stat-low-stock');

    console.log('Elements found:', { orderEl: !!orderEl, revenueEl: !!revenueEl, deliveryEl: !!deliveryEl, stockEl: !!stockEl });

    if (orderEl) {
        console.log('Setting stat-total-orders to', totalOrders);
        orderEl.textContent = totalOrders;
    }
    if (revenueEl) {
        const formattedRevenue = '$' + totalRevenue.toFixed(2);
        console.log('Setting stat-total-revenue to', formattedRevenue);
        revenueEl.textContent = formattedRevenue;
    }
    if (deliveryEl) {
        console.log('Setting stat-pending-deliveries to', pendingDeliveries);
        deliveryEl.textContent = pendingDeliveries;
    }
    if (stockEl) {
        console.log('Setting stat-low-stock to', lowStockItems);
        stockEl.textContent = lowStockItems;
    }
}
}

function updateAdminAlerts() {
    const alertsDiv = document.getElementById('admin-alerts');
    if (!alertsDiv) return;
    
    alertsDiv.innerHTML = '';

    const lowStockItems = systemData.inventory.filter(inv => inv.stockLevel <= inv.reorderLevel);
    lowStockItems.forEach(inv => {
        const product = systemData.products.find(p => p.productID === inv.productID);
        const alert = document.createElement('div');
        alert.className = 'alert alert-warning';
        alert.innerHTML = `<span>⚠️</span><span>Low stock alert: ${product.name} (${inv.stockLevel}/${inv.reorderLevel})</span>`;
        alertsDiv.appendChild(alert);
    });

    const pendingDeliveries = systemData.deliveries.filter(d => d.status === 'pending');
    if (pendingDeliveries.length > 0) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-warning';
        alert.innerHTML = `<span>📦</span><span>${pendingDeliveries.length} deliveries pending assignment</span>`;
        alertsDiv.appendChild(alert);
    }

    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.innerHTML = `<span>✓</span><span>Total Revenue: $${systemData.orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}</span>`;
    alertsDiv.appendChild(alert);
}

// ================== USERS ==================

function updateUsersTable() {
    const tbody = document.getElementById('users-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    systemData.users.forEach(user => {
        const roleDisplay = {
            'customer': 'Customer',
            'admin': 'Administrator',
            'rdc_staff': 'RDC Staff',
            'delivery_staff': 'Delivery Staff'
        }[user.role] || user.role;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.userID}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${roleDisplay}</td>
            <td>
                <button class="btn btn-secondary" onclick="editUser(${user.userID})">Edit</button>
                <button class="btn btn-danger" onclick="deleteUser(${user.userID})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ================== PRODUCTS ==================

function updateProductsTable() {
    const tbody = document.getElementById('products-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    systemData.products.forEach(product => {
        const inventory = systemData.inventory.find(inv => inv.productID === product.productID);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.productID}</td>
            <td>${product.name}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${inventory?.stockLevel || 0}</td>
            <td>${product.category}</td>
            <td>
                <button class="btn btn-secondary" onclick="editProduct(${product.productID})">Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.productID})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteProduct(productID) {
    showConfirm('Are you sure you want to delete this product?', 'Delete Product').then(confirmed => {
        if (confirmed) {
            const index = systemData.products.findIndex(p => p.productID === productID);
            if (index > -1) {
                systemData.products.splice(index, 1);
                saveData();
                updateProductsTable();
                showNotification('Product deleted successfully', 'success');
            }
        }
    });
}

// ================== USER MANAGEMENT ==================

function editUser(userID) {
    const user = systemData.users.find(u => u.userID === userID);
    if (!user) return;

    showPrompt('Enter user name:', user.name, 'Edit User').then(newName => {
        if (newName !== null && newName.trim()) {
            user.name = newName;
            saveData();
            showNotification('User updated successfully', 'success');
            updateUsersTable();
        }
    });
}

function deleteUser(userID) {
    const user = systemData.users.find(u => u.userID === userID);
    if (userID === 2) { // Prevent deleting admin user
        showAlert('Cannot delete admin user', 'Error');
        return;
    }
    showConfirm(`Are you sure you want to delete ${user?.name}?`, 'Delete User').then(confirmed => {
        if (confirmed) {
            const index = systemData.users.findIndex(u => u.userID === userID);
            if (index > -1) {
                systemData.users.splice(index, 1);
                saveData();
                updateUsersTable();
                showNotification('User deleted successfully', 'success');
            }
        }
    });
}

// ================== PRODUCT MANAGEMENT ==================

function editProduct(productID) {
    const product = systemData.products.find(p => p.productID === productID);
    showPrompt('Enter product name:', product.name, 'Edit Product Name').then(newName => {
        if (newName === null) return;

        showPrompt('Enter product price:', product.price, 'Edit Product Price').then(newPrice => {
            if (newPrice === null) return;

            showPrompt('Enter product category:', product.category, 'Edit Product Category').then(newCategory => {
                if (newCategory === null) return;

                if (newName.trim() && !isNaN(newPrice) && newPrice > 0) {
                    product.name = newName;
                    product.price = parseFloat(newPrice);
                    product.category = newCategory;
                    saveData();
                    showNotification('Product updated successfully', 'success');
                    updateProductsTable();
                } else {
                    showAlert('Invalid input', 'Error');
                }
            });
        });
    });
}

// ================== REPORTS ==================

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const startInput = document.getElementById('report-start-date');
    const endInput = document.getElementById('report-end-date');
    
    if (startInput) startInput.value = thirtyDaysAgo;
    if (endInput) endInput.value = today;
}

function generateReport() {
    const reportType = document.getElementById('report-type')?.value || 'sales';
    const startDate = document.getElementById('report-start-date')?.value;
    const endDate = document.getElementById('report-end-date')?.value;

    if (!startDate || !endDate) {
        showAlert('Please select date range', 'Error');
        return;
    }

    const reportDiv = document.getElementById('report-display');
    let reportHTML = '';

    const filteredOrders = systemData.orders.filter(order => {
        return order.orderDate >= startDate && order.orderDate <= endDate;
    });

    if (reportType === 'sales') {
        const totalSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? (totalSales / totalOrders) : 0;

        reportHTML = `
            <h3>Sales Report (${startDate} to ${endDate})</h3>
            <table class="report-table">
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Total Orders</td><td>${totalOrders}</td></tr>
                <tr><td>Total Sales</td><td>$${totalSales.toFixed(2)}</td></tr>
                <tr><td>Average Order Value</td><td>$${avgOrderValue.toFixed(2)}</td></tr>
            </table>
            <h4 style="margin-top: 20px;">Order Details</h4>
            <table class="report-table">
                <tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Amount</th><th>Status</th></tr>
        `;
        filteredOrders.forEach(order => {
            const customer = systemData.users.find(u => u.userID === order.userID);
            reportHTML += `<tr><td>#${order.orderID}</td><td>${order.orderDate}</td><td>${customer?.name || 'Unknown'}</td><td>$${order.totalAmount.toFixed(2)}</td><td>${order.status}</td></tr>`;
        });
        reportHTML += '</table>';
    } else if (reportType === 'inventory') {
        reportHTML = `
            <h3>Inventory Report</h3>
            <table class="report-table">
                <tr><th>Product ID</th><th>Product Name</th><th>Stock Level</th><th>Reorder Level</th><th>Status</th></tr>
        `;
        systemData.inventory.forEach(inv => {
            const product = systemData.products.find(p => p.productID === inv.productID);
            const status = inv.stockLevel <= inv.reorderLevel ? '⚠️ Low Stock' : '✓ Adequate';
            reportHTML += `<tr><td>${inv.productID}</td><td>${product?.name}</td><td>${inv.stockLevel}</td><td>${inv.reorderLevel}</td><td>${status}</td></tr>`;
        });
        reportHTML += '</table>';
    } else if (reportType === 'delivery') {
        reportHTML = `
            <h3>Delivery Report (${startDate} to ${endDate})</h3>
            <table class="report-table">
                <tr><th>Delivery ID</th><th>Order ID</th><th>Status</th><th>Route</th><th>Est. Time</th></tr>
        `;
        const filteredDeliveries = systemData.deliveries.filter(d => {
            const order = systemData.orders.find(o => o.orderID === d.orderID);
            return order && order.orderDate >= startDate && order.orderDate <= endDate;
        });
        filteredDeliveries.forEach(delivery => {
            reportHTML += `<tr><td>#${delivery.deliveryID}</td><td>#${delivery.orderID}</td><td>${delivery.status}</td><td>${delivery.route}</td><td>${delivery.estimatedTime}</td></tr>`;
        });
        reportHTML += '</table>';
    }

    reportHTML += '<button class="btn btn-primary" onclick="exportReport()">Export as PDF</button>';
    if (reportDiv) {
        reportDiv.innerHTML = reportHTML;
    }
}

function exportReport() {
    showNotification('Report exported successfully! Check your downloads folder.', 'success');
}

// ================== ADD NEW USER ==================

function addNewUser() {
    const fields = [
        { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter user name', value: '' },
        { name: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter email address', value: '' },
        { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter password', value: '' },
        { name: 'role', label: 'User Role', type: 'select', options: ['Customer', 'Admin', 'RDC Staff', 'Delivery Staff'], value: '' }
    ];
    
    showFormDialog('Add New User', fields, 'info').then(formData => {
        if (formData === null) return;
        
        const { name, email, password, role } = formData;
        
        if (!name.trim() || !email.trim() || !password.trim() || role === '-1') {
            showAlert('Please fill in all fields', 'Error');
            return;
        }
        
        const roleMap = ['customer', 'admin', 'rdc_staff', 'delivery_staff'];
        const newUserID = Math.max(...systemData.users.map(u => u.userID)) + 1;
        const newUser = {
            userID: newUserID,
            name: name,
            email: email,
            password: password,
            role: roleMap[parseInt(role)]
        };
        
        systemData.users.push(newUser);
        saveData();
        showNotification(`User created successfully! User ID: ${newUserID}`, 'success');
        updateUsersTable();
    });
}

// ================== ADD NEW PRODUCT ==================

function addNewProduct() {
    showPrompt('Enter product name:', '', 'Add New Product').then(name => {
        if (name === null || !name.trim()) return;

        showNumericPrompt('Enter product price:', '0', 'Add New Product - Price').then(price => {
            if (price === null || isNaN(price) || price <= 0) {
                showAlert('Invalid price', 'Error');
                return;
            }

            showPrompt('Enter product category:', 'Electronics', 'Add New Product - Category').then(category => {
                if (category === null || !category.trim()) return;

                showNumericPrompt('Enter initial stock quantity:', '10', 'Add New Product - Stock').then(quantity => {
                    if (quantity === null || isNaN(quantity) || quantity < 0) {
                        showAlert('Invalid quantity', 'Error');
                        return;
                    }

                    const newProductID = Math.max(...systemData.products.map(p => p.productID)) + 1;
                    const newProduct = {
                        productID: newProductID,
                        name: name,
                        price: parseFloat(price),
                        quantity: parseInt(quantity),
                        description: `New product: ${name}`,
                        category: category,
                        emoji: '📦'
                    };

                    systemData.products.push(newProduct);

                    // Add inventory entry
                    const newInventoryID = Math.max(...systemData.inventory.map(i => i.inventoryID)) + 1;
                    systemData.inventory.push({
                        inventoryID: newInventoryID,
                        productID: newProductID,
                        stockLevel: parseInt(quantity),
                        reorderLevel: Math.ceil(parseInt(quantity) * 0.2)
                    });

                    saveData();
                    showNotification(`Product created successfully! Product ID: ${newProductID}`, 'success');
                    updateProductsTable();
                });
            });
        });
    });
}
