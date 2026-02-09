// =====================================================
// RDC STAFF FUNCTIONS
// =====================================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Wait for systemData to be available (loaded from data.js)
    if (typeof systemData === 'undefined') {
        console.warn('systemData not yet loaded, waiting...');
        let checkInterval = setInterval(function() {
            if (typeof systemData !== 'undefined' && systemData) {
                clearInterval(checkInterval);
                initializeRDCPage();
            }
        }, 100);
        // Timeout after 5 seconds
        setTimeout(() => { if (checkInterval) clearInterval(checkInterval); }, 5000);
    } else {
        initializeRDCPage();
    }
});

function initializeRDCPage() {
    setupRDCNavigation();
    
    if (document.getElementById('rdc-pending-orders')) {
        loadRDCDashboard();
    } else if (document.getElementById('rdc-orders-table')) {
        updateRDCOrdersTable();
    } else if (document.getElementById('rdc-inventory-table')) {
        updateRDCInventoryTable();
    } else if (document.getElementById('rdc-delivery-table')) {
        updateRDCDeliveryTable();
    }
}

// Setup delegated navigation for RDC pages (CSP compliance)
function setupRDCNavigation() {
    document.addEventListener('click', function(e) {
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
        
        // Handle action buttons
        const action = e.target.getAttribute('data-action');
        if (action === 'add-stock') {
            alert('Add stock feature coming soon');
        }
    });
}

// ================== DASHBOARD ==================

function loadRDCDashboard() {
    updateRDCStats();
}

function updateRDCStats() {
    const pendingOrders = systemData.orders.filter(o => o.status === 'processing').length;
    const readyDelivery = systemData.orders.filter(o => o.status === 'ready for delivery').length;
    const lowStockItems = systemData.inventory.filter(inv => inv.stockLevel <= inv.reorderLevel).length;
    const unassignedDeliveries = systemData.deliveries.filter(d => d.assignedStaff === null).length;

    if (document.getElementById('rdc-pending-orders')) {
        document.getElementById('rdc-pending-orders').textContent = pendingOrders;
        document.getElementById('rdc-ready-delivery').textContent = readyDelivery;
        document.getElementById('rdc-low-stock').textContent = lowStockItems;
        document.getElementById('rdc-unassigned').textContent = unassignedDeliveries;
    }
}

// ================== ORDERS ==================

