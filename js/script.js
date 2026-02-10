// =====================================================
// RDC SYSTEM - JAVASCRIPT APPLICATION
// =====================================================

// CSP-safe placeholder image generator (data: URI with SVG)
function getSafePlaceholder(width = 200, height = 200, text = 'Image') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
        `<rect width="${width}" height="${height}" fill="#e0e0e0"/>` +
        `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="#999">` +
        `${String(text).substring(0, 20)}` +
        `</text></svg>`;
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

// Helper: get inventory record for a given productID (safe when systemData isn't ready)
function getInventoryForProduct(productID) {
    try {
        if (typeof window.systemData === 'undefined' || !window.systemData || !window.systemData.inventory) return null;
        return window.systemData.inventory.find(inv => inv.productID === productID) || null;
    } catch (e) {
        console.warn('getInventoryForProduct error', e);
        return null;
    }
}

// ================== DATA STORAGE ==================
// Ensure a single global `systemData` object exists. Attach to `window` and create
// a `var systemData` binding so other non-module scripts can use the plain identifier.
if (typeof window.systemData === 'undefined') {
    window.systemData = {
        users: [
            { userID: 1, name: 'John Customer', email: 'customer@email.com', password: 'pass123', role: 'customer' },
            { userID: 2, name: 'Admin User', email: 'admin@email.com', password: 'admin123', role: 'admin' },
            { userID: 3, name: 'RDC Staff', email: 'rdc@email.com', password: 'rdc123', role: 'rdc_staff' },
            { userID: 4, name: 'Delivery Driver', email: 'delivery@email.com', password: 'delivery123', role: 'delivery_staff' }
        ],
        products: [
            { productID: 1, name: 'Laptop Pro', price: 1299, quantity: 15, description: 'High-performance laptop with latest processor', category: 'Electronics', emoji: '💻' },
            { productID: 2, name: 'Wireless Mouse', price: 45, quantity: 50, description: 'Ergonomic wireless mouse with long battery life', category: 'Electronics', emoji: '🖱️' },
            { productID: 3, name: 'USB-C Cable', price: 12, quantity: 100, description: 'Fast charging USB-C cable 2 meters', category: 'Electronics', emoji: '🔌' },
            { productID: 4, name: 'Winter Jacket', price: 150, quantity: 25, description: 'Warm and comfortable winter jacket', category: 'Clothing', emoji: '🧥' },
            { productID: 5, name: 'Running Shoes', price: 120, quantity: 40, description: 'Professional running shoes with cushioning', category: 'Clothing', emoji: '👟' },
            { productID: 6, name: 'Garden Tools Set', price: 89, quantity: 20, description: 'Complete garden tools set with 10 pieces', category: 'Home', emoji: '🌱' },
            { productID: 7, name: 'Coffee Maker', price: 75, quantity: 18, description: 'Automatic coffee maker with timer', category: 'Home', emoji: '☕' },
            { productID: 8, name: 'JavaScript Book', price: 45, quantity: 35, description: 'Complete guide to JavaScript programming', category: 'Books', emoji: '📚' },
            { productID: 9, name: 'Board Game', price: 30, quantity: 22, description: 'Fun family board game for 2-6 players', category: 'Toys', emoji: '🎲' },
            { productID: 10, name: 'LEGO Set', price: 89, quantity: 28, description: 'Building blocks creative set', category: 'Toys', emoji: '🧩' }
        ],
        orders: [
            { orderID: 1001, userID: 1, orderDate: '2024-01-10', status: 'delivered', totalAmount: 1356, paymentStatus: 'paid', items: [{productID: 1, quantity: 1}, {productID: 2, quantity: 1}] },
            { orderID: 1002, userID: 1, orderDate: '2024-01-12', status: 'shipped', totalAmount: 165, paymentStatus: 'paid', items: [{productID: 4, quantity: 1}] }
        ],
        cart: [],
        inventory: [
            { inventoryID: 1, productID: 1, stockLevel: 15, reorderLevel: 5, lastUpdated: new Date() },
            { inventoryID: 2, productID: 2, stockLevel: 50, reorderLevel: 10, lastUpdated: new Date() },
            { inventoryID: 3, productID: 3, stockLevel: 100, reorderLevel: 20, lastUpdated: new Date() },
            { inventoryID: 4, productID: 4, stockLevel: 25, reorderLevel: 8, lastUpdated: new Date() },
            { inventoryID: 5, productID: 5, stockLevel: 40, reorderLevel: 10, lastUpdated: new Date() },
            { inventoryID: 6, productID: 6, stockLevel: 20, reorderLevel: 5, lastUpdated: new Date() },
            { inventoryID: 7, productID: 7, stockLevel: 18, reorderLevel: 5, lastUpdated: new Date() },
            { inventoryID: 8, productID: 8, stockLevel: 35, reorderLevel: 8, lastUpdated: new Date() },
            { inventoryID: 9, productID: 9, stockLevel: 22, reorderLevel: 5, lastUpdated: new Date() },
            { inventoryID: 10, productID: 10, stockLevel: 28, reorderLevel: 6, lastUpdated: new Date() }
        ],
        deliveries: [
            { deliveryID: 1, orderID: 1001, userID: 1, status: 'delivered', route: 'North District', estimatedTime: '2024-01-11 2:00 PM', assignedStaff: 4 },
            { deliveryID: 2, orderID: 1002, userID: 1, status: 'out for delivery', route: 'South District', estimatedTime: '2024-01-14 3:30 PM', assignedStaff: 4 }
        ],
        payments: [
            { paymentID: 1, orderID: 1001, amount: 1356, method: 'card', paymentDate: '2024-01-10', status: 'completed' },
            { paymentID: 2, orderID: 1002, amount: 165, method: 'card', paymentDate: '2024-01-12', status: 'completed' }
        ]
    };
}

