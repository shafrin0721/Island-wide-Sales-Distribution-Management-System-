// =====================================================
// CUSTOMER FUNCTIONS
// =====================================================

// Load products on products page
if (document.getElementById('products-grid')) {
    document.addEventListener('DOMContentLoaded', function() {
        loadProducts();
        setupFilters();
    });
}

// Load cart on cart page
if (document.getElementById('cart-items')) {
    document.addEventListener('DOMContentLoaded', function() {
        updateCartDisplay();
    });
}

// Load orders on orders page
if (document.getElementById('orders-list')) {
    document.addEventListener('DOMContentLoaded', function() {
        loadCustomerOrders();
    });
}

// Load checkout on checkout page
if (document.getElementById('checkout-form')) {
    document.addEventListener('DOMContentLoaded', function() {
        updateOrderSummary();
        setupPaymentMethod();
        setupCheckoutForm();
    });
}

// ================== PRODUCTS ==================

function loadProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    systemData.products.forEach(product => {
        const inventory = systemData.inventory.find(inv => inv.productID === product.productID);
        const inStock = inventory && inventory.stockLevel > 0;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">${product.emoji}</div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.category}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
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

function showProductDetails(productID) {
    const product = systemData.products.find(p => p.productID === productID);
    const inventory = systemData.inventory.find(inv => inv.productID === productID);
    const inStock = inventory && inventory.stockLevel > 0;

    const modal = document.getElementById('product-modal');
    const detailsDiv = document.getElementById('product-details');

    detailsDiv.innerHTML = `
        <div class="product-details-container">
            <div class="product-details-image">${product.emoji}</div>
            <div class="product-details-info">
                <h2>${product.name}</h2>
                <div class="product-details-category">${product.category}</div>
                <div class="product-details-price">$${product.price.toFixed(2)}</div>
                <div class="product-details-availability ${inStock ? 'in-stock' : 'out-stock'}">
                    ${inStock ? `✓ In Stock (${inventory.stockLevel} available)` : '✗ Out of Stock'}
                </div>
                <div class="product-details-description">${product.description}</div>
                <div class="product-quantity-input">
                    <button onclick="decreaseQty()">−</button>
                    <input type="number" id="qty-input" value="1" min="1" max="${inventory?.stockLevel || 1}">
                    <button onclick="increaseQty(${inventory?.stockLevel || 1})">+</button>
                </div>
                <button class="btn btn-primary" onclick="addToCartWithQty(${product.productID})" ${!inStock ? 'disabled' : ''}>
                    Add to Cart
                </button>
            </div>
        </div>
    `;

    modal.classList.add('active');
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
        card.innerHTML = `
            <div class="product-image">${product.emoji}</div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.category}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
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
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">📦</div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
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

function submitCheckout(e) {
    e.preventDefault();

    if (currentCart.length === 0) {
        alert('Cart is empty');
        return;
    }

    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'card';

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
            name: document.getElementById('shipping-name')?.value,
            email: document.getElementById('shipping-email')?.value,
            address: document.getElementById('shipping-address')?.value,
            city: document.getElementById('shipping-city')?.value,
            zip: document.getElementById('shipping-zip')?.value
        },
        paymentMethod: paymentMethod
    };

    systemData.orders.push(newOrder);

    const newPayment = {
        paymentID: systemData.payments.length + 1,
        orderID: orderID,
        amount: totalAmount,
        method: paymentMethod,
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'completed'
    };
    systemData.payments.push(newPayment);

    const newDelivery = {
        deliveryID: systemData.deliveries.length + 1,
        orderID: orderID,
        userID: currentUser.userID,
        status: 'pending',
        route: `${document.getElementById('shipping-city')?.value} District`,
        estimatedTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString(),
        assignedStaff: null
    };
    systemData.deliveries.push(newDelivery);

    currentCart.forEach(item => {
        const inventory = systemData.inventory.find(inv => inv.productID === item.productID);
        if (inventory) {
            inventory.stockLevel -= item.quantity;
        }
    });

    alert(`Order #${orderID} placed successfully!\n\nEmail confirmation sent to ${newOrder.shippingInfo.email}`);

    currentCart = [];
    updateCartBadge();
    saveSession();
    document.getElementById('checkout-form').reset();
    goToPage('customer-orders.html');
}

// ================== ORDERS ==================

function loadCustomerOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

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
                <div class="order-info-value">$${order.totalAmount.toFixed(2)}</div>
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
        itemsHTML += `<tr><td>${product.name}</td><td>$${product.price.toFixed(2)}</td><td>${item.quantity}</td><td>$${itemTotal.toFixed(2)}</td></tr>`;
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
