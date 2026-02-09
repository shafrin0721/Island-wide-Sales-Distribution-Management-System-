// =====================================================
// AUTHENTICATION & NAVIGATION
// =====================================================

// Use local backend when developing; when hosted, use relative `/api`.
// Allow runtime override via `window.__API_BASE__` so production or staging
// can point the client to an external API without editing source files.
const API_URL = (function() {
    // Highest priority: explicit runtime override (set this in a <script> before other scripts)
    if (window && window.__API_BASE__) {
        return window.__API_BASE__;
    }

    try {
        // If running on localhost, point to local backend
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
    } catch (e) {
        // In some test environments, location may be undefined
    }

    // Default for hosted site: use relative path so Hosting rewrites or Functions can handle `/api`
    return '/api';
})();

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

            // If Firebase Auth is explicitly requested or available and initialized, use it
            const useFirebase = (window && window.__USE_FIREBASE_AUTH__) || ((window._FB_READY || false) && (typeof firebase !== 'undefined' && firebase && firebase.auth));

            if (useFirebase) {
                try {
                    if (!window._FB_READY) {
                        await FirebaseHelper.init();
                    }
                    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                    const fbUser = userCredential.user;
                    const token = await fbUser.getIdToken();

                    // Try to read profile from Realtime Database (users/{uid})
                    let profile = null;
                    try {
                        profile = await FirebaseHelper.readData(`users/${fbUser.uid}`);
                    } catch (e) {
                        console.warn('Failed to read Firebase profile:', e?.message || e);
                    }

                    if (!profile) {
                        profile = {
                            id: fbUser.uid,
                            email: fbUser.email,
                            full_name: fbUser.displayName || '',
                            role: 'customer'
                        };
                    }

                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(profile));
                    localStorage.setItem('currentCart', JSON.stringify([]));

                    currentUser = profile;
                    currentCart = [];

                    redirectToDashboard(profile.role);
                    return;
                } catch (fbErr) {
                    console.error('Firebase login failed:', fbErr);
                    const code = fbErr && fbErr.code ? fbErr.code : '';
                    // If user not found, offer to create an account with entered password
                    if (code === 'auth/user-not-found') {
                        const create = confirm('No account found for this email. Create an account now using the entered password?');
                        if (create) {
                            try {
                                const createRes = await firebase.auth().createUserWithEmailAndPassword(email, password);
                                const fbUser = createRes.user;
                                const token = await fbUser.getIdToken();
                                const profile = { id: fbUser.uid, email: fbUser.email, full_name: fbUser.displayName || '', role: 'customer', createdAt: new Date().toISOString() };
                                try { await FirebaseHelper.writeData(`users/${fbUser.uid}`, profile); } catch (e) { console.warn('Failed to write profile to Firebase DB', e); }

                                localStorage.setItem('token', token);
                                localStorage.setItem('user', JSON.stringify(profile));
                                localStorage.setItem('currentCart', JSON.stringify([]));

                                currentUser = profile;
                                currentCart = [];
                                redirectToDashboard(profile.role);
                                return;
                            } catch (createErr) {
                                console.error('Firebase auto-create failed:', createErr);
                                alert(createErr.message || 'Account creation failed');
                                return;
                            }
                        } else {
                            alert('Please sign up first or use the signup page.');
                            return;
                        }
                    }

                    alert(fbErr.message || 'Login failed via Firebase');
                    return;
                }
            }

            // Fallback: existing backend API
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
            const msg = (error && error.message) ? error.message : String(error);
            // Friendly message for network failures
            if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || error instanceof TypeError) {
                alert('Cannot reach the backend server. If you intended to use Firebase Auth, ensure the Firebase SDK is loaded and Email/Password sign-in is enabled. Otherwise host your API and set `window.__API_BASE__`. See console for details.');
            } else {
                alert('Login error: ' + msg);
            }
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

// Demo login button: auto-create or sign-in a demo user for quick testing
(function() {
    const demoBtn = document.getElementById('demo-login-btn');
    if (!demoBtn) return;

    demoBtn.addEventListener('click', async function() {
        // Use a unique demo email so creation won't conflict with existing users
        const demoEmail = `demo+${Date.now()}@example.com`;
        const demoPassword = 'Test@123456';

        // Fill inputs for visibility
        try {
            const emailInput = document.getElementById('email');
            const pwInput = document.getElementById('password');
            if (emailInput) emailInput.value = demoEmail;
            if (pwInput) pwInput.value = demoPassword;

            // If Firebase is available and initialized, prefer that
            if ((window._FB_READY || false) && typeof firebase !== 'undefined' && firebase && firebase.auth) {
                try {
                    // Try sign in
                    await firebase.auth().signInWithEmailAndPassword(demoEmail, demoPassword);
                } catch (err) {
                    // If user not found or invalid credentials, create the demo user
                    const code = err && err.code ? err.code : '';
                    if (code === 'auth/user-not-found' || code === 'auth/invalid-login-credentials' || code === 'auth/wrong-password') {
                        try {
                            const createRes = await firebase.auth().createUserWithEmailAndPassword(demoEmail, demoPassword);
                            const fbUser = createRes.user;
                            const profile = { id: fbUser.uid, email: demoEmail, full_name: 'Demo User', role: 'customer', createdAt: new Date().toISOString() };
                            try { await FirebaseHelper.writeData(`users/${fbUser.uid}`, profile); } catch (e) { console.warn('Failed to write demo profile to Firebase DB', e); }
                        } catch (createErr) {
                            console.error('Failed to create demo user:', createErr);
                            alert('Demo login failed: ' + (createErr.message || createErr));
                            return;
                        }
                    } else {
                        console.error('Demo sign-in error:', err);
                        alert('Demo login failed: ' + (err.message || err));
                        return;
                    }
                }

                // At this point user should be signed in
                try {
                    const fbUser = firebase.auth().currentUser;
                    if (!fbUser) throw new Error('No Firebase user after sign-in');
                    const token = await fbUser.getIdToken();
                    let profile = null;
                    try { profile = await FirebaseHelper.readData(`users/${fbUser.uid}`); } catch (e) { console.warn('Profile read failed', e); }
                    if (!profile) profile = { id: fbUser.uid, email: fbUser.email, full_name: fbUser.displayName || 'Demo User', role: 'customer' };

                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(profile));
                    localStorage.setItem('currentCart', JSON.stringify([]));
                    currentUser = profile;
                    currentCart = [];
                    redirectToDashboard(profile.role);
                    return;
                } catch (finalErr) {
                    console.error('Demo finalization failed:', finalErr);
                    alert('Demo login failed: ' + (finalErr.message || finalErr));
                    return;
                }
            }

            // Fallback: create a local demo user and proceed
            const newUser = { id: 'demo_' + Date.now(), email: demoEmail, full_name: 'Demo User', role: 'customer' };
            localStorage.setItem('token', 'temp_token_' + Date.now());
            localStorage.setItem('user', JSON.stringify(newUser));
            localStorage.setItem('currentCart', JSON.stringify([]));
            currentUser = newUser;
            currentCart = [];
            redirectToDashboard(newUser.role);
        } catch (e) {
            console.error('Demo login unexpected error:', e);
            alert('Demo login failed: ' + (e.message || e));
        }
    });
})();

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            if (typeof firebase !== 'undefined' && firebase && firebase.auth) {
                firebase.auth().signOut().catch(()=>{});
            }
        } catch (e) {}

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