// Create a var binding for legacy scripts that expect a global identifier `systemData`
var systemData = window.systemData;

let currentUser = null;
let currentCart = [];

// ================== AUTHENTICATION ==================

// Handle Login
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const user = systemData.users.find(u => (u.email === email || u.name === email) && u.password === password);

    if (user) {
        currentUser = user;
        currentCart = [];
        
        // Hide login, show navbar and appropriate page
        hidePage('login-page');
        // Ensure navbar is shown by removing the utility 'display-none' class
        document.getElementById('navbar').classList.remove('display-none');
        showUserDashboard();
        
        // Update navbar
        document.getElementById('current-user').textContent = `${user.name} (${formatRole(user.role)})`;
        
        // Set navbar visibility based on role
        updateNavbarForRole(user.role);
        
        // Show appropriate page
        if (user.role === 'customer') {
            showPage('products-page');
            loadProducts();
        } else if (user.role === 'admin') {
            showPage('admin-page');
            loadAdminDashboard();
        } else if (user.role === 'rdc_staff') {
            showPage('rdc-page');
            loadRDCDashboard();
        } else if (user.role === 'delivery_staff') {
            showPage('delivery-page');
            loadDeliveryDashboard();
        }
    } else {
        alert('Invalid credentials. Please try again.');
    }
});

// Handle Logout
document.getElementById('logout-btn').addEventListener('click', function() {
    currentUser = null;
    currentCart = [];
    // Hide navbar by adding the utility 'display-none' class
    document.getElementById('navbar').classList.add('display-none');
    showPage('login-page');
    document.getElementById('login-form').reset();
});

// Update navbar based on role
function updateNavbarForRole(role) {
    // Hide all role-specific buttons
    document.getElementById('nav-products').style.display = 'none';
    document.getElementById('nav-orders').style.display = 'none';
    document.getElementById('nav-admin').style.display = 'none';
    document.getElementById('nav-rdc').style.display = 'none';
    document.getElementById('nav-delivery').style.display = 'none';
    document.getElementById('nav-cart').style.display = 'none';

    // Show role-specific buttons
    if (role === 'customer') {
        document.getElementById('nav-products').style.display = 'inline-block';
        document.getElementById('nav-orders').style.display = 'inline-block';
        document.getElementById('nav-cart').style.display = 'inline-block';
    } else if (role === 'admin') {
        document.getElementById('nav-admin').style.display = 'inline-block';
    } else if (role === 'rdc_staff') {
        document.getElementById('nav-rdc').style.display = 'inline-block';
    } else if (role === 'delivery_staff') {
        document.getElementById('nav-delivery').style.display = 'inline-block';
    }
}

// Format role for display
function formatRole(role) {
    const roles = {
        'customer': 'Customer',
        'admin': 'Administrator',
        'rdc_staff': 'RDC Staff',
        'delivery_staff': 'Delivery Staff'
    };
    return roles[role] || role;
}

// ================== PAGE NAVIGATION ==================

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    // Show target page
    document.getElementById(pageId).classList.add('active');
}

function hidePage(pageId) {
    document.getElementById(pageId).classList.remove('active');
}

function showUserDashboard() {
    // Placeholder for future personalization
}

// Navigation listeners
document.getElementById('nav-products')?.addEventListener('click', function() {
    showPage('products-page');
    loadProducts();
});

document.getElementById('nav-orders')?.addEventListener('click', function() {
    showPage('orders-page');
    loadCustomerOrders();
});

document.getElementById('nav-cart')?.addEventListener('click', function() {
    showPage('cart-page');
    updateCartDisplay();
});

document.getElementById('nav-admin')?.addEventListener('click', function() {
    showPage('admin-page');
    loadAdminDashboard();
});

document.getElementById('nav-rdc')?.addEventListener('click', function() {
    showPage('rdc-page');
    loadRDCDashboard();
});