function updateRDCOrdersTable() {
    const tbody = document.getElementById('rdc-orders-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    systemData.orders.forEach(order => {
        const customer = systemData.users.find(u => u.userID === order.userID);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${order.orderID}</td>
            <td>${customer?.name || 'Unknown'}</td>
            <td>${customer?.email || ''}</td>
            <td>${customer?.phone || ''}</td>
            <td>${customer?.address || ''}</td>
            <td>${order.orderDate}</td>
            <td>$${order.totalAmount.toFixed(2)}</td>
            <td><span class="order-status status-${order.status}">${order.status}</span></td>
            <td>
                <button class="btn btn-primary" onclick="processRDCOrder(${order.orderID})">Process</button>
                <button class="btn btn-secondary" onclick="editRDCOrder(${order.orderID})">Edit</button>
                <button class="btn btn-danger" onclick="deleteRDCOrder(${order.orderID})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function processRDCOrder(orderID) {
    const order = systemData.orders.find(o => o.orderID === orderID);
    const statuses = ['processing', 'ready for delivery', 'shipped'];
    const currentIndex = statuses.indexOf(order.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    showConfirm(`Mark order as "${nextStatus}"?`, 'Update Order Status').then(confirmed => {
        if (confirmed) {
            order.status = nextStatus;
            saveData();
            showNotification(`Order #${orderID} status updated to ${nextStatus}`, 'success');
            updateRDCOrdersTable();
            updateRDCStats();
        }
    });
}

// ================== INVENTORY ==================

function updateRDCInventoryTable() {
    const tbody = document.getElementById('rdc-inventory-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    systemData.inventory.forEach(inv => {
        const product = systemData.products.find(p => p.productID === inv.productID);
        const status = inv.stockLevel <= inv.reorderLevel ? '🔴 Low Stock' : '🟢 Adequate';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${inv.productID}</td>
            <td>${product?.name}</td>
            <td>${inv.stockLevel}</td>
            <td>${inv.reorderLevel}</td>
            <td>${status}</td>
            <td>
                <button class="btn btn-secondary" onclick="editInventory(${inv.productID})">Edit</button>
                <button class="btn btn-danger" onclick="deleteInventory(${inv.productID})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateInventoryStock(productID) {
    showNumericPrompt('Enter new stock level:', '', 'Update Inventory').then(newStock => {
        if (newStock !== null && !isNaN(newStock)) {
            const inventory = systemData.inventory.find(inv => inv.productID === productID);
            const oldStock = inventory.stockLevel;
            inventory.stockLevel = parseInt(newStock);
            saveData();
            showNotification(`Stock updated from ${oldStock} to ${newStock}`, 'success');
            updateRDCInventoryTable();
            updateRDCStats();
        }
    });
}

// ================== DELIVERY ==================

function updateRDCDeliveryTable() {
    const tbody = document.getElementById('rdc-delivery-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    systemData.deliveries.forEach(delivery => {
        const order = systemData.orders.find(o => o.orderID === delivery.orderID);
        const customer = systemData.users.find(u => u.userID === order?.userID);
        const staff = systemData.users.find(u => u.userID === delivery.assignedStaff);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${delivery.deliveryID}</td>
            <td>#${delivery.orderID}</td>
            <td>${customer?.name || 'Unknown'}</td>
            <td>${customer?.phone || ''}</td>
            <td>${customer?.address || ''}</td>
            <td><span class="order-status status-${delivery.status}">${delivery.status}</span></td>
            <td>${staff?.name || 'Unassigned'}</td>
            <td>
                <button class="btn btn-primary" onclick="assignDelivery(${delivery.deliveryID})">Assign</button>
                <button class="btn btn-secondary" onclick="editDelivery(${delivery.deliveryID})">Edit</button>
                <button class="btn btn-danger" onclick="deleteDelivery(${delivery.deliveryID})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function assignDelivery(deliveryID) {
    const delivery = systemData.deliveries.find(d => d.deliveryID === deliveryID);
    const deliveryStaff = systemData.users.filter(u => u.role === 'delivery_staff');
    
    if (deliveryStaff.length === 0) {
        showAlert('No delivery staff available', 'Warning');
        return;
    }

    const staffOptions = deliveryStaff.map(s => `${s.name} (ID: ${s.userID})`);
    showSelectPrompt('Select delivery staff:', staffOptions, 'Assign Delivery').then(staffIndex => {
        if (staffIndex !== null) {
            const staff = deliveryStaff[staffIndex];
            delivery.assignedStaff = staff.userID;
            delivery.status = 'assigned';
            saveData();
            showNotification(`Delivery #${deliveryID} assigned to ${staff.name}`, 'success');
            updateRDCDeliveryTable();
            updateRDCStats();
        }
    });
}

// ================== DELIVERY EDIT & DELETE ==================

function editDelivery(deliveryID) {
    const delivery = systemData.deliveries.find(d => d.deliveryID === deliveryID);
    if (!delivery) return;

    showPrompt('Enter delivery route:', delivery.route, 'Edit Delivery').then(newRoute => {
        if (newRoute === null) return;

        showPrompt('Enter estimated delivery time:', delivery.estimatedTime, 'Edit Delivery - Time').then(newEstTime => {
            if (newEstTime === null) return;

            delivery.route = newRoute;
            delivery.estimatedTime = newEstTime;
            saveData();
            showNotification('Delivery updated successfully', 'success');
            updateRDCDeliveryTable();
        });
    });
}

function deleteDelivery(deliveryID) {
    showConfirm(`Delete delivery #${deliveryID}?`, 'Delete Delivery').then(confirmed => {
        if (confirmed) {
            const index = systemData.deliveries.findIndex(d => d.deliveryID === deliveryID);
            if (index > -1) {
                systemData.deliveries.splice(index, 1);
                saveData();
                updateRDCDeliveryTable();
                updateRDCStats();
                showNotification('Delivery deleted successfully', 'success');
            }
        }
    });
}

// ================== ORDER EDIT & DELETE ==================

function editRDCOrder(orderID) {
    const order = systemData.orders.find(o => o.orderID === orderID);
    if (!order) return;

    showPrompt('Enter new status (processing/ready for delivery/shipped/delivered):', order.status, 'Edit Order Status').then(newStatus => {
        if (newStatus === null) return;

        order.status = newStatus;
        saveData();
        showNotification(`Order #${orderID} status updated to ${newStatus}`, 'success');
        updateRDCOrdersTable();
        updateRDCStats();
    });
}

function deleteRDCOrder(orderID) {
    showConfirm(`Delete order #${orderID}?`, 'Delete Order').then(confirmed => {
        if (confirmed) {
            const index = systemData.orders.findIndex(o => o.orderID === orderID);
            if (index > -1) {
                systemData.orders.splice(index, 1);
                saveData();
                updateRDCOrdersTable();
                updateRDCStats();
                showNotification('Order deleted successfully', 'success');
            }
        }
    });
}

// ================== INVENTORY EDIT & DELETE ==================

function editInventory(productID) {
    const inventory = systemData.inventory.find(inv => inv.productID === productID);
    const product = systemData.products.find(p => p.productID === productID);
    showNumericPrompt('Enter new stock level:', inventory.stockLevel, 'Edit Inventory').then(newStock => {
        if (newStock === null || isNaN(newStock)) return;

        showNumericPrompt('Enter new reorder level:', inventory.reorderLevel, 'Edit Inventory - Reorder Level').then(newReorder => {
            if (newReorder === null || isNaN(newReorder)) return;

            inventory.stockLevel = parseInt(newStock);
            inventory.reorderLevel = parseInt(newReorder);
            saveData();
            showNotification(`${product.name} inventory updated successfully`, 'success');
            updateRDCInventoryTable();
            updateRDCStats();
        });
    });
}

function deleteInventory(productID) {
    const product = systemData.products.find(p => p.productID === productID);
    showConfirm(`Delete inventory for ${product?.name}?`, 'Delete Inventory').then(confirmed => {
        if (confirmed) {
            const index = systemData.inventory.findIndex(inv => inv.productID === productID);
            if (index > -1) {
                systemData.inventory.splice(index, 1);
                saveData();
                updateRDCInventoryTable();
                showNotification('Inventory deleted successfully', 'success');
            }
        }
    });
}

