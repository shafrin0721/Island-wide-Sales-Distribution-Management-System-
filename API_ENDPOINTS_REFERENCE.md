# ISDN API Endpoints Reference

**Last Updated:** February 4, 2026  
**Backend URL:** `http://localhost:5000`

---

## 🟢 Health & Info Endpoints

### Check Server Status

```bash
GET /api/health
```

Response: `{ "status": "healthy", "timestamp": "...", "uptime": "..." }`

### List All Available Endpoints

```bash
GET /api
```

Response: Shows all available API base paths

---

## 🔐 Authentication Endpoints (`/api/auth`)

| Method | Endpoint                            | Description               | Auth Required |
| ------ | ----------------------------------- | ------------------------- | ------------- |
| POST   | `/api/auth/register`                | Create new user account   | ❌            |
| POST   | `/api/auth/login`                   | Login with email/password | ❌            |
| POST   | `/api/auth/logout`                  | End session               | ✅            |
| POST   | `/api/auth/refresh-token`           | Refresh JWT token         | ✅            |
| GET    | `/api/auth/verify`                  | Verify token validity     | ✅            |
| POST   | `/api/auth/send-order-confirmation` | Email order confirmation  | ✅            |

---

## 👥 User Management Endpoints (`/api/users`)

| Method | Endpoint                | Description              | Auth Required |
| ------ | ----------------------- | ------------------------ | ------------- |
| GET    | `/api/users`            | List all users           | ✅ (admin)    |
| GET    | `/api/users/:id`        | Get user details         | ✅            |
| POST   | `/api/users`            | Create new user          | ✅ (admin)    |
| PUT    | `/api/users/:id`        | Update user info         | ✅            |
| DELETE | `/api/users/:id`        | Delete user account      | ✅ (admin)    |
| GET    | `/api/users/profile/me` | Get current user profile | ✅            |

---

## 📦 Product Catalog Endpoints (`/api/products`)

| Method | Endpoint                     | Description         | Auth Required |
| ------ | ---------------------------- | ------------------- | ------------- |
| GET    | `/api/products`              | List all products   | ❌            |
| GET    | `/api/products/:id`          | Get product details | ❌            |
| POST   | `/api/products`              | Create product      | ✅ (admin)    |
| PUT    | `/api/products/:id`          | Update product      | ✅ (admin)    |
| DELETE | `/api/products/:id`          | Delete product      | ✅ (admin)    |
| GET    | `/api/products/search?q=...` | Search products     | ❌            |

---

## 📋 Order Management Endpoints (`/api/orders`)

| Method | Endpoint                           | Description           | Auth Required  |
| ------ | ---------------------------------- | --------------------- | -------------- |
| GET    | `/api/orders`                      | List all orders       | ✅             |
| GET    | `/api/orders/:id`                  | Get order details     | ✅             |
| POST   | `/api/orders`                      | Create new order      | ✅ (customer)  |
| PUT    | `/api/orders/:id`                  | Update order          | ✅ (admin/rdc) |
| DELETE | `/api/orders/:id`                  | Cancel order          | ✅             |
| POST   | `/api/orders/:id/invoice`          | Generate invoice      | ✅             |
| GET    | `/api/orders/customer/:customerId` | Get customer's orders | ✅             |

---

## 📦 Inventory Management Endpoints (`/api/inventory`)

| Method | Endpoint                    | Description                 | Auth Required  |
| ------ | --------------------------- | --------------------------- | -------------- |
| GET    | `/api/inventory`            | List all inventory          | ❌             |
| GET    | `/api/inventory/:productId` | Get stock level             | ❌             |
| POST   | `/api/inventory`            | Add stock                   | ✅ (rdc_staff) |
| PUT    | `/api/inventory/:productId` | Update stock                | ✅ (rdc_staff) |
| POST   | `/api/inventory/transfer`   | Transfer stock between RDCs | ✅ (rdc_staff) |
| GET    | `/api/inventory/rdc/:rdcId` | Get RDC inventory           | ✅ (rdc_staff) |

---

## 🚚 Delivery Tracking Endpoints (`/api/delivery`)

| Method | Endpoint                         | Description             | Auth Required        |
| ------ | -------------------------------- | ----------------------- | -------------------- |
| GET    | `/api/delivery`                  | List all deliveries     | ❌                   |
| GET    | `/api/delivery/:id`              | Track delivery          | ❌                   |
| GET    | `/api/delivery/driver/:driverId` | Get driver's deliveries | ✅ (delivery_staff)  |
| POST   | `/api/delivery/:id/location`     | Update GPS location     | ✅ (delivery_staff)  |
| POST   | `/api/delivery/:id/complete`     | Mark delivery complete  | ✅ (delivery_staff)  |
| GET    | `/api/delivery/analytics/:rdcId` | Get delivery metrics    | ✅ (rdc_staff/admin) |
| POST   | `/api/delivery/optimize-route`   | Optimize delivery route | ✅ (rdc_staff/admin) |