document.getElementById('nav-delivery')?.addEventListener('click', function() {
    showPage('delivery-page');
    loadDeliveryDashboard();
});

// ================== PRODUCTS MANAGEMENT ==================

function loadProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    systemData.products.forEach(product => {
        const inventory = systemData.inventory.find(inv => inv.productID === product.productID);
        const inStock = inventory && inventory.stockLevel > 0;

        const card = document.createElement('div');
        card.className = 'product-card';
        const imgSrc = (product.image && typeof product.image === 'string') ? product.image : getSafePlaceholder(300, 200, product.name || 'Product');
        card.innerHTML = `
            <div class="product-image">
                <img src="${imgSrc}" alt="${product.name}" loading="lazy" style="width:100%;height:200px;object-fit:cover;border-radius:6px;">
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.category}</div>
                <div class="product-price">₨${(parseFloat(product.price)||0).toFixed(2)}</div>
                <div class="product-availability ${inStock ? 'in-stock' : 'out-stock'}">
                    ${inStock ? `✓ In Stock (${inventory.stockLevel} available)` : '✗ Out of Stock'}
                </div>
                <div class="product-actions">
                    <button class="view-details-btn" onclick="showProductDetails(${product.productID})">Details</button>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.productID})" ${!inStock ? 'disabled' : ''}>
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
        const cardImg = card.querySelector('.product-image img');
        if (cardImg) {
            cardImg.addEventListener('error', function() {
                this.src = getSafePlaceholder(300, 200, product.name || 'Image');
            });
        }
    });
}

function showProductDetails(productID) {
    const product = systemData.products.find(p => p.productID === productID);
    const inventory = systemData.inventory.find(inv => inv.productID === productID);
    const inStock = inventory && inventory.stockLevel > 0;

    const modal = document.getElementById('product-modal');
    const detailsDiv = document.getElementById('product-details');

    const detailsImg = (product.image && typeof product.image === 'string') ? product.image : getSafePlaceholder(400, 300, product.name || 'Product');
    detailsDiv.innerHTML = `
        <div class="product-details-container">
            <div class="product-details-image"><img src="${detailsImg}" alt="${product.name}" loading="lazy" style="width:100%;height:300px;object-fit:cover;border-radius:8px;"></div>
            <div class="product-details-info">
                <h2>${product.name}</h2>
                <div class="product-details-category">${product.category}</div>
                <div class="product-details-price">₨${(parseFloat(product.price)||0).toFixed(2)}</div>
                <div class="product-details-availability ${inStock ? 'in-stock' : 'out-stock'}">
                    ${inStock ? `✓ In Stock (${inventory.stockLevel} available)` : '✗ Out of Stock'}
                </div>
                <div class="product-details-description">${product.description}</div>
                <div class="product-quantity-input">
                    <button onclick="document.getElementById('qty-input').value = Math.max(1, parseInt(document.getElementById('qty-input').value) - 1)">−</button>
                    <input type="number" id="qty-input" value="1" min="1" max="${inventory?.stockLevel || 1}">
                    <button onclick="document.getElementById('qty-input').value = Math.min(${inventory?.stockLevel || 1}, parseInt(document.getElementById('qty-input').value) + 1)">+</button>
                </div>
                <button class="btn btn-primary" onclick="addToCartWithQty(${product.productID})" ${!inStock ? 'disabled' : ''}>
                    Add to Cart
                </button>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

function addToCart(productID) {
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

    updateCartBadge();
    alert('Product added to cart!');
}

function addToCartWithQty(productID) {
    const qty = parseInt(document.getElementById('qty-input').value);
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
    closeModal('product-modal');
    alert('Product added to cart!');
}

function updateCartBadge() {
    const total = currentCart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-badge').textContent = total;
}

// Search and Filter
document.getElementById('search-input')?.addEventListener('keyup', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const category = document.getElementById('category-filter').value;
    const priceRange = document.getElementById('price-filter').value;

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
});

document.getElementById('category-filter')?.addEventListener('change', triggerSearch);
document.getElementById('price-filter')?.addEventListener('change', triggerSearch);
document.getElementById('sort-filter')?.addEventListener('change', function(e) {
    let sorted = [...systemData.products];
    
    switch(e.target.value) {
        case 'price-low':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'popularity':
            sorted.sort(() => Math.random() - 0.5);
            break;
    }

    displayFilteredProducts(sorted);
});

function triggerSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.dispatchEvent(new Event('keyup'));
    }
}

