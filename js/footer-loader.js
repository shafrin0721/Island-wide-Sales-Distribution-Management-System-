// Footer Injection Script
document.addEventListener('DOMContentLoaded', function() {
    // Check if footer already exists
    if (document.querySelector('footer')) {
        return;
    }

    // Get the correct path based on current location
    let footerPath = '/components/footer.html';
    
    // If we're in a subdirectory, adjust path
    if (window.location.pathname.includes('/pages/')) {
        footerPath = '../../components/footer.html';
    }

    // Fetch and inject footer
    fetch(footerPath)
        .then(response => response.text())
        .then(html => {
            // Create footer element
            const footerDiv = document.createElement('div');
            footerDiv.innerHTML = html;
            
            // Append to body
            document.body.appendChild(footerDiv);
            
            // Load Font Awesome if not already loaded
            if (!document.querySelector('link[href*="fontawesome"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
                document.head.appendChild(link);
            }
        })
        .catch(error => console.error('Error loading footer:', error));
});
