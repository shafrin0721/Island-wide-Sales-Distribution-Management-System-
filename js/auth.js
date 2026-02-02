// =====================================================
// AUTHENTICATION & NAVIGATION
// =====================================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Check if user is logged in
    const storedUser = sessionStorage.getItem('currentUser');
    
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        currentCart = JSON.parse(sessionStorage.getItem('currentCart') || '[]');
        updateUserDisplay();
        updateCartBadge();
    } else if (currentPage !== 'index.html') {
        // Redirect to login if not on login page
        window.location.href = '../../index.html';
    }
    
    // Apply theme settings if they exist
    if (typeof applyThemeSettings === 'function') {
        applyThemeSettings();
    }
});

// Handle Login Form
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const user = systemData.users.find(u => (u.email === email || u.name === email) && u.password === password);

        if (user) {
            currentUser = user;
            currentCart = [];
            
            // Store in session
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            sessionStorage.setItem('currentCart', JSON.stringify(currentCart));
            
            // Redirect based on role
            redirectToDashboard(user.role);
        } else {
            alert('Invalid credentials. Please try again.');
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
        }
    });
}

// Redirect to appropriate dashboard
function redirectToDashboard(role) {
    switch(role) {
        case 'customer':
            window.location.href = 'pages/customer/products.html';
            break;
        case 'admin':
            window.location.href = 'pages/admin/dashboard.html';
            break;
        case 'rdc_staff':
            window.location.href = 'pages/rdc/dashboard.html';
            break;
        case 'delivery_staff':
            window.location.href = 'pages/delivery/dashboard.html';
            break;
        default:
            window.location.href = 'index.html';
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentCart');
        currentUser = null;
        currentCart = [];
        window.location.href = '../../index.html';
    }
}

// Navigation helper
function goToPage(pageName) {
    if (!currentUser) {
        alert('Please login first');
        window.location.href = '../../index.html';
        return;
    }
    window.location.href = pageName;
}

// Go to checkout
function goToCheckout() {
    if (currentCart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    goToPage('../customer/checkout.html');
}

// Update user display
function updateUserDisplay() {
    const userDisplay = document.getElementById('current-user');
    if (userDisplay && currentUser) {
        const roleDisplay = {
            'customer': 'Customer',
            'admin': 'Administrator',
            'rdc_staff': 'RDC Staff',
            'delivery_staff': 'Delivery Staff'
        }[currentUser.role] || currentUser.role;
        userDisplay.textContent = `${currentUser.name} (${roleDisplay})`;
    }
}

// Update cart badge
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const total = currentCart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = total;
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
});

// Save session data
function saveSession() {
    sessionStorage.setItem('currentCart', JSON.stringify(currentCart));
}

// Auto-save session
setInterval(saveSession, 10000);
