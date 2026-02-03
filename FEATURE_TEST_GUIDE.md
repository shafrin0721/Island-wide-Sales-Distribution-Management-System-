# Feature Test Guide - Add to Cart, View Details, and Orders

## Setup

1. Backend server is running on port 5000
2. Demo users available:
   - Email: `customer@test.com`
   - Password: `password123`
   - Role: customer

## Test 1: Add to Cart

### Steps:

1. Go to http://localhost:5000/ (Login Page)
2. Enter email: `customer@test.com`
3. Enter password: `password123`
4. Click "Login"
5. You'll be redirected to Products Page (/pages/customer/products.html)
6. Look for any product (e.g., "Laptop Pro")
7. Click the **"Add to Cart"** button

### Expected Results:

- ✅ A confirmation alert appears: "Product added to cart!"
- ✅ The cart badge in the top-right navigation updates (shows item count)
- ✅ You can add multiple items
- ✅ The cart is saved to localStorage automatically

### Verify Cart Contents:

1. Click the **"Cart"** button in the navigation menu
2. You should see all items you added with:
   - Product name
   - Price
   - Quantity
   - Total price
   - Ability to increase/decrease quantity or remove items

---

## Test 2: View Details

### Steps:

1. Go back to the Products page (Click "Products" in nav menu)
2. Find any product
3. Click the **"Details"** button on the product card

### Expected Results:

- ✅ A modal dialog opens showing:
  - Product emoji/icon
  - Product name
  - Category
  - Price
  - Stock availability
  - Full product description
  - Quantity selector (+ and - buttons)
  - "Add to Cart" button

### Features:

1. Use the **+** and **-** buttons to adjust quantity
2. Click **"Add to Cart"** to add the selected quantity
3. Click the **X** button or click outside the modal to close it
4. Alert confirms the product was added

---

## Test 3: View Orders (Current and Previous)

### Steps:

1. Log in as `customer@test.com` / `password123`
2. Click **"My Orders"** in the navigation menu
3. You'll be taken to /pages/customer/orders.html

### Expected Results:

- ✅ You see a list of orders with:
  - Order ID
  - Order Date
  - Total Amount
  - Order Status (Delivered, Shipped, etc.)
  - Estimated Delivery Time
  - "View Details" button
  - "Track" button

### Current & Previous Orders:

- The system shows **all orders** from the customer
- Includes both **completed** and **in-progress** orders
- Test data includes:
  - Order #1001 (Delivered, 2024-01-10, $1,356.00)
  - Order #1002 (Shipped, 2024-01-12, $165.00)

### View Order Details:

1. Click **"View Details"** on any order
2. A modal appears showing:
   - Order ID and Date
   - Items in the order (product name, price, qty, total)
   - Delivery information
   - Estimated delivery time
   - Payment status

### Track Delivery:

1. Click **"Track"** on any order
2. A popup shows delivery tracking info:
   - Order number
   - Status
   - Route
   - Estimated arrival time
   - GPS availability info

---

## Test 4: Complete Purchase Flow

### Steps:

1. Add multiple products to cart (from Products page)
2. Go to Cart page
3. Review order summary:
   - Subtotal
   - Tax (10%)
   - Shipping ($5)
   - Total
4. Click **"Proceed to Checkout"**
5. Fill in checkout form:
   - Delivery address
   - Payment method
6. Review order summary again
7. Click **"Place Order"**

### Expected Results:

- ✅ Order is created
- ✅ Order appears in "My Orders"
- ✅ Cart is cleared after checkout
- ✅ User can track the new order

---

## Troubleshooting

### Cart not updating?

- Check browser console (F12) for JavaScript errors
- Verify localStorage is enabled: Open DevTools → Application → LocalStorage
- Should see `currentCart` with JSON data

### Orders not showing?

- Ensure you're logged in (currentUser should be set)
- Check that currentUser has the same ID as orders in the system
- Demo orders are associated with userID 1
- Check console logs: "Found X orders for user"

### Add to Cart not working?

- Verify the button click is triggering (red test button in top-right should work)
- Check console for "addToCart called with productID" logs
- Verify systemData.products has items
- Check if product is in stock

---

## Console Logs to Check

Press F12 and go to Console tab to see:

1. **Login success**: `"Login response: {success: true, ...}"`
2. **Products loaded**: `"loadProducts called, found 10 products"`
3. **Adding to cart**: `"addToCart called with productID: X"` and `"Updated cart: [...]"`
4. **Loading orders**: `"Loading customer orders for user: {...}"` and `"Found X orders for user"`
5. **Cart saved**: `"Session saved - Cart items: X"`

---

## Test Data Summary

### Products Available (10 total):

1. Laptop Pro - $1,299
2. Wireless Mouse - $45
3. USB-C Cable - $12
4. Winter Jacket - $150
5. Running Shoes - $120
6. Garden Tools Set - $89
7. Coffee Maker - $75
8. JavaScript Book - $45
9. Board Game - $30
10. LEGO Set - $89

### Test Orders Available:

- Order #1001: $1,356 (Delivered, includes: Laptop Pro + Wireless Mouse)
- Order #1002: $165 (Shipped, includes: Winter Jacket)

---

## Feature Checklist

- [ ] Can log in successfully
- [ ] Products page displays with product cards
- [ ] "Add to Cart" button works and adds items
- [ ] Cart badge updates with item count
- [ ] "View Details" button opens product modal
- [ ] Product modal shows all details correctly
- [ ] Quantity selector (+/-) works in modal
- [ ] Can add to cart from modal
- [ ] Cart page displays all added items
- [ ] Can increase/decrease quantities on cart page
- [ ] Can remove items from cart
- [ ] "My Orders" shows all customer orders
- [ ] Can view order details
- [ ] Can track delivery
- [ ] Checkout flow works
- [ ] Can place order
- [ ] New order appears in "My Orders" immediately

---

## Support

If any feature isn't working:

1. Check browser console (F12) for error messages
2. Verify backend is running: http://localhost:5000/api/auth/verify (should return JSON)
3. Restart backend if needed: `npm start` from `/backend` folder
4. Clear localStorage if issues persist: DevTools → Application → Clear storage → Clear site data
