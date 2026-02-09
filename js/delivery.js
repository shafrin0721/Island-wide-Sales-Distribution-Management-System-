// =====================================================
// DELIVERY STAFF FUNCTIONS
// =====================================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateDeliveryStaffTable();
    // Auto-refresh every 30 seconds but only when page is visible; avoid overlapping runs
    (function() {
        let deliveryTimer = null;
        function startTimer() {
            if (deliveryTimer) return;
            deliveryTimer = setInterval(function() {
                if (document.hidden) return;
                try { updateDeliveryStaffTable(); } catch (e) { console.error(e); }
            }, 30000);
        }
        function stopTimer() {
            if (deliveryTimer) { clearInterval(deliveryTimer); deliveryTimer = null; }
        }

        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                // run an immediate update when tab becomes visible
                try { updateDeliveryStaffTable(); } catch (e) { console.error(e); }
                startTimer();
            } else {
                stopTimer();
            }
        });

        // start when script runs
        if (!document.hidden) startTimer();
    })();
});

function updateDeliveryStaffTable() {
    const tbody = document.getElementById('delivery-staff-table');
    if (!tbody) return;

    const assignedDeliveries = systemData.deliveries.filter(d => d.assignedStaff === currentUser.userID);

    if (assignedDeliveries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #999;">No deliveries assigned</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    assignedDeliveries.forEach(delivery => {
        const order = systemData.orders.find(o => o.orderID === delivery.orderID);
        const customer = systemData.users.find(u => u.userID === order?.userID);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${delivery.deliveryID}</td>
            <td>#${delivery.orderID}</td>
            <td>${customer?.name || 'Unknown'}</td>
            <td>${order?.shippingInfo?.address || 'N/A'}</td>
            <td><span class="order-status status-${delivery.status}">${delivery.status}</span></td>
            <td>${delivery.estimatedTime}</td>
            <td>
                <button class="btn btn-primary" onclick="updateDeliveryStatus(${delivery.deliveryID})">Update</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateDeliveryStatus(deliveryID) {
    const delivery = systemData.deliveries.find(d => d.deliveryID === deliveryID);
    const statuses = ['assigned', 'out for delivery', 'delivered', 'failed'];
    const currentIndex = statuses.indexOf(delivery.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    const confirmed = confirm(`Update delivery status to "${nextStatus}"?`);
    if (confirmed) {
        delivery.status = nextStatus;
        
        if (nextStatus === 'delivered') {
            const order = systemData.orders.find(o => o.orderID === delivery.orderID);
            order.status = 'delivered';
        }

        alert(`Delivery #${deliveryID} status updated to ${nextStatus}`);
        updateDeliveryStaffTable();
    }
}
