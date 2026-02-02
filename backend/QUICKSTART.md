# RDC Backend - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Prerequisites Check

```bash
# Check Node.js version (should be 14+)
node --version

# Check PostgreSQL is running
psql --version
```

### 2. Install & Configure (3 minutes)

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# At minimum, configure:
# - DB_USER, DB_PASSWORD, DB_NAME
# - JWT_SECRET (can be any random string)
```

### 3. Database Setup (1 minute)

```bash
# Create database (requires PostgreSQL)
createdb -U postgres rdc_database

# Create user
createuser -U postgres rdc_user
psql -U postgres -d rdc_database -c "ALTER USER rdc_user WITH PASSWORD 'your_password';"

# Run migrations
npm run migrate
```

### 4. Start Server (1 minute)

```bash
# Development mode (with auto-reload)
npm run dev

# Should see: "✓ Server running on port 5000"
```

## 🧪 Test It Works

### Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "phone": "+1234567890"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response will include a `token` - save this!**

### Get Your Profile

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:5000/api/auth/me
```

## 📱 Frontend Integration

### In your frontend code:

```javascript
// Set API base URL
const API_URL = "http://localhost:5000/api";

// Login example
const response = await fetch(`${API_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const { token, user } = await response.json();
localStorage.setItem("token", token);

// Authenticated request
const meResponse = await fetch(`${API_URL}/auth/me`, {
  headers: { Authorization: `Bearer ${token}` },
});
```

### Real-time Connection

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("order:created", (data) => {
  console.log("New order:", data);
});

socket.on("delivery:location_updated", (data) => {
  console.log("Delivery location:", data);
});
```

## 🔌 Configure External Services (Optional)

### Email Setup (Gmail)

1. Generate app password: https://myaccount.google.com/apppasswords
2. Add to `.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### SMS Setup (Twilio)

1. Create account: https://www.twilio.com
2. Get credentials from console
3. Add to `.env`:

```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Payment Setup (Stripe)

1. Create account: https://stripe.com
2. Get test keys from dashboard
3. Add to `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📊 Create Sample Data

```javascript
// Create a product
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "price": 1000,
    "category": "electronics",
    "sku": "LAPTOP-001",
    "stock_level": 50,
    "description": "High-performance laptop"
  }'

// Create an order
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{ "product_id": 1, "quantity": 1 }],
    "delivery_address": "123 Main St",
    "delivery_city": "New York",
    "delivery_country": "USA",
    "delivery_postal_code": "10001"
  }'
```

## 🐛 Troubleshooting

### "Cannot connect to database"

```
✓ Check PostgreSQL is running
✓ Verify DB_USER, DB_PASSWORD, DB_NAME in .env
✓ Run: createdb -U postgres rdc_database
```

### "Database tables not found"

```
✓ Run migrations: npm run migrate
✓ Check migration file exists
```

### "Port 5000 already in use"

```
✓ Change PORT in .env
✓ Or kill existing process: lsof -ti:5000 | xargs kill -9
```

### "Email not sending"

```
✓ Check EMAIL_USER and EMAIL_PASSWORD
✓ For Gmail, enable app passwords
✓ Check EMAIL_SERVICE setting
```

## 📚 Key Endpoints Reference

### Products

- GET `/api/products` - List all
- GET `/api/products/:id` - Get one
- POST `/api/products` - Create (admin)
- PUT `/api/products/:id` - Update (admin)

### Orders

- POST `/api/orders` - Create
- GET `/api/orders` - List mine
- GET `/api/orders/:id` - Get details
- POST `/api/orders/:id/cancel` - Cancel

### Payments

- POST `/api/payments/create-intent` - Create payment
- POST `/api/payments/confirm` - Confirm payment
- GET `/api/payments/history/list` - Payment history

### Deliveries

- POST `/api/deliveries` - Create (admin)
- GET `/api/deliveries/:id` - Get details
- POST `/api/deliveries/:id/location` - Update GPS
- PUT `/api/deliveries/:id/status` - Update status

### Analytics (Admin)

- GET `/api/analytics/sales/overview` - Sales data
- GET `/api/analytics/products/top-sellers` - Top products
- GET `/api/analytics/dashboard/summary` - Dashboard data

## 🚀 Deploy to Production

### Using Docker

```bash
# Build image
docker build -t rdc-backend .

# Run container
docker run -p 5000:5000 \
  --env-file .env \
  rdc-backend

# Or use docker-compose
docker-compose up -d
```

### Heroku

```bash
# Create Procfile
echo "web: npm start" > Procfile

# Deploy
git push heroku main
```

## 📖 Full Documentation

See `backend/README.md` for complete API documentation

## ✅ Checklist Before Going Live

- [ ] `.env` configured with real credentials
- [ ] Database migrated (`npm run migrate`)
- [ ] Server starts without errors (`npm start`)
- [ ] Login works and returns token
- [ ] Products can be created/retrieved
- [ ] Orders can be created
- [ ] Payment processing working
- [ ] Email/SMS sending (if configured)
- [ ] HTTPS enabled (production)
- [ ] Database backups configured
- [ ] Monitoring/logging setup
- [ ] Rate limiting tested

## 🆘 Need Help?

1. Check `backend/README.md` for detailed docs
2. Review error logs: `npm run dev` shows errors
3. Test endpoints with Postman
4. Check `.env` file for missing credentials

---

**Status:** ✅ Ready to use!
**Estimated time to production:** 2-3 hours
**Questions?** Check README.md or troubleshooting section above
