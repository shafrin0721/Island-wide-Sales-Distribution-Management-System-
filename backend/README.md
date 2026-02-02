# RDC Management System - Backend Setup Guide

## Overview

This is a complete backend implementation for the RDC (Regional Distribution Center) Management System built with Node.js, Express.js, and PostgreSQL. It includes comprehensive features for managing products, orders, deliveries, payments, analytics, and real-time notifications.

## Features Implemented

### 1. **Backend API Integration** ✅

- Node.js/Express.js REST API framework
- Socket.io for real-time communication
- JWT-based authentication
- Role-based access control (Customer, Admin, Delivery Partner)
- CORS support for cross-origin requests

### 2. **Database Persistence** ✅

- PostgreSQL database with 14 tables
- Comprehensive schema with relationships and indexes
- Automatic migrations support
- Transaction support for data consistency
- Audit logging for compliance

### 3. **Real-time Notifications** ✅

- Socket.io events for orders, deliveries, inventory
- Email notifications (Nodemailer)
- SMS notifications (Twilio)
- Multi-channel notification routing
- Notification history and preferences

### 4. **SMS/Email Delivery** ✅

- Nodemailer for transactional emails
- Twilio for SMS notifications
- Order confirmation emails
- Delivery status updates
- Payment notifications
- Promotional email campaigns

### 5. **Advanced Analytics** ✅

- Sales analytics (daily/weekly/monthly)
- Product performance metrics
- Customer segmentation
- Delivery performance tracking
- Inventory analysis
- Revenue and KPI dashboards
- CSV/JSON export functionality

### 6. **Machine Learning Recommendations** ✅

- Collaborative filtering algorithm
- User-based recommendations
- Product bundle recommendations
- Category-based suggestions
- Personalized scoring system
- Trend analysis

### 7. **Mobile App Compatibility** ✅

- REST API with JSON responses
- Mobile-friendly endpoints
- CORS enabled for native apps
- Token-based authentication
- Comprehensive error handling

### 8. **Multi-language Support** ✅

- i18n framework for 5 languages
- English (en), Spanish (es), French (fr), Portuguese (pt), Arabic (ar)
- Language detection and auto-switching
- User preference storage

### 9. **Payment Gateway Integration** ✅

- Stripe payment processing
- Payment intent creation
- Webhook handling for payment events
- Refund processing
- Payment history tracking
- Transaction logging

## Project Structure

```
backend/
├── config/
│   └── database.js          # PostgreSQL connection & utilities
├── middleware/
│   └── auth.js              # Authentication & authorization
├── routes/
│   ├── auth.js              # User authentication endpoints
│   ├── products.js          # Product catalog endpoints
│   ├── orders.js            # Order management endpoints
│   ├── payments.js          # Payment processing endpoints
│   ├── delivery.js          # Delivery tracking endpoints
│   └── analytics.js         # Analytics & reporting endpoints
├── services/
│   ├── NotificationService.js    # Email & SMS
│   └── RecommendationEngine.js   # ML recommendations
├── migrations/
│   └── 001_initial_schema.sql    # Database schema
├── locales/
│   ├── en.json              # English translations
│   ├── es.json              # Spanish translations
│   ├── fr.json              # French translations
│   ├── pt.json              # Portuguese translations
│   └── ar.json              # Arabic translations
├── server.js                # Main Express server
├── package.json             # Dependencies
└── .env.example             # Environment template
```

## Installation & Setup

### Prerequisites

