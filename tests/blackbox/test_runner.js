const axios = require('axios');

const TARGET = process.env.TARGET_URL || 'https://isdn-6291c.web.app';
const API_BASE = TARGET.replace(/\/$/, '') + '/api';

const tests = [];

function pass(name) { console.log(`✓ ${name}`); }
function fail(name, err) { console.error(`✗ ${name} -> ${err}`); }

async function testHealth() {
  const name = 'GET /api/health';
  try {
    const res = await axios.get(API_BASE + '/health', { timeout: 8000 });
    if (res.status === 200) {
      pass(name + ` (status ${res.status})`);
      return true;
    }
    throw new Error('unexpected status ' + res.status);
  } catch (e) {
    fail(name, e.message || e);
    return false;
  }
}

async function testProducts() {
  const name = 'GET /api/products';
  try {
    const res = await axios.get(API_BASE + '/products', { timeout: 8000 });
    if (res.status === 200 && Array.isArray(res.data)) {
      pass(name + ` (count ${res.data.length})`);
      return true;
    }
    // Some backends return { data: [...] }
    if (res.status === 200 && res.data && Array.isArray(res.data.data)) {
      pass(name + ` (count ${res.data.data.length})`);
      return true;
    }
    throw new Error('unexpected response');
  } catch (e) {
    fail(name, e.message || e);
    return false;
  }
}

async function testLogin() {
  const name = 'POST /api/auth/login';
  const payload = { email: 'customer@test.com', password: 'password123' };
  try {
    const res = await axios.post(API_BASE + '/auth/login', payload, { timeout: 8000 });
    if (res.status === 200) {
      pass(name + ` (status ${res.status})`);
      return true;
    }
    throw new Error('unexpected status ' + res.status);
  } catch (e) {
    fail(name, e.message || e);
    return false;
  }
}

(async function run() {
  console.log('Target API base:', API_BASE);
  const results = [];
  results.push(await testHealth());
  results.push(await testProducts());
  results.push(await testLogin());

  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log(`\nSummary: ${passed}/${total} tests passed`);
  process.exit(passed === total ? 0 : 2);
})();
