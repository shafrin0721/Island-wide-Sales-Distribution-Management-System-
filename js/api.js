// =====================================================
// API INTEGRATION WITH JWT AUTHENTICATION (BROWSER SAFE)
// =====================================================

// ----------------------
// API BASE URL DETECTION
// ----------------------
const API_BASE_URL = (() => {
    try {
        if (typeof location !== 'undefined') {
            // Local development
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                return 'http://localhost:5000/api';
            }
        }
    } catch (e) {
        console.warn('Location undefined, defaulting to hosted API:', e);
    }
    // Production / hosted site
    return '/api';
})();

// ----------------------
// JWT AUTH HELPERS
// ----------------------
function getAuthToken() {
    return localStorage.getItem('token');
}

function setAuthToken(token, role) {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
}

function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('currentUser');
}

// ----------------------
// API REQUEST WRAPPER
// ----------------------
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

        if (response.status === 401) {
            console.warn('Token expired or invalid, redirecting to login');
            clearAuth();
            window.location.href = '/index.html';
            return null;
        }

        if (response.status === 403) throw new Error('Forbidden: Insufficient permissions');
        if (response.status === 404) throw new Error(`Endpoint not found: ${endpoint}`);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error ${response.status}: ${text || response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API request error for ${endpoint}:`, error);
        throw error;
    }
}

// ----------------------
// DELIVERY PROFILE
// ----------------------
async function fetchDeliveryProfile() {
    try {
        return await apiRequest('/delivery/profile', { method: 'GET' }) || {};
    } catch (error) {
        console.error('Profile fetch error:', error);
        return {};
    }
}

async function updateDeliveryProfile(profileData) {
    return await apiRequest('/delivery/profile', { method: 'PUT', body: JSON.stringify(profileData) });
}

async function fetchDeliveryAssignments() {
    return await apiRequest('/delivery/deliveries', { method: 'GET' });
}

async function updateDeliveryStatus(deliveryId, status) {
    return await apiRequest(`/delivery/deliveries/${deliveryId}`, { method: 'PUT', body: JSON.stringify({ status }) });
}

// ----------------------
// AUTH FUNCTIONS
// ----------------------
async function loginUser(email, password) {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (res.status === 401) throw new Error('Invalid email or password');
        if (!res.ok) throw new Error(`Login failed: ${res.statusText}`);

        const data = await res.json();
        setAuthToken(data.token, data.user.role);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function signupUser(userData) {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (res.status === 409) throw new Error('User already exists');
        if (!res.ok) throw new Error(`Signup failed: ${res.statusText}`);

        const data = await res.json();
        setAuthToken(data.token, data.user.role);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return data;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

async function verifyToken(token) {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        return data.valid;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

// ----------------------
// LANGUAGE FUNCTIONS
// ----------------------
async function fetchLanguages() {
    try {
        const data = await apiRequest('/languages', { method: 'GET' });
        return Array.isArray(data.languages) ? data.languages : fallbackLanguages();
    } catch (error) {
        console.error('Languages fetch error:', error);
        return fallbackLanguages();
    }
}

async function fetchLanguageTranslations(languageCode = 'en') {
    try {
        const data = await apiRequest(`/languages/${languageCode}`, { method: 'GET' });
        return data.translations || {};
    } catch (error) {
        console.error('Translations fetch error:', error);
        return {};
    }
}

async function saveLanguagePreference(languageCode) {
    return await apiRequest('/languages/preference', { method: 'POST', body: JSON.stringify({ languageCode }) });
}

function fallbackLanguages() {
    return [
        { code: 'en', name: 'English' },
        { code: 'si', name: 'Sinhala' },
        { code: 'ta', name: 'Tamil' }
    ];
}

// ----------------------
// DOM READY INITIALIZATION
// ----------------------
document.addEventListener('DOMContentLoaded', async () => {
    const token = getAuthToken();
    if (token) {
        const valid = await verifyToken(token);
        if (!valid) clearAuth();
    }
    console.info('✓ API initialized (browser-safe, JWT auth enabled)');
});
// api.js
async function fetchLanguages() {
  try {
    const response = await fetch('https://your-api-endpoint.com/languages'); // replace with actual API
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('[Suppressed] Error fetching languages:', error);
    return []; // Return empty array instead of crashing
  }
}

// Example usage:
(async () => {
  const languages = await fetchLanguages();
  console.log('Languages loaded:', languages);
})();