---

## 💳 Payment Processing Endpoints (`/api/payments`)

| Method | Endpoint               | Description           | Auth Required |
| ------ | ---------------------- | --------------------- | ------------- |
| GET    | `/api/payments`        | List all payments     | ✅ (admin)    |
| GET    | `/api/payments/:id`    | Get payment details   | ✅            |
| POST   | `/api/payments`        | Create payment        | ✅            |
| PUT    | `/api/payments/:id`    | Update payment status | ✅ (admin)    |
| POST   | `/api/payments/verify` | Verify payment        | ✅            |

---

## 📊 Dashboard & Analytics Endpoints

### Dashboard (`/api/dashboard`)

| Method | Endpoint                         | Description           | Auth Required  |
| ------ | -------------------------------- | --------------------- | -------------- |
| GET    | `/api/dashboard/summary`         | Dashboard overview    | ✅ (admin/rdc) |
| GET    | `/api/dashboard/rdc-stats`       | RDC performance stats | ✅ (rdc_staff) |
| GET    | `/api/dashboard/sales-analytics` | Sales data            | ✅ (admin)     |

### Analytics (`/api/analytics`)

| Method | Endpoint                   | Description          | Auth Required  |
| ------ | -------------------------- | -------------------- | -------------- |
| GET    | `/api/analytics/sales`     | Sales reports        | ✅ (admin)     |
| GET    | `/api/analytics/inventory` | Inventory turnover   | ✅ (admin/rdc) |
| GET    | `/api/analytics/delivery`  | Delivery performance | ✅ (admin/rdc) |

---

## 🔔 Notifications Endpoints (`/api/notifications`)

| Method | Endpoint                      | Description         | Auth Required |
| ------ | ----------------------------- | ------------------- | ------------- |
| GET    | `/api/notifications`          | List notifications  | ✅            |
| POST   | `/api/notifications`          | Create notification | ✅ (admin)    |
| PUT    | `/api/notifications/:id/read` | Mark as read        | ✅            |

---

## ⭐ Recommendations Endpoints (`/api/recommendations`)

| Method | Endpoint                       | Description                   | Auth Required |
| ------ | ------------------------------ | ----------------------------- | ------------- |
| GET    | `/api/recommendations`         | Get recommendations           | ✅            |
| GET    | `/api/recommendations/:userId` | User-specific recommendations | ✅            |

---

## 🎁 Promotions Endpoints (`/api/promotions`)

| Method | Endpoint              | Description            | Auth Required |
| ------ | --------------------- | ---------------------- | ------------- |
| GET    | `/api/promotions`     | List active promotions | ❌            |
| GET    | `/api/promotions/:id` | Get promotion details  | ❌            |
| POST   | `/api/promotions`     | Create promotion       | ✅ (admin)    |
| PUT    | `/api/promotions/:id` | Update promotion       | ✅ (admin)    |

---

## Testing Endpoints

### Quick Test All Routes

```bash
# Test health
curl http://localhost:5000/api/health

# Test API info
curl http://localhost:5000/api

# Test products (public)
curl http://localhost:5000/api/products

# Test orders (requires auth)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/api/orders
```

### Common Issues & Solutions

#### ❌ "Route not found"

- **Cause:** Incorrect endpoint URL or typo
- **Solution:** Check the endpoint from this reference guide
- **Example Error:** `{"success":false,"message":"Route not found","endpoint":"GET /api/deliveries"}`
- **Correct Endpoint:** `GET /api/delivery` (singular)

#### ❌ "Unauthorized"

- **Cause:** Missing JWT token or invalid token
- **Solution:** Include Authorization header: `Authorization: Bearer YOUR_JWT_TOKEN`

#### ❌ "Forbidden"

- **Cause:** User role doesn't have permission
- **Solution:** Check "Auth Required" column - ensure your role matches

---

## Demo Test Accounts

Use these credentials to test the system:

```
Email: customer@test.com
Password: password123
Role: customer

Email: rdc@test.com
Password: password123
Role: rdc_staff

Email: delivery@test.com
Password: password123
Role: delivery_staff
```

### Login Example

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "password123"
  }'
```

Response:

```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "uid": "...",
    "email": "customer@test.com",
    "role": "customer"
  }
}
```

---

## Notes

- **Port:** Default is 5000 (set via `PORT` environment variable)
- **Environment:** Check `NODE_ENV` setting (development/production)
- **Authentication:** Uses JWT Bearer tokens
- **CORS:** Enabled for frontend communication
- **Database:** Firebase Firestore (with mock fallback for development)

---

✅ All endpoints are now documented and have improved error messages!