function displayFilteredProducts(products) {
    const grid = document.getElementById('products-grid');
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
        card.innerHTML = `
            <div class="product-image">${product.emoji}</div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.category}</div>
                <div class="product-price">₨${product.price.toFixed(2)}</div>
                <div class="product-availability ${inStock ? 'in-stock' : 'out-stock'}">
                    ${inStock ? `✓ In Stock (${inventory.stockLevel} available)` : '✗ Out of Stock'}
                </div>
                <div class="product-actions">
                    <button class="view-details-btn" onclick="showProductDetails(${product.productID})">Details</button>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.productID})" ${!inStock ? 'disabled' : ''}>
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ================== CART MANAGEMENT ==================

function updateCartDisplay() {
    const cartItemsDiv = document.getElementById('cart-items');
    
    if (currentCart.length === 0) {
        cartItemsDiv.innerHTML = '<div class="empty-cart"><p>Your cart is empty</p></div>';
        updateOrderSummary();
        return;
    }

    cartItemsDiv.innerHTML = '';

    currentCart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">📦</div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₨${item.price.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button onclick="updateQuantity(${index}, -1)">−</button>
                    <input type="number" value="${item.quantity}" min="1" onchange="updateQuantityDirect(${index}, this.value)">
                    <button onclick="updateQuantity(${index}, 1)">+</button>
                </div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
        `;
        cartItemsDiv.appendChild(cartItem);
    });

    updateOrderSummary();
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

    document.getElementById('subtotal').textContent = '₨' + subtotal.toFixed(2);
    document.getElementById('tax').textContent = '₨' + tax.toFixed(2);
    document.getElementById('total').textContent = '₨' + total.toFixed(2);

    // Update checkout page totals too
    document.getElementById('checkout-subtotal').textContent = '$' + subtotal.toFixed(2);
    document.getElementById('checkout-tax').textContent = '$' + tax.toFixed(2);
    document.getElementById('checkout-shipping').textContent = '$5.00';
    document.getElementById('checkout-total').textContent = '$' + total.toFixed(2);
}

