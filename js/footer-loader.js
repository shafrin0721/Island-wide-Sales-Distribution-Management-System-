// Footer loader: fetches components/footer.html and injects into pages
(async function() {
  try {
    // Determine path to components folder based on page depth
    const path = (function() {
      const p = window.location.pathname;
      if (p.includes('/pages/')) return '../../components/footer.html';
      return 'components/footer.html';
    })();

    const resp = await fetch(path, { cache: 'no-store' });
    if (!resp.ok) {
      console.warn('Footer not found at', path, 'status', resp.status);
      return;
    }

    const html = await resp.text();
    // Create container and append to body
    const container = document.createElement('div');
    container.id = 'site-footer-container';
    container.innerHTML = html;
    // Append as last child of body
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(container);
    });
  } catch (err) {
    console.warn('Footer loader error:', err);
  }
})();
