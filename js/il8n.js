const translations = {};
let currentLang = 'en';

// Load JSON files dynamically
async function loadTranslations(lang) {
  if (!translations[lang]) {
    try {
      const res = await fetch(`/locales/${lang}.json`);
      translations[lang] = await res.json();
    } catch (e) {
      console.error("Failed to load language:", lang, e);
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

// Listen for language change
document.getElementById("language-switcher").addEventListener("change", e => {
  loadTranslations(e.target.value);
});

// Initial load
loadTranslations(currentLang);