// Cart navigation
document.getElementById('checkout-btn')?.addEventListener('click', function() {
    if (currentCart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    showPage('checkout-page');
    updateOrderSummary();
});

document.getElementById('continue-shopping-btn')?.addEventListener('click', function() {
    showPage('products-page');
});

document.getElementById('back-to-cart-btn')?.addEventListener('click', function() {
    showPage('cart-page');
});

// Payment method change
document.querySelectorAll('input[name="payment"]')?.forEach(radio => {
    radio.addEventListener('change', function() {
        const cardSection = document.getElementById('card-payment');
        if (this.value === 'card') {
            cardSection.style.display = 'block';
        } else {
            cardSection.style.display = 'none';
        }
    });
});

// Checkout submission
document.getElementById('checkout-form')?.addEventListener('submit', function(e) {
    e.preventDefault();

    if (currentCart.length === 0) {
        alert('Cart is empty');
        return;
    }

    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

    // Create order
    const orderID = 1000 + systemData.orders.length + 1;
    const subtotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.10;
    const shipping = 5;
    const totalAmount = subtotal + tax + shipping;

    const newOrder = {
        orderID: orderID,
        userID: currentUser.userID,
        orderDate: new Date().toISOString().split('T')[0],
        status: 'processing',
        totalAmount: totalAmount,
        paymentStatus: 'paid',
        items: currentCart.map(item => ({ productID: item.productID, quantity: item.quantity })),
        shippingInfo: {
            name: document.getElementById('shipping-name').value,
            email: document.getElementById('shipping-email').value,
            address: document.getElementById('shipping-address').value,
            city: document.getElementById('shipping-city').value,
            zip: document.getElementById('shipping-zip').value
        },
        paymentMethod: paymentMethod
    };

    systemData.orders.push(newOrder);

    // Create payment record
    const newPayment = {
        paymentID: systemData.payments.length + 1,
        orderID: orderID,
        amount: totalAmount,
        method: paymentMethod,
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'completed'
    };
    systemData.payments.push(newPayment);

    // Create delivery record
    const newDelivery = {
        deliveryID: systemData.deliveries.length + 1,
        orderID: orderID,
        userID: currentUser.userID,
        status: 'pending',
        route: `${document.getElementById('shipping-city').value} District`,
        estimatedTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString(),
        estimatedMinutes: 30,
        assignedStaff: null,
        driverName: 'Not yet assigned',
        driverPhone: 'N/A',
        driverVehicle: 'N/A',
        gpsLocation: { 
            latitude: 6.9271, 
            longitude: 80.6369, 
            address: 'Mumtaz Mahal, 100/22 1st Cross St, Colombo 01100, Colombo 11' 
        },
        currentLocation: { latitude: 6.9271, longitude: 80.6369 },
        smsUpdates: [
            { timestamp: new Date().toLocaleString(), message: 'Order placed successfully. Processing in our distribution center.' }
        ],
        trackingHistory: [
            { timestamp: new Date().toLocaleString(), status: 'Order Placed', location: 'Warehouse - Colombo' }
        ]
    };
    systemData.deliveries.push(newDelivery);

    // Update inventory
    currentCart.forEach(item => {
        const inventory = systemData.inventory.find(inv => inv.productID === item.productID);
        if (inventory) {
            inventory.stockLevel -= item.quantity;
        }
    });

    alert(`Order #${orderID} placed successfully!\n\nOrder Confirmation Details:\n- Subtotal: ₨${subtotal.toFixed(2)}\n- Tax (10%): ₨${tax.toFixed(2)}\n- Shipping: ₨${shipping.toFixed(2)}\n- Total: ₨${totalAmount.toFixed(2)}\n\nEstimated Delivery: ${newDelivery.estimatedTime}\n\nEmail confirmation sent to ${newOrder.shippingInfo.email}`);

    currentCart = [];
    updateCartBadge();
    document.getElementById('checkout-form').reset();
    showPage('products-page');
    loadProducts();
});

// ================== CUSTOMER ORDERS ==================

function loadCustomerOrders() {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';

    const customerOrders = systemData.orders.filter(order => order.userID === currentUser.userID);

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
                <div class="order-info-value">₨${order.totalAmount.toFixed(2)}</div>
            </div>
            <div class="order-info">
                <div class="order-info-label">Status</div>
                <span class="order-status status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
            </div>
            <div class="order-info">
                <div class="order-info-label">Delivery Est.</div>
                <div class="order-info-value">${delivery ? delivery.estimatedTime : 'Pending'}</div>
            </div>
            <div class="order-actions">
                <button class="btn btn-primary" onclick="showOrderDetails(${order.orderID})">View Details</button>
                <button class="btn btn-secondary" onclick="trackDelivery(${order.orderID})">Track</button>
            </div>
        `;
        ordersList.appendChild(card);
    });
}

function showOrderDetails(orderID) {
    const order = systemData.orders.find(o => o.orderID === orderID);
    const delivery = systemData.deliveries.find(d => d.orderID === orderID);

    const modal = document.getElementById('order-modal');
    const detailsDiv = document.getElementById('order-details');

    let itemsHTML = '<table class="report-table"><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th></tr>';
    order.items.forEach(item => {
        const product = systemData.products.find(p => p.productID === item.productID);
        const itemTotal = product.price * item.quantity;
        itemsHTML += `<tr><td>${product.name}</td><td>₨${product.price.toFixed(2)}</td><td>${item.quantity}</td><td>₨${itemTotal.toFixed(2)}</td></tr>`;
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
            <span>${order.shippingInfo.name}</span>
        </div>
        <div class="summary-row">
            <span>Address:</span>
            <span>${order.shippingInfo.address}, ${order.shippingInfo.city}</span>
        </div>
        <div class="summary-row">
            <span>ZIP:</span>
            <span>${order.shippingInfo.zip}</span>
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
            <span>₨${(order.totalAmount / 1.15).toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>Tax (10%):</span>
            <span>₨${(order.totalAmount / 1.15 * 0.10).toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>Shipping:</span>
            <span>$5.00</span>
        </div>
        <div class="summary-row total">
            <span>Total:</span>
            <span>₨${order.totalAmount.toFixed(2)}</span>
        </div>
    `;

    modal.classList.add('active');
}

function trackDelivery(orderID) {
    const delivery = systemData.deliveries.find(d => d.orderID === orderID);
    if (!delivery) {
        alert('Delivery information not available yet');
        return;
    }

    alert(`📍 DELIVERY TRACKING\n\nOrder #${orderID}\nStatus: ${delivery.status.toUpperCase()}\nRoute: ${delivery.route}\nEstimated Arrival: ${delivery.estimatedTime}\n\n🚗 GPS Location: Available in mobile app\n\nYou will receive SMS updates as your delivery progresses.`);
}

// ================== ADMIN DASHBOARD ==================
// Note: Admin dashboard initialization is now handled by admin.js
// These functions are kept for reference only and should not be called

// DEPRECATED - Use admin.js functions instead
/*
function loadAdminDashboard() {
    updateAdminStats();
    updateAdminAlerts();
    updateUsersTable();
    updateProductsTable();
    setupTabListeners('admin');
}

function updateAdminStats() {
    const totalOrders = systemData.orders.length;
    const totalRevenue = systemData.orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingDeliveries = systemData.deliveries.filter(d => d.status === 'pending' || d.status === 'out for delivery').length;
    const lowStockItems = systemData.inventory.filter(inv => inv.stockLevel <= inv.reorderLevel).length;

    document.getElementById('stat-total-orders').textContent = totalOrders;
    document.getElementById('stat-total-revenue').textContent = '₨' + totalRevenue.toFixed(2);
    document.getElementById('stat-pending-deliveries').textContent = pendingDeliveries;
    document.getElementById('stat-low-stock').textContent = lowStockItems;
}
*/

function updateAdminAlerts() {
    const alertsDiv = document.getElementById('admin-alerts');
    alertsDiv.innerHTML = '';

    // Low stock alerts
    const lowStockItems = systemData.inventory.filter(inv => inv.stockLevel <= inv.reorderLevel);
    lowStockItems.forEach(inv => {
        const product = systemData.products.find(p => p.productID === inv.productID);
        const alert = document.createElement('div');
        alert.className = 'alert alert-warning';
        alert.innerHTML = `<span>⚠️</span><span>Low stock alert: ${product.name} (${inv.stockLevel}/${inv.reorderLevel})</span>`;
        alertsDiv.appendChild(alert);
    });

    // Pending deliveries alerts
    const pendingDeliveries = systemData.deliveries.filter(d => d.status === 'pending');
    if (pendingDeliveries.length > 0) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-warning';
        alert.innerHTML = `<span>📦</span><span>${pendingDeliveries.length} deliveries pending assignment</span>`;
        alertsDiv.appendChild(alert);
    }

    // High revenue days
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.innerHTML = `<span>✓</span><span>Total Revenue: ₨${systemData.orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}</span>`;
    alertsDiv.appendChild(alert);
}

