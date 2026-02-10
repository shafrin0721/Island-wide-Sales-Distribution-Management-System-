// =====================================================
// API INTEGRATION WITH JWT AUTHENTICATION
// =====================================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Get stored JWT token from localStorage
 */
function getAuthToken() {
  return localStorage.getItem('token');
}

/**
 * Store JWT token and user role
 */
function setAuthToken(token, role) {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
}

/**
 * Clear authentication data
 */
function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('currentUser');
}

/**
 * Make API request with JWT authentication
 */
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Handle 401 Unauthorized - ONLY redirect on explicit 401
    if (response.status === 401) {
      console.warn('Token expired or invalid, redirecting to login');
      clearAuth();
      window.location.href = '/index.html';
      return null;
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      console.error('Access denied - insufficient permissions');
      throw new Error('Forbidden: Insufficient permissions');
    }

    // Handle 404 Not Found - don't treat as critical error
    if (response.status === 404) {
      console.warn(`Endpoint not found: ${endpoint}`);
      throw new Error(`Endpoint not found: ${endpoint}`);
    }

    // Handle other errors but don't redirect
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Fetch delivery staff profile
 */
async function fetchDeliveryProfile() {
  try {
    const data = await apiRequest('/delivery/profile', {
      method: 'GET'
    });
    return data;
  } catch (error) {
    console.error('Profile fetch error:', error);
    throw error;
  }
}

/**
 * Update delivery staff profile
 */
async function updateDeliveryProfile(profileData) {
  try {
    const data = await apiRequest('/delivery/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return data;
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
}

/**
 * Fetch delivery assignments
 */
async function fetchDeliveryAssignments() {
  try {
    const data = await apiRequest('/delivery/deliveries', {
      method: 'GET'
    });
    return data;
  } catch (error) {
    console.error('Deliveries fetch error:', error);
    throw error;
  }
}

/**
 * Update delivery status
 */
async function updateDeliveryStatus(deliveryId, status) {
  try {
    const data = await apiRequest(`/delivery/deliveries/${deliveryId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    return data;
  } catch (error) {
    console.error('Status update error:', error);
    throw error;
  }
}

/**
 * Login user and get JWT token
 */
async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (response.status === 401) {
      throw new Error('Invalid email or password');
    }

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store token and role
    setAuthToken(data.token, data.user.role);
    
    // Store user info
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Signup new user
 */
async function signupUser(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (response.status === 409) {
      throw new Error('User already exists');
    }

    if (!response.ok) {
      throw new Error(`Signup failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store token and role
    setAuthToken(data.token, data.user.role);
    
    // Store user info
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}

/**
 * Verify if token is valid
 */
async function verifyToken(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return data.valid;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

/**
 * Fetch available languages
 */
async function fetchLanguages() {
  try {
    const data = await apiRequest('/languages', {
      method: 'GET'
    });
    return data.languages || [];
  } catch (error) {
    console.error('Languages fetch error:', error);
    // Return fallback languages if API fails
    return [
      { code: 'en', name: 'English' },
      { code: 'si', name: 'Sinhala' },
      { code: 'ta', name: 'Tamil' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' }
    ];
  }
}

/**
 * Fetch language translations
 */
async function fetchLanguageTranslations(languageCode = 'en') {
  try {
    const data = await apiRequest(`/languages/${languageCode}`, {
      method: 'GET'
    });
    return data.translations || {};
  } catch (error) {
    console.error('Translations fetch error:', error);
    return {}; // Return empty object if fetch fails
  }
}

/**
 * Save user language preference
 */
async function saveLanguagePreference(languageCode) {
  try {
    const data = await apiRequest('/languages/preference', {
      method: 'POST',
      body: JSON.stringify({ languageCode })
    });
    return data;
  } catch (error) {
    console.error('Language preference save error:', error);
    throw error;
  }
}
document.addEventListener('DOMContentLoaded', async function() {
  const token = getAuthToken();
  const role = localStorage.getItem('role');

  if (token) {
    const isValid = await verifyToken(token);
    if (!isValid) {
      console.warn('Stored token is invalid, clearing auth');
      clearAuth();
      // Redirect to login if on a protected page
      if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
        window.location.href = '/index.html';
      }
    }
  }
});
