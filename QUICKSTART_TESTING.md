# Quick Start Guide - Testing All Features

## ✅ Server Status

Backend server is running on: **http://localhost:5000**

## 📝 Login Credentials

```
Email:    customer@test.com
Password: password123
```

## 🚀 Quick Test Workflow

### Step 1: Login

1. Go to http://localhost:5000
2. Enter email and password above
3. Click "Login"
4. You'll be redirected to Products page

### Step 2: Browse Products

1. You should see 10 products in a grid
2. Each product shows: emoji, name, category, price, stock status
3. Red "TEST BUTTON" visible in top-right corner (confirms JavaScript is working)

### Step 3: Test Product Details

1. Click **"Details"** button on any product
2. Modal should open showing:
   - Product image (emoji)
   - Full description
   - Stock availability
   - **Quantity selector with - and + buttons** ← NEW FIX
3. Test the quantity buttons:
   - Click **"+"** to increase
   - Click **"-"** to decrease
   - Directly type a number
4. Click **"Add to Cart"** button
5. Confirmation alert appears: "Product added to cart!"
6. Click X or outside modal to close

### Step 4: Test Add to Cart (Direct)

1. Back on Products page
2. Click **"Add to Cart"** directly on product card (not Details)
3. Cart badge in nav bar updates (shows item count)
4. Alert confirms: "Product added to cart!"

### Step 5: Test Navigation Buttons ← NEW FIX

All these buttons now work perfectly:

1. Click **"Products"** → stays on products page
2. Click **"My Orders"** → goes to orders page
3. Click **"Cart"** → goes to cart page
4. Click **"Profile"** → goes to profile page
5. Click **"Logout"** → logs out and returns to login

### Step 6: View Cart

1. Click **"Cart"** in nav bar
2. You should see all added items:
   - Product name
   - Price
   - Quantity
   - Total per item
   - Ability to change quantity or remove
3. See order summary: Subtotal, Tax, Shipping, Total
4. Click **"Proceed to Checkout"** button

### Step 7: View Orders

1. Click **"My Orders"** in nav bar
2. You should see 2 demo orders:
   - Order #1001 (Delivered, $1,356.00)
   - Order #1002 (Shipped, $165.00)
3. Click **"View Details"** on any order
4. Modal shows items, prices, delivery info
5. Click **"Track"** to see delivery tracking info

### Step 8: Check Profile

1. Click **"Profile"** in nav bar
2. Shows user information
3. Can edit profile, change password, etc.

## 🔧 Troubleshooting

### Buttons Not Working?

1. Open browser console: Press **F12**
2. Go to **Console** tab
3. Look for red error messages
4. You should see logs like:
   - `"Nav button clicked: Products"`
   - `"Increase quantity button clicked"`

### Cart Not Saving?

1. Open DevTools: **F12**
2. Go to **Application** tab
3. Click **Local Storage**
4. You should see `currentCart` with JSON data

### Quantity Buttons Not Working in Modal?

1. Click "Details" on a product
2. Open Console (F12)
3. You should see: `"Increase quantity button clicked"`
4. If not, there's a JavaScript error above it

### Orders Not Showing?

1. Console should show: `"Found X orders for user"`
2. If "Found 0 orders", the user ID isn't matching
3. Log out and log in again

## 🧪 Complete Test Checklist

- [ ] Can login successfully
- [ ] Products page loads with 10 items
- [ ] Test button (red) in top-right works
- [ ] "Details" button opens product modal
- [ ] Quantity + button increases value
- [ ] Quantity - button decreases value
- [ ] Direct quantity entry works
- [ ] "Add to Cart" from modal works
- [ ] Alert confirms item added
- [ ] "Add to Cart" from card works directly
- [ ] Cart badge updates with count
- [ ] "Products" nav button works
- [ ] "My Orders" nav button works
- [ ] "Cart" nav button works
- [ ] "Profile" nav button works
- [ ] "Logout" nav button works
- [ ] Cart page shows all items
- [ ] Can increase/decrease quantities on cart
- [ ] Can remove items from cart
- [ ] "My Orders" shows 2 demo orders
- [ ] "View Details" opens order modal
- [ ] "Track" shows delivery info
- [ ] Profile page displays user info

## 📊 Test Data Summary

### Demo Users

- Email: `customer@test.com`
- Password: `password123`
- Role: customer

### Sample Products (10 total)

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

### Sample Orders

- Order #1001: Delivered, $1,356 (Laptop Pro + Wireless Mouse)
- Order #1002: Shipped, $165 (Winter Jacket)

## 🎯 Features Now Working

✅ **Navigation Bar**

- All 5 buttons work (Products, Orders, Cart, Profile, Logout)
- Instant page switching
- Maintains session across pages

✅ **Product Details Modal**

- Opens with complete product information
- Quantity selector with +/- buttons
- Manual quantity input
- Add to cart from modal

✅ **Shopping Cart**

- Add items with quantity
- View all items
- Modify quantities
- Remove items
- Calculate totals with tax and shipping

✅ **Orders Page**

- Shows current and previous orders
- View order details
- Track deliveries
- See order status

✅ **Session Persistence**

- Cart saved to localStorage
- Survives page refresh
- User session maintained

## 🚨 Need Help?

1. **Console Logs** - Check F12 Console for errors/logs
2. **Network** - Check F12 Network tab for failed API calls
3. **Local Storage** - Check F12 Application tab for saved data
4. **Restart** - Backend: `npm start` from `/backend` folder
5. **Clear Cache** - DevTools → Ctrl+Shift+Delete → Clear browsing data

## 📈 What's Next?

After confirming everything works:

1. Test checkout flow
2. Test payment methods
3. Test order confirmation
4. Test admin dashboard
5. Test RDC features
6. Test delivery features

---

**Status:** All core features are now fully functional! 🎉