function updateUsersTable() {
    const tbody = document.getElementById('users-table');
    tbody.innerHTML = '';

    systemData.users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.userID}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${formatRole(user.role)}</td>
            <td>
                <button class="btn btn-secondary" onclick="editUser(${user.userID})">Edit</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editUser(userID) {
    alert('User management feature coming soon');
}

function updateProductsTable() {
    const tbody = document.getElementById('products-table');
    tbody.innerHTML = '';

    systemData.products.forEach(product => {
        const inventory = systemData.inventory.find(inv => inv.productID === product.productID);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.productID}</td>
            <td>${product.name}</td>
            <td>₨${product.price.toFixed(2)}</td>
            <td>${inventory?.stockLevel || 0}</td>
            <td>${product.category}</td>
            <td>
                <button class="btn btn-secondary" onclick="editProduct(${product.productID})">Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.productID})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editProduct(productID) {
    alert('Product editing feature coming soon');
}

        const inventory = getInventoryForProduct(product.productID) || {};
        const inStock = inventory.stockLevel > 0;
        const card = document.createElement('div');
        card.className = 'product-card';
        const imgSrc = (product.image && typeof product.image === 'string') ? product.image : getSafePlaceholder(200, 160, product.name || 'Product');
        card.innerHTML = `
            <div class="product-card-image"><img src="${imgSrc}" alt="${product.name}" loading="lazy" onerror="this.onerror=null;this.src=getSafePlaceholder(200,160,'${product.name.replace(/'/g, "\'")}')"></div>
            <div class="product-card-body">
                <h3>${product.name}</h3>
                <div class="product-card-price">₨${(parseFloat(product.price)||0).toFixed(2)}</div>
                <div class="product-card-actions">
                    <button class="btn btn-small" onclick="showProductDetails(${product.productID})">Details</button>
                    <button class="btn btn-primary" onclick="addToCart(${product.productID})" ${!inStock ? 'disabled' : ''}>Add</button>
                </div>
            </div>
        `;
document.getElementById('generate-report-btn')?.addEventListener('click', function() {
    const reportType = document.getElementById('report-type').value;
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;

    if (!startDate || !endDate) {
        alert('Please select date range');
        return;
    }

    generateReport(reportType, startDate, endDate);
});

