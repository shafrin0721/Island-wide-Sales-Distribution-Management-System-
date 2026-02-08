// =====================================================
// AUTHENTICATION & NAVIGATION
// =====================================================

const API_URL = 'http://localhost:5000/api';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Check if user is logged in using localStorage (persists across sessions)
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
        currentUser = JSON.parse(storedUser);
        currentCart = JSON.parse(localStorage.getItem('currentCart') || '[]');
        updateUserDisplay();
        updateCartBadge();
    } else if (currentPage !== 'index.html' && currentPage !== 'signup.html') {
        // Redirect to login if not on login/signup page
        // Determine the correct path based on current location
        const pagePath = window.location.pathname;
        if (pagePath.includes('/pages/')) {
            window.location.href = '../../index.html';
        } else {
            window.location.href = 'index.html';
        }
    }
    
    // Apply theme settings if they exist
    if (typeof applyThemeSettings === 'function') {
        applyThemeSettings();
    }
});

// Handle Login Form
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            console.log('Attempting login with email:', email);
            
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok && data.success) {
                // Store token and user
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('currentCart', JSON.stringify([]));

                currentUser = data.user;
                currentCart = [];

                // Redirect based on role
                redirectToDashboard(data.user.role);
            } else {
                alert(data.message || 'Invalid credentials. Please try again.');
                document.getElementById('email').value = '';
                document.getElementById('password').value = '';
            }
        } catch (error) {
            alert('Error: ' + error.message);
            console.error('Login error:', error);
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
        case 'rdc':
        case 'rdc_staff':
            window.location.href = 'pages/rdc/dashboard.html';
            break;
        case 'delivery':
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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('currentCart');
        currentUser = null;
        currentCart = [];
        window.location.href = '../../index.html';
    }
}

// Navigation helper
function goToPage(pageName) {
    if (!currentUser && localStorage.getItem('token') === null) {
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
    window.location.href = 'pages/customer/checkout.html';
}

// Update user display
function updateUserDisplay() {
    const userDisplay = document.getElementById('current-user');
    if (userDisplay && currentUser) {
        const roleDisplay = {
            'customer': 'Customer',
            'admin': 'Administrator',
            'rdc': 'RDC Staff',
            'rdc_staff': 'RDC Staff',
            'delivery': 'Delivery Staff',
            'delivery_staff': 'Delivery Staff'
        }[currentUser.role] || currentUser.role;
        userDisplay.textContent = `Welcome, ${currentUser.full_name || currentUser.name || 'User'} (${roleDisplay})`;
    }
}

// Update cart badge
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const total = (currentCart || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
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
    localStorage.setItem('currentCart', JSON.stringify(currentCart));
}

// Auto-save session (guarded and reduced frequency)
(function() {
    let _savingSession = false;
    function periodicSessionSave() {
        if (_savingSession) return;
        _savingSession = true;
        try {
            saveSession();
        } catch (e) {
            console.error('Session save failed:', e);
        } finally {
            _savingSession = false;
        }
    }

    const sessionInterval = 30000; // 30s
    setInterval(function() {
        if (document.hidden) return;
        periodicSessionSave();
    }, sessionInterval);

    // Save when the page is about to be unloaded
    window.addEventListener('beforeunload', function() {
        try { saveSession(); } catch (e) {}
    });
})();