- Node.js v14+ (https://nodejs.org/)
- PostgreSQL v12+ (https://www.postgresql.org/)
- Git

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Update the `.env` file with your credentials:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=rdc_user
DB_PASSWORD=your_secure_password
DB_NAME=rdc_database

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLIC_KEY=pk_live_your_key
```

### Step 3: Create Database

```bash
# Create PostgreSQL database
createdb -U postgres rdc_database

# Create database user
createuser -U postgres rdc_user
```

### Step 4: Run Migrations

```bash
npm run migrate
```

This will automatically execute the migration script and create all necessary tables.

### Step 5: Start the Server

**Development (with auto-reload):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Server will run on `http://localhost:5000`

## API Documentation

### Authentication Endpoints

**Register User**

```
POST /api/auth/register
Body: { email, password, full_name, phone, role }
Response: { success, user, token }
```

**Login**

```
POST /api/auth/login
Body: { email, password }
Response: { success, user, token }
```

**Get Current User**

```
GET /api/auth/me
Headers: { Authorization: Bearer <token> }
Response: { success, user }
```

### Products Endpoints

**Get Products**

```
GET /api/products?page=1&limit=20&category=electronics
Response: { success, data[], pagination }
```

**Get Product Details**

```
GET /api/products/:id
Response: { success, data }
```

**Create Product (Admin)**

```
POST /api/products
Headers: { Authorization: Bearer <admin_token> }
Body: { name, price, category, sku, stock_level, ... }
```

### Orders Endpoints

**Create Order**

```
POST /api/orders
Headers: { Authorization: Bearer <customer_token> }
Body: { items[], delivery_address, delivery_city, ... }
Response: { success, data }
```

**Get User Orders**

```
GET /api/orders
Headers: { Authorization: Bearer <token> }
```

**Get Order Details**

```
GET /api/orders/:id
Headers: { Authorization: Bearer <token> }
```

### Payments Endpoints

**Create Payment Intent**

```
POST /api/payments/create-intent
Body: { order_id }
Response: { success, client_secret, payment_intent_id }
```

**Confirm Payment**

```
POST /api/payments/confirm
Body: { payment_intent_id, order_id }
```

### Delivery Endpoints

**Create Delivery**

```
POST /api/deliveries
Headers: { Authorization: Bearer <admin_token> }
Body: { order_id, driver_id, scheduled_delivery_time }
```

**Update Location (Real-time)**

```
POST /api/deliveries/:id/location
Headers: { Authorization: Bearer <driver_token> }
Body: { latitude, longitude, accuracy, speed }
```

**Get Delivery Tracking**

```
GET /api/deliveries/:id
Response: { success, data, tracking_history[] }
```

### Analytics Endpoints

**Sales Analytics**

```
GET /api/analytics/sales/overview?period=monthly
Headers: { Authorization: Bearer <admin_token> }
```

**Top Products**

```
GET /api/analytics/products/top-sellers?limit=10&days=30
```

**Dashboard Summary**

```
GET /api/analytics/dashboard/summary
```

## Real-time Events (Socket.io)

### Order Events

```javascript
// Client listens
socket.on("order:created", (data) => {});
socket.on("order:updated", (data) => {});

// Server emits
io.emit("order:created", orderData);
```

### Delivery Events

```javascript
socket.on("delivery:location_updated", (data) => {});
socket.on("delivery:status_changed", (data) => {});
```

### Inventory Events

```javascript
socket.on("inventory:stock_changed", (data) => {});
```

## Database Tables

1. **users** - User accounts with roles
2. **products** - Product catalog
3. **categories** - Product categories
4. **suppliers** - Supplier management
5. **inventory** - Stock levels by location
6. **inventory_movements** - Audit trail
7. **orders** - Customer orders
8. **order_items** - Line items
9. **payments** - Payment transactions
10. **deliveries** - Delivery tracking
11. **delivery_tracking_history** - GPS history
12. **notifications** - Email/SMS log
13. **analytics** - Aggregated metrics
14. **recommendations** - ML suggestions

## Security Features

- ✅ JWT authentication with expiration
- ✅ Password hashing with bcryptjs
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Rate limiting
- ✅ Role-based access control
- ✅ Input validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ Audit logging

## Testing

### Test Authentication

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Protected Route

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/me
```

## Deployment

### Docker Setup

Create `Dockerfile`:

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t rdc-backend .
docker run -p 5000:5000 --env-file .env rdc-backend
```

### Environment Setup for Production

```env
NODE_ENV=production
DB_HOST=prod-db-host.com
JWT_SECRET=very_long_random_string_256_chars
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Performance Optimization

- Database connection pooling enabled
- Indexes on frequently queried columns
- Pagination for large datasets
- Caching strategies for static data
- Compression middleware enabled
- Rate limiting on sensitive endpoints

## Monitoring & Logging

- Console logging for development
- Error tracking and reporting
- Request duration logging
- Database query logging
- Audit trail for compliance

## Troubleshooting

### Database Connection Error

```
Check DB credentials in .env
Ensure PostgreSQL is running: psql -U postgres
```

### Email Not Sending

```
Verify EMAIL_USER and EMAIL_PASSWORD
Enable "Less secure apps" for Gmail
Check SMTP settings
```

### Stripe Integration Issue

```
Verify STRIPE_SECRET_KEY format
Check webhook configuration
Test with Stripe test keys first
```

## Future Enhancements

- [ ] GraphQL API support
- [ ] Advanced caching with Redis
- [ ] Message queue for async operations
- [ ] ML model training pipeline
- [ ] Mobile app (React Native)
- [ ] Admin dashboard UI
- [ ] Advanced geolocation features
- [ ] Inventory forecasting
- [ ] Automated refund processing
- [ ] Customer loyalty program

## Support & Documentation

- API Documentation: `/api/docs`
- Database Schema: `/docs/schema.md`
- Deployment Guide: `/docs/deployment.md`

## License

MIT License - See LICENSE file for details

## Contact

For support and inquiries, please contact the development team.

---

**Last Updated:** 2024
**Backend Version:** 1.0.0