function generateReport(reportType, startDate, endDate) {
    const reportDiv = document.getElementById('report-display');
    let reportHTML = '';

    const filteredOrders = systemData.orders.filter(order => {
        return order.orderDate >= startDate && order.orderDate <= endDate;
    });

    if (reportType === 'sales') {
        const totalSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? (totalSales / totalOrders) : 0;

        reportHTML = `
            <h3>Sales Report (${startDate} to ${endDate})</h3>
            <table class="report-table">
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Total Orders</td><td>${totalOrders}</td></tr>
                <tr><td>Total Sales</td><td>₨${totalSales.toFixed(2)}</td></tr>
                <tr><td>Average Order Value</td><td>₨${avgOrderValue.toFixed(2)}</td></tr>
            </table>
            <h4 style="margin-top: 20px;">Order Details</h4>
            <table class="report-table">
                <tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Amount</th><th>Status</th></tr>
        `;
        filteredOrders.forEach(order => {
            const customer = systemData.users.find(u => u.userID === order.userID);
            reportHTML += `<tr><td>#${order.orderID}</td><td>${order.orderDate}</td><td>${customer?.name || 'Unknown'}</td><td>₨${order.totalAmount.toFixed(2)}</td><td>${order.status}</td></tr>`;
        });
        reportHTML += '</table>';
    } else if (reportType === 'inventory') {
        reportHTML = `
            <h3>Inventory Report (${startDate} to ${endDate})</h3>
            <table class="report-table">
                <tr><th>Product ID</th><th>Product Name</th><th>Stock Level</th><th>Reorder Level</th><th>Status</th></tr>
        `;
        systemData.inventory.forEach(inv => {
            const product = systemData.products.find(p => p.productID === inv.productID);
            const status = inv.stockLevel <= inv.reorderLevel ? '⚠️ Low Stock' : '✓ Adequate';
            reportHTML += `<tr><td>${inv.productID}</td><td>${product?.name}</td><td>${inv.stockLevel}</td><td>${inv.reorderLevel}</td><td>${status}</td></tr>`;
        });
        reportHTML += '</table>';
    } else if (reportType === 'delivery') {
        reportHTML = `
            <h3>Delivery Report (${startDate} to ${endDate})</h3>
            <table class="report-table">
                <tr><th>Delivery ID</th><th>Order ID</th><th>Status</th><th>Route</th><th>Est. Time</th></tr>
        `;
        const filteredDeliveries = systemData.deliveries.filter(d => {
            const order = systemData.orders.find(o => o.orderID === d.orderID);
            return order && order.orderDate >= startDate && order.orderDate <= endDate;
        });
        filteredDeliveries.forEach(delivery => {
            reportHTML += `<tr><td>#${delivery.deliveryID}</td><td>#${delivery.orderID}</td><td>${delivery.status}</td><td>${delivery.route}</td><td>${delivery.estimatedTime}</td></tr>`;
        });
        reportHTML += '</table>';
    }

    reportHTML += '<button class="btn btn-primary" onclick="exportReport()">Export as PDF</button>';
    reportDiv.innerHTML = reportHTML;
}

function exportReport() {
    alert('Report exported successfully! Check your downloads folder.');
}

// ================== RDC STAFF DASHBOARD ==================

function loadRDCDashboard() {
    updateRDCOrdersTable();
    updateRDCInventoryTable();
    updateRDCDeliveryTable();
    setupTabListeners('rdc');
}

