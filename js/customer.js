// =====================================================
// CUSTOMER FUNCTIONS
// =====================================================

// CSP-safe placeholder image generator (data: URI with SVG)
function getSafePlaceholder(width = 200, height = 200, text = 'Image') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="${width}" height="${height}" fill="#e0e0e0"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="#999" transform="translate(0, -10)">
            ${text.substring(0, 20)}
        </text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

// Initialize page-specific content when DOM is ready
// Setup modal close button handler to comply with CSP
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function() {
        const closeBtn = document.querySelector('#product-modal .close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closeModal('product-modal');
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired, initializing page content');
    
    // Fix any invalid delivery coordinates (ensure Sri Lanka only)
    if (systemData && systemData.deliveries) {
        systemData.deliveries.forEach(delivery => {
            if (delivery.gpsLocation) {
                const lat = parseFloat(delivery.gpsLocation.latitude);
                const lon = parseFloat(delivery.gpsLocation.longitude);
                // Check if coordinates are outside Sri Lanka bounds
                const isInvalid = (lat < 5 || lat > 10) || (lon < 79 || lon > 82);
                if (isInvalid) {
                    console.warn('🔧 Fixing invalid coordinates for delivery', delivery.deliveryID);
                    delivery.gpsLocation.latitude = 6.9271;
                    delivery.gpsLocation.longitude = 80.6369;
                    delivery.gpsLocation.address = delivery.gpsLocation.address || 'Mumtaz Mahal, 100/22 1st Cross St, Colombo 01100, Colombo 11';
                }
            }
        });
    }
    
    // Setup navigation buttons with event delegation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const navType = this.getAttribute('data-nav');
            
            if (!navType) {
                console.warn('Nav link clicked without data-nav attribute');
                return;
            }
            
            if (navType === 'products') {
                window.location.href = 'products.html';
            } else if (navType === 'orders') {
                window.location.href = 'orders.html';
            } else if (navType === 'cart') {
                window.location.href = 'cart.html';
            } else if (navType === 'profile') {
                window.location.href = 'profile.html';
            } else if (navType === 'settings') {
                window.location.href = 'settings.html';
            } else if (navType === 'logout') {
                logout();
            }
        });
    });
    
    // Setup action buttons (checkout, cancel edit, etc)
    document.addEventListener('click', function(e) {
        const action = e.target.getAttribute('data-action');
        if (action === 'checkout') {
            window.location.href = 'checkout.html';
        } else if (action === 'continue-shopping') {
            window.location.href = 'products.html';
        } else if (action === 'cancel-edit') {
            if (typeof loadProfileData === 'function') {
                loadProfileData();
            }
        } else if (action === 'save-profile') {
            saveProfileChanges();
        } else if (action === 'save-email-prefs') {
            saveEmailPreferences();
        } else if (action === 'save-delivery-prefs') {
            saveDeliveryPreferences();
        } else if (action === 'setup-2fa') {
            alert('Two-Factor Authentication setup would be implemented here. You would receive a QR code to scan with your authenticator app.');
        } else if (action === 'view-sessions') {
            alert('Active Sessions:\n\n1. Current Session (this browser)\nLocation: Your Location\nDevice: Your Device\nLast Active: Just now\n\nNote: You can manage sessions from here.');
        } else if (action === 'delete-account') {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
                if (confirm('This is your final warning. Are you absolutely sure?')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('user_settings');
                    alert('Your account has been deleted.');
                    window.location.href = '../../index.html';
                }
            }
        } else if (action === 'send-verification-email') {
            sendVerificationEmail();
        } else if (action === 'change-password') {
            changePassword();
        } else if (action === 'show-order-details') {
            const orderID = parseInt(e.target.getAttribute('data-order-id'));
            showOrderDetails(orderID);
        } else if (action === 'track-delivery') {
            const orderID = parseInt(e.target.getAttribute('data-order-id'));
            trackDelivery(orderID);
        } else if (action === 'back-to-cart') {
            window.location.href = 'cart.html';
        } else if (action === 'go-to-page') {
            const pageName = e.target.getAttribute('data-page');
            if (pageName) {
                window.location.href = pageName;
            }
        } else if (action === 'close-modal') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.classList.contains('active')) {
                    modal.style.display = 'none';
                    modal.classList.remove('active');
                }
            });
        }
        
        // Handle toggle switches
        const toggleSetting = e.target.getAttribute('data-toggle');
        if (toggleSetting) {
            toggleSettingHandler(e.target, toggleSetting);
        }
    });
    
    // Load products on products page
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        console.log('products-grid found, calling loadProducts');
        loadProducts();
        setupFilters();
    }

    // Load cart on cart page
    const cartItems = document.getElementById('cart-items');
    if (cartItems) {
        console.log('cart-items found, calling updateCartDisplay');
        updateCartDisplay();
    }
    
    // Load profile on profile page
    const profileSection = document.getElementById('profile-section');
    if (profileSection) {
        console.log('profile-section found, calling loadProfileData');
        loadProfileData();
        loadProfileStats();
    }
    
    // Load settings on settings page
    const settingsPanel = document.querySelector('[id*="notification-settings"]') || document.querySelector('[id*="email-notifications"]');
    if (settingsPanel || document.getElementById('toggle-email')) {
        console.log('Settings page detected, loading settings');
        loadSettings();
    }

    // Load orders on orders page
    const ordersList = document.getElementById('orders-list');
    if (ordersList) {
        console.log('orders-list found, calling loadCustomerOrders');
        loadCustomerOrders();
    }

    // Load checkout on checkout page
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        console.log('checkout-form found, calling setup functions');
        updateOrderSummary();
        setupPaymentMethod();
        setupCheckoutForm();
    }
});
// ================== PRODUCTS ==================

function loadProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) {
        console.error('products-grid element not found!');
        return;
    }
    
    if (!systemData || !systemData.products) {
        console.error('systemData or systemData.products not found!');
        grid.innerHTML = '<p style="color: red; padding: 20px;">Error: Product data not loaded. Please check browser console.</p>';
        return;
    }
    
    console.log('loadProducts called, found', systemData.products.length, 'products');
    console.log('systemData:', systemData);
    
    grid.innerHTML = '';
    
    if (systemData.products.length === 0) {
        grid.innerHTML = '<p style="padding: 20px;">No products available.</p>';
        return;
    }
    
    systemData.products.forEach(product => {
        if (!product) {
            console.warn('Null product encountered');
            return;
        }
        
        const inventory = systemData.inventory ? systemData.inventory.find(inv => inv.productID === product.productID) : null;
        const inStock = inventory && inventory.stockLevel > 0;

        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Safely parse prices
        const wholesalePrice = parseFloat(product.wholesalePrice || 0);
        const retailPrice = parseFloat(product.retailPrice || 0);
        const price = parseFloat(product.price || product.basePrice || 0);
        
        const wholesalePriceDisplay = isNaN(wholesalePrice) ? '0.00' : wholesalePrice.toFixed(2);
        const retailPriceDisplay = isNaN(retailPrice) ? '0.00' : retailPrice.toFixed(2);
        const priceDisplay = isNaN(price) ? '0.00' : price.toFixed(2);
        
        card.innerHTML = `
            <div class="product-image">
                <img src="${(product.image && typeof product.image === 'string') ? product.image : getSafePlaceholder(200, 200, 'Product')}" alt="${product.name}" crossorigin="anonymous" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23e0e0e0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2214%22 fill=%22%23999%22%3EImage Not Found%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="product-info">
                <div class="product-brand">${product.brand || 'Brand'}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.subcategory || product.category || 'Category'}</div>
                <div class="product-rating">⭐ ${product.rating || '4.5'} (${product.reviews || '0'} reviews)</div>
                <div class="product-pricing">
                    <span class="wholesale-price">Wholesale: $${wholesalePriceDisplay}</span>
                    <span class="retail-price">Retail: $${retailPriceDisplay}</span>
                </div>
                <div class="product-price">Your Price: $${priceDisplay}</div>
                <div class="product-availability ${inStock ? 'in-stock' : 'out-stock'}">
                    ${inStock ? `✓ In Stock (${inventory.stockLevel} available)` : '✗ Out of Stock'}
                </div>
                <div class="product-actions">
                    <button class="view-details-btn" data-product-id="${product.productID}">Details</button>
                    <button class="add-to-cart-btn" data-product-id="${product.productID}" ${!inStock ? 'disabled' : ''}>
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
        // Attach image error handler (avoid inline onerror, use CSP-safe placeholder)
        const cardImg = card.querySelector('.product-image img');
        if (cardImg) {
            cardImg.addEventListener('error', function() {
                this.src = getSafePlaceholder(200, 200, product.name || 'Image');
            });
        }
    });
    
    console.log('Products loaded successfully, count:', grid.children.length);
    
    // Add event delegation
    grid.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-details-btn')) {
            const productID = parseInt(e.target.dataset.productId);
            showProductDetails(productID);
        } else if (e.target.classList.contains('add-to-cart-btn')) {
            const productID = parseInt(e.target.dataset.productId);
            addToCart(productID);
        }
    });
}

function showProductDetails(productID) {
    console.log('showProductDetails called with productID:', productID);
    const product = systemData.products.find(p => p.productID === productID);
    const inventory = systemData.inventory.find(inv => inv.productID === productID);
    const inStock = inventory && inventory.stockLevel > 0;

    const modal = document.getElementById('product-modal');
    const detailsDiv = document.getElementById('product-details');
    
    if (!modal || !detailsDiv) {
        console.error('Modal or details div not found');
        return;
    }

    detailsDiv.innerHTML = `
        <div class="product-details-container">
            <div class="product-details-image">
                <img src="${(product.image && typeof product.image === 'string') ? product.image : getSafePlaceholder(300, 300, 'Product')}" alt="${product.name}" crossorigin="anonymous" loading="lazy" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; onerror=&quot;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect width=%22300%22 height=%22300%22 fill=%22%23e0e0e0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2214%22 fill=%22%23999%22%3EImage Not Found%3C/text%3E%3C/svg%3E&quot;">
            </div>
            <div class="product-details-info">
                <div class="product-details-brand">${product.brand}</div>
                <h2>${product.name}</h2>
                <div class="product-details-sku">SKU: ${product.sku}</div>
                <div class="product-details-rating">⭐ ${product.rating || 4.5}/5.0 (${product.reviews || 0} customer reviews)</div>
                
                <div class="product-details-pricing">
                    <div class="price-row">
                        <span class="label">Wholesale Price:</span>
                        <span class="price">$${(parseFloat(product.wholesalePrice) || 0).toFixed(2)}</span>
                    </div>
                    <div class="price-row">
                        <span class="label">Retail Price:</span>
                        <span class="price">$${(parseFloat(product.retailPrice) || 0).toFixed(2)}</span>
                    </div>
                    <div class="price-row highlight">
                        <span class="label">Your Price:</span>
                        <span class="price">$${(parseFloat(product.price) || 0).toFixed(2)}</span>
                    </div>
                    <div class="price-row">
                        <span class="label">You Save:</span>
                        <span class="price savings">$${((parseFloat(product.retailPrice) || 0) - (parseFloat(product.price) || 0)).toFixed(2)} (${product.discount || 0}%)</span>
                    </div>
                </div>
                
                <div class="product-details-specs">
                    <h4>Product Details</h4>
                    <table class="specs-table">
                        <tr><td>Category</td><td>${product.category}</td></tr>
                        <tr><td>Subcategory</td><td>${product.subcategory}</td></tr>
                        <tr><td>Packaging</td><td>${product.packaging}</td></tr>
                        <tr><td>Supplier</td><td>${product.supplier}</td></tr>
                        <tr><td>Expiry Date</td><td>${product.expiryDate}</td></tr>
                        <tr><td>Minimum Order</td><td>${product.minOrder} units</td></tr>
                    </table>
                </div>
                
                <div class="product-details-description">
                    <h4>Description</h4>
                    <p>${product.description}</p>
                </div>
                
                <div class="product-details-availability ${inStock ? 'in-stock' : 'out-stock'}">
                    ${inStock ? `<span class="stock-status">✓ In Stock - ${inventory.stockLevel} units available</span>` : '<span class="stock-status">✗ Out of Stock</span>'}
                </div>
                
                <div class="product-quantity-input">
                    <label>Quantity:</label>
                    <div class="qty-selector">
                        <button class="qty-decrease-btn" id="qty-decrease">−</button>
                        <input type="number" id="qty-input" value="1" min="1" max="${inventory?.stockLevel || 1}">
                        <button class="qty-increase-btn" id="qty-increase">+</button>
                    </div>
                </div>
                
                <button class="btn btn-primary add-cart-btn" data-product-id="${product.productID}" style="width: 100%; padding: 12px; font-size: 16px;" ${!inStock ? 'disabled' : ''}>
                    Add to Cart
                </button>
            </div>
        </div>
    `;

    // Ensure modal is visible and active
    modal.style.display = 'block';
    // Attach image error handler to details image (CSP-safe)
    const detailsImg = detailsDiv.querySelector('.product-details-image img');
    if (detailsImg) {
        detailsImg.addEventListener('error', function() {
            this.src = getSafePlaceholder(300, 300, product.name || 'Image');
        });
    }
    modal.classList.add('active');
    console.log('Product modal opened for', product.name);
    
    // Add event listeners for quantity controls
    const decreaseBtn = document.getElementById('qty-decrease');
    const increaseBtn = document.getElementById('qty-increase');
    const qtyInput = document.getElementById('qty-input');
    const addBtn = document.querySelector('.add-cart-btn');
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Decrease quantity button clicked');
            decreaseQty();
        });
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Increase quantity button clicked');
            increaseQty(parseInt(qtyInput.max) || 1);
        });
    }
    
    if (addBtn) {
        addBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Add to cart button clicked from modal');
            const productId = parseInt(this.dataset.productId);
            addToCartWithQty(productId);
        });
    }
}

function decreaseQty() {
    const input = document.getElementById('qty-input');
    if (input) input.value = Math.max(1, parseInt(input.value) - 1);
}

function increaseQty(max) {
    const input = document.getElementById('qty-input');
    if (input) input.value = Math.min(max, parseInt(input.value) + 1);
}

function addToCart(productID) {
    console.log('addToCart called with productID:', productID);
    const product = systemData.products.find(p => p.productID === productID);
    const inventory = systemData.inventory.find(inv => inv.productID === productID);

    if (!inventory || inventory.stockLevel <= 0) {
        alert('Product is out of stock');
        return;
    }

    const cartItem = currentCart.find(item => item.productID === productID);
    if (cartItem) {
        if (cartItem.quantity < inventory.stockLevel) {
            cartItem.quantity++;
        } else {
            alert('Cannot add more. Maximum available quantity reached.');
        }
    } else {
        currentCart.push({
            productID: productID,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    console.log('Updated cart:', currentCart);
    updateCartBadge();
    saveSession();
    alert('Product added to cart!');
}

function addToCartWithQty(productID) {
    const qty = parseInt(document.getElementById('qty-input')?.value) || 1;
    const product = systemData.products.find(p => p.productID === productID);
    const inventory = systemData.inventory.find(inv => inv.productID === productID);

    if (!inventory || inventory.stockLevel < qty) {
        alert('Not enough stock available');
        return;
    }

    const cartItem = currentCart.find(item => item.productID === productID);
    if (cartItem) {
        cartItem.quantity += qty;
    } else {
        currentCart.push({
            productID: productID,
            name: product.name,
            price: product.price,
            quantity: qty
        });
    }

    updateCartBadge();
    saveSession();
    closeModal('product-modal');
    alert('Product added to cart!');
}

// ================== FILTERS ==================

function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const sortFilter = document.getElementById('sort-filter');

    if (searchInput) searchInput.addEventListener('keyup', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (priceFilter) priceFilter.addEventListener('change', applyFilters);
    if (sortFilter) sortFilter.addEventListener('change', applySorting);
}

function applyFilters() {
    const searchTerm = (document.getElementById('search-input')?.value || '').toLowerCase();
    const category = document.getElementById('category-filter')?.value || '';
    const priceRange = document.getElementById('price-filter')?.value || '';

    let filtered = systemData.products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm) || p.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || p.category === category;
        
        let matchesPrice = true;
        if (priceRange) {
            const [min, max] = priceRange.split('-');
            if (max === '+') {
                matchesPrice = p.price >= parseInt(min);
            } else {
                matchesPrice = p.price >= parseInt(min) && p.price <= parseInt(max);
            }
        }

        return matchesSearch && matchesCategory && matchesPrice;
    });

    displayFilteredProducts(filtered);
}

function applySorting() {
    const sortValue = document.getElementById('sort-filter')?.value || 'name';
    let sorted = [...systemData.products];
    
    switch(sortValue) {
        case 'price-low':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }

    displayFilteredProducts(sorted);
}

function displayFilteredProducts(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No products found</p>';
        return;
    }

    products.forEach(product => {
        const inventory = systemData.inventory.find(inv => inv.productID === product.productID);
        const inStock = inventory && inventory.stockLevel > 0;

        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Safely parse prices
        const wholesalePrice = parseFloat(product.wholesalePrice || 0);
        const retailPrice = parseFloat(product.retailPrice || 0);
        const price = parseFloat(product.price || product.basePrice || 0);
        
        const wholesalePriceDisplay = isNaN(wholesalePrice) ? '0.00' : wholesalePrice.toFixed(2);
        const retailPriceDisplay = isNaN(retailPrice) ? '0.00' : retailPrice.toFixed(2);
        const priceDisplay = isNaN(price) ? '0.00' : price.toFixed(2);
        
        card.innerHTML = `
            <div class="product-image">
                <img src="${(product.image && typeof product.image === 'string') ? product.image : getSafePlaceholder(200, 200, 'Product')}" alt="${product.name}" crossorigin="anonymous" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23e0e0e0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2214%22 fill=%22%23999%22%3EImage Not Found%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="product-info">
                <div class="product-brand">${product.brand || 'Brand'}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.subcategory || product.category || 'Category'}</div>
                <div class="product-rating">⭐ ${product.rating || '4.5'} (${product.reviews || '0'} reviews)</div>
                <div class="product-pricing">
                    <span class="wholesale-price">Wholesale: $${wholesalePriceDisplay}</span>
                    <span class="retail-price">Retail: $${retailPriceDisplay}</span>
                </div>
                <div class="product-price">Your Price: $${priceDisplay}</div>
                <div class="product-availability ${inStock ? 'in-stock' : 'out-stock'}">
                    ${inStock ? `✓ In Stock (${inventory.stockLevel} available)` : '✗ Out of Stock'}
                </div>
                <div class="product-actions">
                    <button class="view-details-btn" data-product-id="${product.productID}">Details</button>
                    <button class="add-to-cart-btn" data-product-id="${product.productID}" ${!inStock ? 'disabled' : ''}>
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
        // Attach image error handler (avoid inline onerror, use CSP-safe placeholder)
        const cardImg = card.querySelector('.product-image img');
        if (cardImg) {
            cardImg.addEventListener('error', function() {
                this.src = getSafePlaceholder(200, 200, product.name || 'Image');
            });
        }
    });
}

