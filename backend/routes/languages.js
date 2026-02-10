// Language and localization routes
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Supported languages
const LANGUAGES = {
  en: { name: 'English', code: 'en' },
  si: { name: 'Sinhala', code: 'si' },
  ta: { name: 'Tamil', code: 'ta' },
  es: { name: 'Spanish', code: 'es' },
  fr: { name: 'French', code: 'fr' },
  pt: { name: 'Portuguese', code: 'pt' },
  ar: { name: 'Arabic', code: 'ar' }
};

// Get all available languages (public endpoint - no auth required)
router.get('/languages', (req, res) => {
  try {
    const languages = Object.values(LANGUAGES);
    res.json({
      success: true,
      languages,
      default: 'en'
    });
  } catch (error) {
    console.error('Languages fetch error:', error);
    res.status(500).json({ message: 'Unable to fetch languages' });
  }
});

// Get language translations for a specific language (public endpoint)
router.get('/languages/:code', (req, res) => {
  try {
    const { code } = req.params;
    
    if (!LANGUAGES[code]) {
      return res.status(404).json({ message: 'Language not found' });
    }

    const language = LANGUAGES[code];
    
    // Return language info and translations
    res.json({
      success: true,
      language,
      translations: {
        // Common UI strings
        'app.title': 'Island-wide Sales Distribution Network',
        'app.description': 'Rapid Delivery Center Management System',
        'nav.home': code === 'en' ? 'Home' : code === 'si' ? 'ගෙදර' : 'Inicio',
        'nav.products': code === 'en' ? 'Products' : code === 'si' ? 'නිෂ්පාදන' : 'Productos',
        'nav.orders': code === 'en' ? 'Orders' : code === 'si' ? 'ඇණවුම්' : 'Pedidos',
        'nav.deliveries': code === 'en' ? 'Deliveries' : code === 'si' ? 'බෙදා හැරීම්' : 'Entregas',
        'nav.profile': code === 'en' ? 'Profile' : code === 'si' ? 'පැතිකඩ' : 'Perfil',
        'nav.logout': code === 'en' ? 'Logout' : code === 'si' ? 'ඉවත් වන්න' : 'Salir'
      }
    });
  } catch (error) {
    console.error('Language translation fetch error:', error);
    res.status(500).json({ message: 'Unable to fetch translations' });
  }
});

// Save user language preference (requires auth)
router.post('/languages/preference', verifyToken, (req, res) => {
  try {
    const { languageCode } = req.body;
    
    if (!LANGUAGES[languageCode]) {
      return res.status(400).json({ message: 'Invalid language code' });
    }

    // In production, save to database
    // db.updateUserLanguagePreference(req.user.id, languageCode);

    res.json({
      success: true,
      message: 'Language preference saved',
      languageCode,
      userId: req.user.id
    });
  } catch (error) {
    console.error('Language preference save error:', error);
    res.status(500).json({ message: 'Unable to save language preference' });
  }
});

module.exports = router;
