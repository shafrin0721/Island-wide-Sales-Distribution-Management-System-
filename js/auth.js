// =====================================================
// AUTHENTICATION & NAVIGATION
// =====================================================

// Safe API URL detection for localhost vs hosted site
const API_URL = (function() {
    try {
        if (typeof location !== 'undefined') {
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                return 'http://localhost:5000/api';
            }
        }
    } catch (e) {
        console.warn('Location not defined, defaulting to hosted API:', e);
    }
    return '/api';
})();

// =====================================================
// GLOBAL STATE
// =====================================================
let currentUser = null;
let currentCart = [];

// =====================================================
// INITIALIZE ON PAGE LOAD
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Load session
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
        currentUser = JSON.parse(storedUser);
        currentCart = JSON.parse(localStorage.getItem('currentCart') || '[]');
        updateUserDisplay();
        updateCartBadge();
    } else if (!['index.html', 'signup.html'].includes(currentPage)) {
        // Redirect to login if not logged in
        const pagePath = window.location.pathname;
        window.location.href = pagePath.includes('/pages/') ? '../../index.html' : 'index.html';
    }

    // Apply theme if exists
    if (typeof applyThemeSettings === 'function') applyThemeSettings();
});

// =====================================================
// LOGIN FORM HANDLER
// =====================================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Save session
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('currentCart', JSON.stringify([]));

                currentUser = data.user;
                currentCart = [];

                // Redirect based on role
                redirectToDashboard(data.user.role);
            } else {
                alert(data.message || 'Invalid credentials. Please try again.');
                loginForm.reset();
            }
        } catch (err) {
            alert('Error: ' + err.message);
            console.error('Login error:', err);
        }
    });
}

// =====================================================
// DASHBOARD REDIRECTION
// =====================================================
function redirectToDashboard(role) {
    const paths = {
        'customer': 'pages/customer/products.html',
        'admin': 'pages/admin/dashboard.html',
        'rdc': 'pages/rdc/dashboard.html',
        'rdc_staff': 'pages/rdc/dashboard.html',
        'delivery': 'pages/delivery/dashboard.html',
        'delivery_staff': 'pages/delivery/dashboard.html'
    };
    window.location.href = paths[role] || 'index.html';
}

// =====================================================
// LOGOUT
// =====================================================
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('currentCart');
        currentUser = null;
        currentCart = [];
        window.location.href = '../../index.html';
    }
}

// =====================================================
// NAVIGATION HELPERS
// =====================================================
function goToPage(pageName) {
    if (!currentUser && !localStorage.getItem('token')) {
        alert('Please login first');
        window.location.href = '../../index.html';
        return;
    }
    window.location.href = pageName;
}

function goToCheckout() {
    if (currentCart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    window.location.href = 'pages/customer/checkout.html';
}

// =====================================================
// UI UPDATES
// =====================================================
function updateUserDisplay() {
    const userDisplay = document.getElementById('current-user');
    if (userDisplay && currentUser) {
        const roleMap = {
            'customer': 'Customer',
            'admin': 'Administrator',
            'rdc': 'RDC Staff',
            'rdc_staff': 'RDC Staff',
            'delivery': 'Delivery Staff',
            'delivery_staff': 'Delivery Staff'
        };
        const roleDisplay = roleMap[currentUser.role] || currentUser.role;
        userDisplay.textContent = `Welcome, ${currentUser.full_name || currentUser.name || 'User'} (${roleDisplay})`;
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const total = (currentCart || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
        badge.textContent = total;
    }
}

// =====================================================
// MODAL HELPERS
// =====================================================
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
});

// =====================================================
// SESSION AUTO-SAVE
// =====================================================
function saveSession() {
    localStorage.setItem('currentCart', JSON.stringify(currentCart));
}

(function() {
    let savingSession = false;
    const interval = 30000; // 30s

    setInterval(function() {
        if (document.hidden) return;
        if (savingSession) return;
        savingSession = true;
        try { saveSession(); } catch(e) { console.error(e); }
        savingSession = false;
    }, interval);

    window.addEventListener('beforeunload', function() {
        try { saveSession(); } catch(e) {}
    });
})();