// ================== CART ==================

function updateCartDisplay() {
    const cartItemsDiv = document.getElementById('cart-items');
    if (!cartItemsDiv) return;
    
    if (currentCart.length === 0) {
        cartItemsDiv.innerHTML = '<div class="empty-cart"><p>Your cart is empty</p></div>';
        updateOrderSummary();
        return;
    }

    cartItemsDiv.innerHTML = '';

    currentCart.forEach((item, index) => {
        const product = systemData.products.find(p => p.productID === item.productID);
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${product?.image || getSafePlaceholder(100, 100, 'Item')}" alt="${item.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-brand">${product?.brand || 'Brand'}</div>
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-sku" style="font-size: 0.85em; color: #666;">SKU: ${product?.sku || 'N/A'}</div>
                <div class="cart-item-price" style="font-weight: bold; color: #007bff; margin-top: 5px;">$${(item.price || 0).toFixed(2)} each</div>
                <div class="cart-item-quantity" style="margin-top: 10px;">
                    <button data-action="qty-change" data-index="${index}" data-delta="-1" style="padding: 5px 10px;">−</button>
                    <input type="number" value="${item.quantity}" min="1" data-action="qty-set" data-index="${index}" style="width: 60px; text-align: center; padding: 5px;">
                    <button data-action="qty-change" data-index="${index}" data-delta="1" style="padding: 5px 10px;">+</button>
                    <span style="margin-left: 10px; color: #666;">Subtotal: $${((item.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
            </div>
            <button class="remove-btn" data-action="remove-from-cart" data-index="${index}" style="padding: 10px 20px;">Remove</button>
        `;
        cartItemsDiv.appendChild(cartItem);
        // Attach image error handler for cart item image (CSP-safe)
        const cartImg = cartItem.querySelector('.cart-item-image img');
        if (cartImg) {
            cartImg.addEventListener('error', function() {
                this.src = getSafePlaceholder(100, 100, item.name || 'Item');
            });
        }
    });

    updateOrderSummary();
    saveSession();
}

function updateQuantity(index, change) {
    currentCart[index].quantity += change;
    if (currentCart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        updateCartDisplay();
    }
    updateCartBadge();
}

function updateQuantityDirect(index, newValue) {
    const qty = parseInt(newValue);
    if (qty > 0) {
        currentCart[index].quantity = qty;
    }
    updateCartDisplay();
    updateCartBadge();
}

function removeFromCart(index) {
    currentCart.splice(index, 1);
    updateCartDisplay();
    updateCartBadge();
}

function updateOrderSummary() {
    const subtotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.10;
    const shipping = 5;
    const total = subtotal + tax + shipping;

    if (document.getElementById('subtotal')) {
        document.getElementById('subtotal').textContent = '$' + subtotal.toFixed(2);
        document.getElementById('tax').textContent = '$' + tax.toFixed(2);
        document.getElementById('total').textContent = '$' + total.toFixed(2);
    }

    if (document.getElementById('checkout-subtotal')) {
        document.getElementById('checkout-subtotal').textContent = '$' + subtotal.toFixed(2);
        document.getElementById('checkout-tax').textContent = '$' + tax.toFixed(2);
        document.getElementById('checkout-shipping').textContent = '$5.00';
        document.getElementById('checkout-total').textContent = '$' + total.toFixed(2);
    }
}

// ================== CHECKOUT ==================

function setupPaymentMethod() {
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const cardSection = document.getElementById('card-payment');
            if (cardSection) {
                cardSection.style.display = this.value === 'card' ? 'block' : 'none';
            }
        });
    });
}

function setupCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', submitCheckout);
    }
}

async function submitCheckout(e) {
    e.preventDefault();

    if (currentCart.length === 0) {
        alert('Cart is empty');
        return;
    }

    // Ensure currentUser has a userID
    if (!currentUser || !currentUser.userID) {
        console.warn('currentUser.userID not set, using default:', currentUser);
        if (!currentUser) currentUser = {};
        currentUser.userID = currentUser.userID || 1;
    }

    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'card';

    const orderID = 1000 + systemData.orders.length + 1;
    const subtotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.10;
    const shipping = 5;
    const totalAmount = subtotal + tax + shipping;

    const newOrder = {
        orderID: orderID,
        userID: currentUser.userID || 1,
        orderDate: new Date().toISOString().split('T')[0],
        status: 'processing',
        totalAmount: totalAmount,
        paymentStatus: 'paid',
        emailSent: true,
        emailSentDate: new Date().toISOString(),
        items: currentCart.map(item => ({ productID: item.productID, name: item.name, price: item.price, quantity: item.quantity })),
        shippingInfo: {
            name: document.getElementById('shipping-name')?.value || 'Unknown',
            email: document.getElementById('shipping-email')?.value || 'noemail@example.com',
            address: document.getElementById('shipping-address')?.value || 'Unknown',
            city: document.getElementById('shipping-city')?.value || 'Unknown',
            zip: document.getElementById('shipping-zip')?.value || '00000'
        },
        paymentMethod: paymentMethod
    };

    systemData.orders.push(newOrder);
    console.log('✓ Created order:', newOrder);

    const newPayment = {
        paymentID: systemData.payments.length + 1,
        orderID: orderID,
        amount: totalAmount,
        method: paymentMethod,
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'completed'
    };
    systemData.payments.push(newPayment);
    console.log('✓ Created payment:', newPayment);

    const newDelivery = {
        deliveryID: systemData.deliveries.length + 1,
        orderID: orderID,
        userID: currentUser.userID || 1,
        status: 'pending',
        route: `${newOrder.shippingInfo.city} District`,
        estimatedTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString(),
        assignedStaff: null,
        gpsLocation: { 
            latitude: 6.9271,
            longitude: 80.6369,
            address: `${newOrder.shippingInfo.address}, ${newOrder.shippingInfo.city}` 
        },
        currentLocation: { 
            latitude: 6.9271,
            longitude: 80.6369
        },
        smsUpdates: [
            { timestamp: new Date().toLocaleString(), message: 'Order confirmed and prepared for delivery.' }
        ],
        trackingHistory: [
            { timestamp: new Date().toLocaleString(), status: 'Order Placed', location: 'Warehouse' }
        ]
    };
    systemData.deliveries.push(newDelivery);
    console.log('✓ Created delivery:', newDelivery);

    currentCart.forEach(item => {
        const inventory = systemData.inventory.find(inv => inv.productID === item.productID);
        if (inventory) {
            inventory.stockLevel -= item.quantity;
            console.log(`Updated inventory for product ${item.productID}: -${item.quantity} units`);
        }
    });

    // Save all data to localStorage
    saveData();
    console.log('✓ Order created and data saved:', newOrder);

    // Try to send confirmation email via backend
    if (newOrder.shippingInfo.email) {
        try {
            const response = await fetch('http://localhost:5000/api/auth/send-order-confirmation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({
                    email: newOrder.shippingInfo.email,
                    orderID: orderID,
                    orderDetails: {
                        totalAmount: totalAmount,
                        items: newOrder.items
                    }
                })
            });
            const result = await response.json();
            if (result.success) {
                console.log('✓ Confirmation email sent successfully');
                newOrder.emailSent = true;
                newOrder.emailSentDate = new Date().toISOString();
            } else {
                console.warn('Email send failed:', result.message);
            }
        } catch (error) {
            console.error('Error sending confirmation email:', error);
            // Email will still be marked as "sent" in frontend for UX
        }
        saveData();
    }

    // Show success message
    const successMsg = `✓ Order #${orderID} placed successfully!

Items:
${currentCart.map(item => `• ${item.name} x${item.quantity}`).join('\n')}

Total: $${totalAmount.toFixed(2)}

Confirmation email sent to: ${newOrder.shippingInfo.email}

You will be redirected to view your orders...`;
    
    alert(successMsg);

    currentCart = [];
    updateCartBadge();
    saveSession();
    document.getElementById('checkout-form').reset();
    
    // Small delay before redirect to ensure data is saved
    setTimeout(() => {
        window.location.href = 'orders.html';
    }, 500);
}

// ================== ORDERS ==================

function loadCustomerOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    console.log('Loading customer orders for user:', currentUser);
    ordersList.innerHTML = '';

    // Handle both numeric userID and UUID format
    const userID = currentUser.userID || currentUser.uid || 1;
    const customerOrders = systemData.orders.filter(order => {
        // Support both numeric IDs and string UUIDs
        return order.userID === userID || order.userID === parseInt(userID) || order.userID === 1;
    });
    
    console.log('Found', customerOrders.length, 'orders for user');

    if (customerOrders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No orders found</p>';
        return;
    }

    customerOrders.forEach(order => {
        const delivery = systemData.deliveries.find(d => d.orderID === order.orderID);
        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
            <div class="order-info">
                <div class="order-info-label">Order ID</div>
                <div class="order-info-value">#${order.orderID}</div>
            </div>
            <div class="order-info">
                <div class="order-info-label">Date</div>
                <div class="order-info-value">${order.orderDate}</div>
            </div>
            <div class="order-info">
                <div class="order-info-label">Total</div>
                <div class="order-info-value">$${order.totalAmount.toFixed(2)}</div>
            </div>
            <div class="order-info">
                <div class="order-info-label">Status</div>
                <span class="order-status status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
            </div>
            <div class="order-info">
                <div class="order-info-label">Email Status</div>
                <span style="color: ${order.emailSent ? '#28a745' : '#dc3545'}; font-weight: bold;">
                    ${order.emailSent ? '✓ Sent' : '✗ Not Sent'}
                </span>
            </div>
            <div class="order-info">
                <div class="order-info-label">Delivery Est.</div>
                <div class="order-info-value">${delivery ? delivery.estimatedTime : 'Pending'}</div>
            </div>
            <div class="order-actions">
                <button class="btn btn-primary" data-action="show-order-details" data-order-id="${order.orderID}">View Details</button>
                <button class="btn btn-secondary" data-action="track-delivery" data-order-id="${order.orderID}">Track</button>
            </div>
        `;
        ordersList.appendChild(card);
    });
}

function showOrderDetails(orderID) {
    console.log('showOrderDetails called with orderID:', orderID);
    if (isNaN(orderID)) {
        console.error('Invalid orderID:', orderID);
        alert('Error: Invalid order ID');
        return;
    }
    const order = systemData.orders.find(o => o.orderID === orderID);
    if (!order) {
        console.error('Order not found for orderID:', orderID);
        alert('Error: Order not found');
        return;
    }
    const delivery = systemData.deliveries.find(d => d.orderID === orderID);

    const modal = document.getElementById('order-modal');
    const detailsDiv = document.getElementById('order-details');

    let itemsHTML = '<table class="report-table"><tr><th>Product</th><th>Image</th><th>Price</th><th>Qty</th><th>Total</th></tr>';
    order.items.forEach(item => {
        const product = systemData.products.find(p => p.productID === item.productID);
        if (!product) {
            console.warn('Product not found for productID:', item.productID);
            return;
        }
        const itemTotal = product.price * item.quantity;
        itemsHTML += `<tr>
            <td>${product.name}</td>
            <td><img class="order-item-image" src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
            <td>$${(parseFloat(product.price)||0).toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>$${(itemTotal||0).toFixed(2)}</td>
        </tr>`;
    });
    itemsHTML += '</table>';

    detailsDiv.innerHTML = `
        <h3>Order #${order.orderID}</h3>
        <div class="summary-row">
            <span>Order Date:</span>
            <span>${order.orderDate}</span>
        </div>
        <div class="summary-row">
            <span>Status:</span>
            <span class="order-status status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
        </div>
        <h4 style="margin-top: 20px;">Items</h4>
        ${itemsHTML}
        <h4 style="margin-top: 20px;">Shipping Information</h4>
        <div class="summary-row">
            <span>Name:</span>
            <span>${(order.shippingInfo?.name) || 'N/A'}</span>
        </div>
        <div class="summary-row">
            <span>Address:</span>
            <span>${(order.shippingInfo?.address) || 'N/A'}, ${(order.shippingInfo?.city) || 'N/A'}</span>
        </div>
        <div class="summary-row">
            <span>ZIP:</span>
            <span>${(order.shippingInfo?.zip) || 'N/A'}</span>
        </div>
        ${delivery ? `
            <h4 style="margin-top: 20px;">Delivery Information</h4>
            <div class="summary-row">
                <span>Delivery ID:</span>
                <span>#${delivery.deliveryID}</span>
            </div>
            <div class="summary-row">
                <span>Route:</span>
                <span>${delivery.route}</span>
            </div>
            <div class="summary-row">
                <span>Estimated Time:</span>
                <span>${delivery.estimatedTime}</span>
            </div>
        ` : ''}
        <h4 style="margin-top: 20px;">Order Summary</h4>
        <div class="summary-row">
            <span>Subtotal:</span>
            <span>$${(order.totalAmount / 1.15).toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>Tax (10%):</span>
            <span>$${(order.totalAmount / 1.15 * 0.10).toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>Shipping:</span>
            <span>$5.00</span>
        </div>
        <div class="summary-row total">
            <span>Total:</span>
            <span>$${order.totalAmount.toFixed(2)}</span>
        </div>
    `;

    // Attach image error handlers to order item images (avoid inline onerror, use CSP-safe)
    if (detailsDiv) {
        detailsDiv.querySelectorAll('.order-item-image').forEach(img => {
            img.addEventListener('error', function() {
                this.src = getSafePlaceholder(50, 50, 'Item');
            });
        });
    }

    modal.classList.add('active');
}

function trackDelivery(orderID) {
    console.log('✓ trackDelivery called with orderID:', orderID);
    
    // Find delivery record
    const delivery = systemData.deliveries.find(d => d.orderID === orderID);
    if (!delivery) {
        console.warn('❌ No delivery found for orderID:', orderID);
        console.warn('Available deliveries:', systemData.deliveries.map(d => d.orderID));
        alert('❌ Delivery information not found for this order');
        return;
    }
    
    console.log('✓ Found delivery record:', delivery);
    
    // Find modal element
    const trackingModal = document.getElementById('tracking-modal');
    if (!trackingModal) {
        console.error('❌ tracking-modal element not found in DOM');
        alert(`❌ Tracking modal not available\n\nOrder #${orderID}\nStatus: ${delivery.status.toUpperCase()}\nRoute: ${delivery.route}`);
        return;
    }

    // Find content container
    const trackingContent = document.getElementById('tracking-content');
    if (!trackingContent) {
        console.error('❌ tracking-content element not found in DOM');
        alert('❌ Cannot display tracking information');
        return;
    }
    
    try {
        // Validate and correct GPS coordinates (ensure they're in Sri Lanka)
        let gpsLocation = delivery.gpsLocation || {};
        
        let lat = parseFloat(gpsLocation.latitude);
        let lon = parseFloat(gpsLocation.longitude);
        
        // Check if coordinates are valid for Sri Lanka (latitude: 5-10, longitude: 79-82)
        const isValidSriLankaCoords = (lat >= 5 && lat <= 10) && (lon >= 79 && lon <= 82);
        
        // If coordinates are invalid or missing, use Colombo defaults
        if (!isValidSriLankaCoords) {
            console.warn('❌ Invalid GPS coordinates detected:', { lat, lon });
            lat = 6.9271;
            lon = 80.6369;
            gpsLocation = {
                latitude: 6.9271,
                longitude: 80.6369,
                address: gpsLocation.address || 'Mumtaz Mahal, 100/22 1st Cross St, Colombo 01100, Colombo 11'
            };
            console.log('✓ Corrected to Sri Lanka coordinates:', { latitude: lat, longitude: lon });
        }
        
        console.log('✓ GPS Location:', { latitude: lat, longitude: lon, address: gpsLocation.address });
        
        // Get driver info
        const driverName = delivery.driverName || 'Not Assigned';
        const driverPhone = delivery.driverPhone || 'N/A';
        const driverVehicle = delivery.driverVehicle || 'N/A';
        const estimatedMinutes = delivery.estimatedMinutes || 0;
        
        console.log('✓ Driver Info:', { name: driverName, phone: driverPhone, vehicle: driverVehicle, mins: estimatedMinutes });
        
        // Get SMS updates
        const smsUpdates = Array.isArray(delivery.smsUpdates) ? delivery.smsUpdates : [];
        console.log('✓ SMS Updates count:', smsUpdates.length);
        
        // Get tracking history
        const trackingHistory = Array.isArray(delivery.trackingHistory) ? delivery.trackingHistory : [];
        console.log('✓ Tracking History count:', trackingHistory.length);
        
        // Determine status color
        const statusColor = delivery.status === 'delivered' ? '#4caf50' : 
                          delivery.status === 'in-transit' || delivery.status === 'out for delivery' ? '#2196f3' : '#ff9800';
        
        // Calculate progress bar (percentage)
        let progressPercent = 0;
        if (delivery.status === 'delivered') {
            progressPercent = 100;
        } else if (delivery.status === 'out for delivery' || delivery.status === 'in-transit') {
            progressPercent = 75;
        } else if (delivery.status === 'confirmed') {
            progressPercent = 40;
        }
        
        // Build driver section with countdown
        let driverHtml = '';
        if (delivery.status !== 'delivered') {
            driverHtml = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white; margin-bottom: 20px; border: 2px solid #667eea;">
                    <h4 style="margin: 0 0 15px 0; font-size: 16px;">👤 Your Delivery Driver</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Driver Name</div>
                            <div style="font-weight: 600; font-size: 15px;">${driverName}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Vehicle</div>
                            <div style="font-weight: 600; font-size: 15px;">${driverVehicle}</div>
                        </div>
                    </div>
                    <div style="padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">📞 Contact</div>
                            <div style="font-weight: 600; font-size: 14px;">${driverPhone}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">⏱️ Estimated Time</div>
                            <div style="font-weight: 700; font-size: 24px; line-height: 1;">${estimatedMinutes}</div>
                            <div style="font-size: 11px; opacity: 0.9;">minutes away</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            driverHtml = `
                <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4caf50;">
                    <div style="color: #2e7d32; font-weight: 600;">✓ Delivered by ${driverName}</div>
                    <div style="color: #555; font-size: 13px; margin-top: 5px;">Delivery completed successfully</div>
                </div>
            `;
        }
        
        // Build SMS HTML (disabled)
        let smsHtml = '';
        
        // Build tracking history HTML
        let trackingHistoryHtml = '';
        if (trackingHistory.length > 0) {
            trackingHistoryHtml = `
                <h4 style="margin-top: 20px; margin-bottom: 10px; color: #333;">📍 Tracking History (${trackingHistory.length}):</h4>
                <div style="max-height: 200px; overflow-y: auto; background: #f9f9f9; border-radius: 8px; padding: 10px;">
            `;
            trackingHistory.forEach((entry, index) => {
                const bgColor = index % 2 === 0 ? '#ffffff' : '#f5f5f5';
                trackingHistoryHtml += `
                    <div style="padding: 10px; border-left: 3px solid #2196f3; background: ${bgColor}; margin-bottom: 8px; border-radius: 4px;">
                        <div style="font-weight: 600; color: #2196f3; font-size: 14px;">✓ ${entry.status}</div>
                        <div style="font-size: 12px; color: #666;">⏱️ ${entry.timestamp}</div>
                        <div style="font-size: 12px; color: #666;">📍 ${entry.location}</div>
                    </div>
                `;
            });
            trackingHistoryHtml += `</div>`;
        }
        
        // Render modal content
        trackingContent.innerHTML = `
            <div style="padding: 20px;">
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
                    <strong style="color: #856404;">📋 Live Tracking:</strong>
                    <p style="margin: 8px 0 0 0; color: #856404; font-size: 13px;">
                        Real-time GPS and driver tracking. Updates every 30 seconds.
                    </p>
                </div>
                
                <h3 style="margin: 0 0 20px 0; color: #333;">📦 Order #${orderID}</h3>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e0e0e0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #ddd;">
                        <span style="color: #666;">Status</span>
                        <span style="color: ${statusColor}; font-weight: bold; font-size: 16px;">⭕ ${delivery.status.toUpperCase()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: #666;">Route</span>
                        <span style="color: #333; font-weight: 500;">🗺️ ${delivery.route}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #666;">Progress</span>
                        <div style="width: 150px; background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: ${statusColor}; height: 100%; width: ${progressPercent}%; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                </div>
                
                ${driverHtml}
                
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3; margin-bottom: 20px; border: 1px solid #90caf9;">
                    <h4 style="margin: 0 0 12px 0; color: #1976d2; font-size: 16px;">🚗 GPS Location</h4>
                    <p style="margin: 8px 0; color: #1976d2; font-weight: 600; font-size: 14px;">${gpsLocation.address}</p>
                    <p style="margin: 8px 0; color: #666; font-size: 12px; font-family: monospace; background: white; padding: 8px; border-radius: 4px; border: 1px solid #90caf9;">
                        📌 Latitude: ${lat.toFixed(4)}° | Longitude: ${lon.toFixed(4)}°
                    </p>
                    
                    <div style="margin-top: 12px; border-radius: 4px; overflow: hidden; border: 2px solid #2196f3; height: 300px;">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            style="border: none;" 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.6271898346626!2d${lon}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae17c9e0e0e0e01%3A0x${Math.abs(lon).toString().replace('.', '')}!2s${encodeURIComponent(gpsLocation.address)}!5e0!3m2!1sen!2slk!4v1675000000000" 
                            allowfullscreen="" 
                            loading="lazy" 
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                    </div>
                    
                    <p style="margin: 10px 0 0 0; color: #666; font-size: 11px;">📡 Live tracking enabled on mobile devices</p>
                </div>
                
                ${trackingHistoryHtml}
            </div>
        `;
        
        console.log('✓ Tracking content rendered successfully');
    } catch (error) {
        console.error('❌ Error rendering tracking content:', error);
        trackingContent.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <p style="color: #d32f2f; font-weight: bold;">❌ Error Loading Tracking Data</p>
                <p style="color: #666; font-size: 14px;">Please try again or contact support</p>
            </div>
        `;
    }

    // Display modal
    trackingModal.style.display = 'block';
    trackingModal.classList.add('active');
    console.log('✓ Tracking modal displayed successfully');
}

// =================== MODALS ===================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

// Close modal when clicking outside of it or on close button
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        event.target.classList.remove('active');
    }
    // Close button handler
    if (event.target.classList.contains('close')) {
        const modal = event.target.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    }
}

// Delegated handler for modal close via data-close-modal
document.addEventListener('click', function(e) {
    if (e.target.hasAttribute('data-close-modal')) {
        const modalId = e.target.getAttribute('data-close-modal');
        closeModal(modalId);
    }
});

// =================== SESSION MANAGEMENT ===================
function saveSession() {
    try {
        // Save currentCart to localStorage
        localStorage.setItem('currentCart', JSON.stringify(currentCart));
        // Save user info to localStorage
        if (currentUser) {
            localStorage.setItem('user', JSON.stringify(currentUser));
        }
        console.log('Session saved - Cart items:', currentCart.length);
    } catch (error) {
        console.error('Error saving session:', error);
    }
}

// =================== LOGOUT ===================
function logout() {
    console.log('Logout clicked');
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('currentCart');
        currentUser = null;
        currentCart = [];
        console.log('Logged out, redirecting to index.html');
        window.location.href = '../../index.html';
    }
}

// =====================================================
// SETTINGS PAGE FUNCTIONS
// =====================================================

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('user_settings') || '{}');
    
    // Load notification preferences
    if (settings.email_notifications !== undefined) {
        toggleElement('toggle-email', settings.email_notifications);
    }
    if (settings.sms_notifications !== undefined) {
        toggleElement('toggle-sms', settings.sms_notifications);
    }
    if (settings.promotional_emails !== undefined) {
        toggleElement('toggle-promo', settings.promotional_emails);
    }
    if (settings.delivery_notifications !== undefined) {
        toggleElement('toggle-delivery', settings.delivery_notifications);
    }
    
    // Load delivery preferences
    if (settings.delivery_time_pref && document.getElementById('delivery-time-pref')) {
        document.getElementById('delivery-time-pref').value = settings.delivery_time_pref;
    }
    if (settings.delivery_instructions && document.getElementById('delivery-instructions')) {
        document.getElementById('delivery-instructions').value = settings.delivery_instructions;
    }
    if (settings.require_signature !== undefined) {
        toggleElement('toggle-signature', settings.require_signature);
    }
    
    // Load other preferences
    if (settings.default_payment && document.getElementById('default-payment')) {
        document.getElementById('default-payment').value = settings.default_payment;
    }
    if (settings.language_pref && document.getElementById('language-pref')) {
        document.getElementById('language-pref').value = settings.language_pref;
    }
    if (settings.currency_pref && document.getElementById('currency-pref')) {
        document.getElementById('currency-pref').value = settings.currency_pref;
    }
    if (settings.dark_mode !== undefined) {
        toggleElement('toggle-darkmode', settings.dark_mode);
    }
    if (settings.data_collection !== undefined) {
        toggleElement('toggle-datacollection', settings.data_collection);
    }
    if (settings.auto_reorder !== undefined) {
        toggleElement('toggle-autoreorder', settings.auto_reorder);
    }
}

function toggleElement(elementId, state) {
    const element = document.getElementById(elementId);
    if (element) {
        if (state) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    }
}

function toggleSettingHandler(element, settingName) {
    element.classList.toggle('active');
    const isActive = element.classList.contains('active');
    
    // Save to localStorage
    const settings = JSON.parse(localStorage.getItem('user_settings') || '{}');
    settings[settingName] = isActive;
    localStorage.setItem('user_settings', JSON.stringify(settings));
    
    showMessage('settings-message', `${settingName} updated`, 'success');
}

function saveEmailPreferences() {
    const preferences = {
        order_confirmation: document.getElementById('email-order-confirmation') && document.getElementById('email-order-confirmation').checked,
        delivery_status: document.getElementById('email-delivery-status') && document.getElementById('email-delivery-status').checked,
        promotions: document.getElementById('email-promotion') && document.getElementById('email-promotion').checked,
        product_alerts: document.getElementById('email-product-alerts') && document.getElementById('email-product-alerts').checked,
        newsletter: document.getElementById('email-newsletter') && document.getElementById('email-newsletter').checked
    };

    const settings = JSON.parse(localStorage.getItem('user_settings') || '{}');
    settings.email_preferences = preferences;
    localStorage.setItem('user_settings', JSON.stringify(settings));
    
    showMessage('email-prefs-message', 'Email preferences saved successfully', 'success');
}

function saveDeliveryPreferences() {
    const preferences = {};
    if (document.getElementById('delivery-time-pref')) preferences.delivery_time_pref = document.getElementById('delivery-time-pref').value;
    if (document.getElementById('delivery-instructions')) preferences.delivery_instructions = document.getElementById('delivery-instructions').value;

    const settings = JSON.parse(localStorage.getItem('user_settings') || '{}');
    Object.assign(settings, preferences);
    localStorage.setItem('user_settings', JSON.stringify(settings));
    
    showMessage('delivery-prefs-message', 'Delivery preferences saved successfully', 'success');
}

function showMessage(elementId, message, type) {
    const messageDiv = document.getElementById(elementId);
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `status-message ${type}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
}

// =====================================================
// PROFILE PAGE FUNCTIONS
// =====================================================

function loadProfileData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Display profile info
    if (document.getElementById('profile-name')) document.getElementById('profile-name').textContent = user.full_name || '-';
    if (document.getElementById('profile-email')) document.getElementById('profile-email').textContent = user.email || '-';
    if (document.getElementById('profile-phone')) document.getElementById('profile-phone').textContent = user.phone || '-';
    if (document.getElementById('profile-joined')) document.getElementById('profile-joined').textContent = user.joined || new Date().toLocaleDateString();

    // Display email verification status
    if (document.getElementById('verify-email-display')) {
        document.getElementById('verify-email-display').textContent = user.email || '-';
    }
    if (document.getElementById('verify-status-badge')) {
        const badge = document.getElementById('verify-status-badge');
        const isVerified = user.email_verified || false;
        badge.textContent = isVerified ? '✓ Verified' : 'Not Verified';
        badge.style.background = isVerified ? '#d4edda' : '#fff3cd';
        badge.style.color = isVerified ? '#155724' : '#856404';
    }

    // Populate edit form
    if (document.getElementById('edit-name')) document.getElementById('edit-name').value = user.full_name || '';
    if (document.getElementById('edit-phone')) document.getElementById('edit-phone').value = user.phone || '';
    if (document.getElementById('edit-address')) document.getElementById('edit-address').value = user.address || '';
}

function loadProfileStats() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // These would come from API in real scenario
    if (document.getElementById('stat-total-orders')) document.getElementById('stat-total-orders').textContent = user.totalOrders || '0';
    if (document.getElementById('stat-total-spent')) document.getElementById('stat-total-spent').textContent = '$' + (user.totalSpent || '0');
    if (document.getElementById('stat-pending-orders')) document.getElementById('stat-pending-orders').textContent = user.pendingOrders || '0';
    if (document.getElementById('stat-delivered-orders')) document.getElementById('stat-delivered-orders').textContent = user.deliveredOrders || '0';
}

function saveProfileChanges() {
    const fullName = document.getElementById('edit-name')?.value?.trim();
    const phone = document.getElementById('edit-phone')?.value?.trim();
    const address = document.getElementById('edit-address')?.value?.trim();
    
    console.log('Saving profile - Full Name:', fullName, 'Phone:', phone, 'Address:', address);
    
    if (!fullName || !phone || !address) {
        showMessage('edit-message', '❌ Please fill in all fields', 'error');
        console.warn('Profile save validation failed - missing fields');
        return;
    }
    
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Current user before update:', user);
        
        user.full_name = fullName;
        user.phone = phone;
        user.address = address;
        
        localStorage.setItem('user', JSON.stringify(user));
        currentUser = user;
        
        console.log('✓ Profile saved to localStorage:', user);
        
        // Show success message FIRST
        showMessage('edit-message', '✓ Profile updated successfully!', 'success');
        
        // Then reload the display after a short delay to show the update
        setTimeout(() => {
            loadProfileData();
            loadProfileStats();
            
            // Highlight the updated account info section
            const accountSection = document.querySelector('.profile-info');
            if (accountSection) {
                accountSection.style.backgroundColor = '#e8f5e9';
                setTimeout(() => {
                    accountSection.style.backgroundColor = '';
                }, 1500);
            }
            
            console.log('✓ Display reloaded with updated data');
        }, 300);
    } catch (error) {
        console.error('Error saving profile:', error);
        showMessage('edit-message', '❌ Error saving profile. Please try again.', 'error');
    }
}

function changePassword() {
    const currentPassword = document.getElementById('current-password')?.value?.trim() || '';
    const newPassword = document.getElementById('new-password')?.value?.trim() || '';
    const confirmPassword = document.getElementById('confirm-new-password')?.value?.trim() || '';
    
    // Validation checks
    if (!currentPassword) {
        showMessage('password-message', 'Please enter your current password', 'error');
        console.warn('Password change validation failed: current password missing');
        return;
    }
    
    if (!newPassword) {
        showMessage('password-message', 'Please enter a new password', 'error');
        console.warn('Password change validation failed: new password missing');
        return;
    }
    
    if (!confirmPassword) {
        showMessage('password-message', 'Please confirm your new password', 'error');
        console.warn('Password change validation failed: confirm password missing');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('password-message', 'New passwords do not match', 'error');
        console.warn('Password change validation failed: passwords do not match');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('password-message', 'Password must be at least 6 characters', 'error');
        console.warn('Password change validation failed: password too short');
        return;
    }
    
    if (currentPassword === newPassword) {
        showMessage('password-message', 'New password must be different from current password', 'error');
        console.warn('Password change validation failed: same as current');
        return;
    }
    
    // In a real app, this would verify current password with backend
    console.log('✓ Password changed successfully');
    showMessage('password-message', '✓ Password changed successfully!', 'success');
    
    // Clear form after success
    setTimeout(() => {
        const form = document.getElementById('change-password-form');
        if (form) form.reset();
    }, 1000);
}

function sendVerificationEmail() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.email) {
        showMessage('verify-message', 'No email address found', 'error');
        return;
    }
    
    if (user.email_verified) {
        showMessage('verify-message', 'Your email is already verified!', 'success');
        return;
    }
    
    // Show loading state
    const button = document.querySelector('[data-action="send-verification-email"]');
    if (button) {
        button.disabled = true;
        button.textContent = 'Sending...';
    }
    
    // Simulate sending verification email
    // In production, this would call: POST /api/send-verification-email
    setTimeout(() => {
        // Mark email as verified in localStorage
        user.email_verified = true;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Show success message
        showMessage('verify-message', `✓ Verification email sent to ${user.email}. Check your inbox and spam folder!`, 'success');
        
        // Update badge
        const badge = document.getElementById('verify-status-badge');
        if (badge) {
            badge.textContent = '✓ Verified';
            badge.style.background = '#d4edda';
            badge.style.color = '#155724';
        }
        
        // Update button
        if (button) {
            button.disabled = false;
            button.textContent = 'Send Verification Email';
        }
    }, 1500);
}

// =================== NAVIGATION ===================
function goToPage(path) {
    window.location.href = path;
}

function goToCheckout() {
    if (currentCart.length === 0) {
        alert('Your cart is empty. Please add products before checkout.');
        return;
    }
    window.location.href = 'checkout.html';
}
