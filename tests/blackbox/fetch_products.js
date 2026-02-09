const axios = require('axios');
const API_BASE = (process.env.TARGET_URL || 'https://isdn-6291c.web.app').replace(/\/$/, '') + '/api';

(async function(){
  try {
    const res = await axios.get(API_BASE + '/products', { timeout: 8000 });
    console.log('Status:', res.status);
    console.log('Headers:', res.headers['content-type']);
    console.log('Body sample:', JSON.stringify(res.data).slice(0,2000));
  } catch (e) {
    console.error('Error fetching products:', e.message);
    if (e.response) {
      console.error('Response status:', e.response.status);
      console.error('Response body:', JSON.stringify(e.response.data).slice(0,2000));
    }
    process.exit(2);
  }
})();
