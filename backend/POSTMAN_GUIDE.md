# 📮 Postman API Testing Guide

**Backend URL:** `http://localhost:5000`

---

## 🚀 Quick Start in Postman

### 1. Create a New Collection

- In Postman: **Collections** → **+ New Collection**
- Name: `RDC Backend API`
- Description: `Testing endpoints for RDC Management System`

### 2. Create Environment Variables (Optional but Recommended)

- **New Environment** → Name: `Local Development`
- Add these variables:

```
base_url: http://localhost:5000
token: (leave blank initially)
user_id: (leave blank initially)
```

---

## 🔐 Authentication Endpoints

### 1. Register User

```
POST /api/auth/register
```

**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "role": "customer"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "uid": "firebase_uid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "customer"
  },
  "token": "eyJhbGc..."
}
```

**In Postman:**

1. Set method to `POST`
2. URL: `http://localhost:5000/api/auth/register`
3. Go to **Body** → **raw** → select **JSON**
4. Paste the JSON body
5. Click **Send**
6. Copy the `token` value for use in other requests

---

### 2. Login User

```
POST /api/auth/login
```

**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "uid": "firebase_uid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "customer"
  },
  "token": "eyJhbGc..."
}
```

---

### 3. Get Current User Profile

```
GET /api/auth/me
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Expected Response (200):**

```json
{
  "success": true,
  "user": {
    "uid": "firebase_uid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "phone": "+1234567890",
    "role": "customer",
    "status": "active",
    "createdAt": "2024-01-16T10:23:00Z",
    "updatedAt": "2024-01-16T10:23:00Z"
  }
}
```

**In Postman:**

1. Set method to `GET`
2. URL: `http://localhost:5000/api/auth/me`
3. Go to **Headers** tab
4. Add header: `Authorization` = `Bearer PASTE_YOUR_TOKEN_HERE`
5. Click **Send**

---

### 4. Update Profile

```
PUT /api/auth/profile
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "full_name": "John Smith",
  "phone": "+9876543210",
  "preferences": {
    "language": "en",
    "notifications": true
  }
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "uid": "firebase_uid",
    "email": "user@example.com",
    "displayName": "John Smith",
    "phone": "+9876543210",
    "preferences": {...}
  }
}
```

---

### 5. Change Password

```
POST /api/auth/change-password
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 6. Verify Token

```
GET /api/auth/verify
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "uid": "firebase_uid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "customer"
  }
}
```

---

### 7. Logout

```
POST /api/auth/logout
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👤 User Endpoints

### Get User Profile

```
GET /api/users/profile
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 📦 Product Endpoints

### Get All Products

```
GET /api/products
```

**Headers:**

```
Content-Type: application/json
```

**Optional Query Parameters:**

```
?category=electronics
?limit=10
?page=1
```

---

### Get Single Product

```
GET /api/products/:id
```

---

### Create Product (Admin Only)

```
POST /api/products
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body:**

```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "category": "electronics",
  "stock": 100,
  "image": "https://..."
}
```

---

## 🛒 Order Endpoints

### Get All Orders

```
GET /api/orders
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### Create Order

```
POST /api/orders
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body:**

```json
{
  "items": [
    {
      "product_id": "product_1",
      "quantity": 2,
      "price": 49.99
    }
  ],
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "zip": "10001",
    "country": "USA"
  }
}
```

---

## 💳 Payment Endpoints

### Create Payment

```
POST /api/payments
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body:**

```json
{
  "order_id": "order_123",
  "amount": 99.99,
  "method": "card",
  "card_token": "tok_visa"
}
```

---

## 🚚 Delivery Endpoints

### Get Deliveries

```
GET /api/delivery
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### Update Delivery Status

```
PUT /api/delivery/:id
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body:**

```json
{
  "status": "in_transit",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.006
  }
}
```

---

## 📊 Analytics Endpoints

### Get Analytics

```
GET /api/analytics
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Query Parameters:**

```
?startDate=2024-01-01
?endDate=2024-01-31
?metric=sales
```

---

## 🔔 Notification Endpoints

### Get Notifications

```
GET /api/notifications
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### Mark as Read

```
POST /api/notifications/mark-as-read/:id
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 💡 Recommendation Endpoints

### Get Recommendations

```
GET /api/recommendations
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### Get Trending Products

```
GET /api/recommendations/trending
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 📦 Inventory Endpoints

### Get Inventory

```
GET /api/inventory
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### Add Inventory Item (Admin Only)

```
POST /api/inventory
```

**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body:**

```json
{
  "product_id": "product_1",
  "quantity": 50,
  "location": "warehouse_A"
}
```

---

## 🎯 Testing Steps in Postman

### Step 1: Register

1. Create request: **POST** `http://localhost:5000/api/auth/register`
2. Add JSON body with email, password, full_name
3. Send
4. Copy the returned `token`

### Step 2: Use Token for Protected Endpoints

1. Create new request
2. Go to **Headers** tab
3. Add: `Authorization: Bearer PASTE_TOKEN_HERE`
4. Send request

### Step 3: Test Other Endpoints

- Try GET /api/products (no auth needed)
- Try POST /api/orders (auth needed - use token)
- Try PUT /api/auth/profile (auth needed - use token)

---

## 🔧 Postman Settings

### For Bearer Token Automation

1. After Register request, go to **Tests** tab
2. Add script:

```javascript
if (pm.response.code === 201) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.token);
}
```

3. Now you can use `{{token}}` in Authorization header:

```
Authorization: Bearer {{token}}
```

---

## ❌ Common Issues & Solutions

### "Cannot GET /api/products"

- ✅ Server might not be running
- ✅ Check: `npm run dev` in backend folder
- ✅ Verify port 5000 is correct

### "Unauthorized" (401)

- ✅ Token is missing or expired
- ✅ Register/login first to get token
- ✅ Copy token to Authorization header
- ✅ Check token format: `Bearer YOUR_TOKEN`

### "Firebase not initialized"

- ✅ This is OK (expected with placeholder credentials)
- ✅ Authentication still works
- ✅ Setup Firebase credentials later

### "Method Not Allowed"

- ✅ Check HTTP method (GET, POST, PUT, DELETE)
- ✅ Match exactly what's documented

### "Invalid JSON"

- ✅ Check Body tab is set to **raw**
- ✅ Select **JSON** from dropdown
- ✅ Valid JSON syntax (quotes, commas, braces)

---

## 📝 Example Postman Collection (JSON)

You can import this directly into Postman:

**File → Import → Paste Raw Text**

```json
{
  "info": {
    "name": "RDC Backend API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"user@example.com\",\"password\":\"password123\",\"full_name\":\"John Doe\"}"
            },
            "url": {
              "raw": "http://localhost:5000/api/auth/register",
              "protocol": "http",
              "host": ["localhost"],
              "port": "5000",
              "path": ["api", "auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"user@example.com\",\"password\":\"password123\"}"
            },
            "url": {
              "raw": "http://localhost:5000/api/auth/login",
              "protocol": "http",
              "host": ["localhost"],
              "port": "5000",
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## ✅ Ready to Test!

Your backend is running and ready for Postman testing.

**Start with:**

1. POST `/api/auth/register` - Create an account
2. POST `/api/auth/login` - Get a token
3. GET `/api/auth/me` - Test the token works
4. Try other endpoints!

---

**Need help?** Check the error message and troubleshooting section above!
