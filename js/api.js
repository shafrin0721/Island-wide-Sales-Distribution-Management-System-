// ==============================
// api.js - Fully Browser-Safe
// ==============================

// ----------------------
// Translations & Language
// ----------------------
const translations = {};
let currentLang = 'en';

function fallbackTranslations(lang) {
  return {
    greeting: lang === 'si' ? 'ආයුබෝවන්' : lang === 'ta' ? 'வணக்கம்' : 'Hello',
    login: lang === 'si' ? 'ඇතුල් වන්න' : lang === 'ta' ? 'உள்நுழைக' : 'Login',
    logout: lang === 'si' ? 'පිටවීම' : lang === 'ta' ? 'வெளியேறு' : 'Logout',
    profile: lang === 'si' ? 'පැතිකඩ' : lang === 'ta' ? 'சுயவிவரம்' : 'Profile',
  };
}

async function loadTranslations(lang) {
  if (!translations[lang]) {
    try {
      translations[lang] = fallbackTranslations(lang); // always fallback
    } catch (e) {
      console.warn(`[Fallback] Failed translations for "${lang}":`, e);
      translations[lang] = fallbackTranslations(lang);
    }
  }
  currentLang = lang;
  updateTexts();
}

function updateTexts() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[currentLang] && translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });
}

// ----------------------
// Fallback languages
// ----------------------
function fallbackLanguages() {
  return [
    { code: 'en', name: 'English' },
    { code: 'si', name: 'Sinhala' },
    { code: 'ta', name: 'Tamil' }
  ];
}

// ----------------------
// Browser-safe "API" requests
// ----------------------
async function apiRequest(endpoint, options = {}) {
  await new Promise(r => setTimeout(r, 50)); // simulate delay
  const token = localStorage.getItem('token');

  switch (endpoint) {
    case '/languages':
      return { languages: fallbackLanguages() };
    case '/delivery/profile':
      if (!token) throw new Error('Unauthorized');
      return { id: 1, name: "John Doe", email: "delivery@example.com" };
    case '/auth/login':
      return { token: "mock-token", user: { id: 1, name: "John Doe", role: "delivery" } };
    case '/auth/signup':
      return { token: "mock-token", user: { id: 2, name: options.body?.name || "New User", role: "customer" } };
    default:
      return {};
  }
}

// ----------------------
// Auth helpers
// ----------------------
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
// Login/Signup
// ----------------------
async function loginUser(email, password) {
  const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  setAuthToken(data.token, data.user.role);
  localStorage.setItem('currentUser', JSON.stringify(data.user));
  return data.user;
}

async function signupUser(userData) {
  const data = await apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(userData) });
  setAuthToken(data.token, data.user.role);
  localStorage.setItem('currentUser', JSON.stringify(data.user));
  return data.user;
}

// ----------------------
// Fetch delivery profile
// ----------------------
async function fetchDeliveryProfile() {
  try {
    return await apiRequest('/delivery/profile');
  } catch (e) {
    console.warn('Delivery profile fetch failed:', e);
    return {};
  }
}

// ----------------------
// Fetch languages safely
// ----------------------
async function fetchLanguages() {
  try {
    const data = await apiRequest('/languages');
    return Array.isArray(data.languages) ? data.languages : fallbackLanguages();
  } catch (e) {
    console.warn('Languages fetch failed, using fallback:', e);
    return fallbackLanguages();
  }
}

// ----------------------
// DOM Ready
// ----------------------
document.addEventListener('DOMContentLoaded', async () => {
  console.log('API.js loaded (fully browser-safe)');
  await loadTranslations(currentLang);
  const langs = await fetchLanguages();
  console.log('Languages loaded:', langs);
});