function updateRDCOrdersTable() {
    const tbody = document.getElementById('rdc-orders-table');
    tbody.innerHTML = '';

    systemData.orders.forEach(order => {
        const customer = systemData.users.find(u => u.userID === order.userID);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${order.orderID}</td>
            <td>${customer?.name || 'Unknown'}</td>
            <td>${order.orderDate}</td>
            <td>₨${order.totalAmount.toFixed(2)}</td>
            <td><span class="order-status status-${order.status}">${order.status}</span></td>
            <td>
                <button class="btn btn-secondary" onclick="processRDCOrder(${order.orderID})">Process</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function processRDCOrder(orderID) {
    const order = systemData.orders.find(o => o.orderID === orderID);
    if (order.status === 'processing') {
        order.status = 'ready for delivery';
        alert(`Order #${orderID} marked as ready for delivery`);
        updateRDCOrdersTable();
    }
}

function updateRDCInventoryTable() {
    const tbody = document.getElementById('rdc-inventory-table');
    tbody.innerHTML = '';

    systemData.inventory.forEach(inv => {
        const product = systemData.products.find(p => p.productID === inv.productID);
        const status = inv.stockLevel <= inv.reorderLevel ? '🔴 Low Stock' : '🟢 Adequate';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${inv.productID}</td>
            <td>${product?.name}</td>
            <td>${inv.stockLevel}</td>
            <td>${inv.reorderLevel}</td>
            <td>${status}</td>
            <td>
                <button class="btn btn-primary" onclick="updateInventoryStock(${inv.productID})">Update Stock</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateInventoryStock(productID) {
    const newStock = prompt('Enter new stock level:');
    if (newStock !== null && !isNaN(newStock)) {
        const inventory = systemData.inventory.find(inv => inv.productID === productID);
        const oldStock = inventory.stockLevel;
        inventory.stockLevel = parseInt(newStock);
        inventory.lastUpdated = new Date();
        alert(`Stock updated from ${oldStock} to ${newStock}`);
        updateRDCInventoryTable();
    }
}

document.getElementById('add-inventory-btn')?.addEventListener('click', function() {
    const productID = prompt('Enter Product ID:');
    if (productID) {
        const quantity = prompt('Enter quantity to add:');
        if (quantity && !isNaN(quantity)) {
            const inventory = systemData.inventory.find(inv => inv.productID === parseInt(productID));
            if (inventory) {
                inventory.stockLevel += parseInt(quantity);
                alert(`Added ${quantity} units. New stock: ${inventory.stockLevel}`);
                updateRDCInventoryTable();
            } else {
                alert('Product not found');
            }
        }
    }
});

function updateRDCDeliveryTable() {
    const tbody = document.getElementById('rdc-delivery-table');
    tbody.innerHTML = '';

    systemData.deliveries.forEach(delivery => {
        const order = systemData.orders.find(o => o.orderID === delivery.orderID);
        const customer = systemData.users.find(u => u.userID === order?.userID);
        const staff = systemData.users.find(u => u.userID === delivery.assignedStaff);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${delivery.deliveryID}</td>
            <td>#${delivery.orderID}</td>
            <td>${customer?.name || 'Unknown'}</td>
            <td><span class="order-status status-${delivery.status}">${delivery.status}</span></td>
            <td>${staff?.name || 'Unassigned'}</td>
            <td>
                <button class="btn btn-primary" onclick="assignDelivery(${delivery.deliveryID})">Assign</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function assignDelivery(deliveryID) {
    const delivery = systemData.deliveries.find(d => d.deliveryID === deliveryID);
    const deliveryStaff = systemData.users.filter(u => u.role === 'delivery_staff');
    
    if (deliveryStaff.length === 0) {
        alert('No delivery staff available');
        return;
    }

    const staffList = deliveryStaff.map(s => `${s.userID}: ${s.name}`).join('\n');
    const staffID = prompt(`Select staff ID:\n${staffList}`);
    
    if (staffID && !isNaN(staffID)) {
        const staff = systemData.users.find(u => u.userID === parseInt(staffID) && u.role === 'delivery_staff');
        if (staff) {
            delivery.assignedStaff = staff.userID;
            delivery.status = 'assigned';
            alert(`Delivery #${deliveryID} assigned to ${staff.name}`);
            updateRDCDeliveryTable();
        } else {
            alert('Invalid staff ID');
        }
    }
}

// ================== DELIVERY STAFF DASHBOARD ==================

function loadDeliveryDashboard() {
    updateDeliveryStaffTable();
    // Auto-refresh every 30 seconds
    setInterval(updateDeliveryStaffTable, 30000);
}

function updateDeliveryStaffTable() {
    const tbody = document.getElementById('delivery-staff-table');
    tbody.innerHTML = '';

    const assignedDeliveries = systemData.deliveries.filter(d => d.assignedStaff === currentUser.userID);

    if (assignedDeliveries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #999;">No deliveries assigned</td></tr>';
        return;
    }

    assignedDeliveries.forEach(delivery => {
        const order = systemData.orders.find(o => o.orderID === delivery.orderID);
        const customer = systemData.users.find(u => u.userID === order?.userID);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${delivery.deliveryID}</td>
            <td>#${delivery.orderID}</td>
            <td>${customer?.name || 'Unknown'}</td>
            <td>${order?.shippingInfo?.address || 'N/A'}</td>
            <td><span class="order-status status-${delivery.status}">${delivery.status}</span></td>
            <td>${delivery.estimatedTime}</td>
            <td>
                <button class="btn btn-primary" onclick="updateDeliveryStatus(${delivery.deliveryID})">Update</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateDeliveryStatus(deliveryID) {
    const delivery = systemData.deliveries.find(d => d.deliveryID === deliveryID);
    const statuses = ['pending', 'out for delivery', 'delivered', 'failed'];
    const currentIndex = statuses.indexOf(delivery.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    const confirmed = confirm(`Update delivery status to "${nextStatus}"?`);
    if (confirmed) {
        delivery.status = nextStatus;
        
        // If delivered, update order status
        if (nextStatus === 'delivered') {
            const order = systemData.orders.find(o => o.orderID === delivery.orderID);
            order.status = 'delivered';
        }

        alert(`Delivery #${deliveryID} status updated to ${nextStatus}`);
        updateDeliveryStaffTable();
    }
}

// ================== TAB SWITCHING ==================

function setupTabListeners(dashboardType) {
    const prefix = dashboardType === 'admin' ? 'admin' : 'rdc';
    const selector = dashboardType === 'admin' ? '.admin-tabs' : '.rdc-tabs';

    document.querySelectorAll(selector + ' .tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');

            // Remove active class from all buttons and tabs
            document.querySelectorAll(selector + ' .tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll(`.tab-content`).forEach(tab => tab.classList.remove('active'));

            // Add active class to clicked button and corresponding tab
            this.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });

    // Set first tab as active
    document.querySelector(selector + ' .tab-button').classList.add('active');
}

// ================== MODAL MANAGEMENT ==================

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal when clicking close button
document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').classList.remove('active');
    });
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
});

// ================== INITIALIZATION ==================

document.addEventListener('DOMContentLoaded', function() {
    // Initial setup
    updateCartBadge();
    
    // Add more real-time features
    console.log('RDC System initialized successfully');
});

// Real-time inventory sync simulation (updates every minute)
setInterval(function() {
    if (currentUser) {
        // Simulate real-time inventory updates
        systemData.inventory.forEach(inv => {
            inv.lastUpdated = new Date();
        });
    }
}, 60000);
