3# 🎯 Postman Quick Start - 5 Minutes

**Your backend is running on:** `http://localhost:5000`

---

## Step 1: Open Postman

1. Launch **Postman** application
2. Sign in or continue as guest

---

## Step 2: Test Registration

### Create a New Request

1. Click **+ New**
2. Select **HTTP Request**

### Configure Request

**Method:** `POST`

**URL:** Copy and paste this exactly:

```
http://localhost:5000/api/auth/register
```

**Headers Tab:** Click **Headers** → Add this:

```
Key:   Content-Type
Value: application/json
```

**Body Tab:** Click **Body** → Select **raw** → Select **JSON** from dropdown

**Paste this:**

```json
{
  "email": "testuser@example.com",
  "password": "password123",
  "full_name": "Test User"
}
```

### Send & Copy Token

1. Click **Send** (blue button)
2. Response should show success with a `token`
3. **Copy the token value** (long string starting with `eyJ...`)

**Expected response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {...},
  "token": "eyJhbGc..."
}
```

---

## Step 3: Test Login

### Create Another Request

1. Click **+ New** → **HTTP Request**
2. **Method:** `POST`
3. **URL:** `http://localhost:5000/api/auth/login`
4. **Headers:** `Content-Type: application/json`
5. **Body (raw JSON):**

```json
{
  "email": "testuser@example.com",
  "password": "password123"
}
```

### Send

1. Click **Send**
2. You should get a token back
3. Copy this token too

---

## Step 4: Test Protected Route

### Create Protected Request

1. Click **+ New** → **HTTP Request**
2. **Method:** `GET`
3. **URL:** `http://localhost:5000/api/auth/me`

### Add Authorization

1. Click **Headers** tab
2. Click **Auth** tab (different from Headers)
3. Select **Bearer Token** from dropdown
4. **Token field:** Paste your token from Step 2 or 3

### Send

1. Click **Send**
2. You should get your user profile back

**Expected response:**

```json
{
  "success": true,
  "user": {
    "uid": "...",
    "email": "testuser@example.com",
    "displayName": "Test User",
    "role": "customer",
    "status": "active"
  }
}
```

---

## 📋 API Endpoints to Try

All of these are available to test:

### Authentication (No Token Needed)

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Authentication (Token Needed)

- `GET /api/auth/me` - Get your profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Products (No Token Needed)

- `GET /api/products` - List all products

### Other Endpoints (Token Needed)

- `GET /api/orders` - Your orders
- `GET /api/inventory` - Inventory
- `GET /api/notifications` - Notifications
- `GET /api/recommendations` - Recommendations

---

## 💡 Pro Tips for Postman

### Tip 1: Save Token Automatically

1. In a successful Login/Register request
2. Click **Tests** tab
3. Paste this script:

```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.token);
}
```

4. Now you can use `{{token}}` in Authorization fields

### Tip 2: Create Environment Variables

1. Top right → **Environments** → **+**
2. Name: `Local Dev`
3. Add variables:
   - `base_url` = `http://localhost:5000`
   - `token` = (empty, will fill automatically)
4. Now use `{{base_url}}/api/auth/me` instead of full URL

### Tip 3: Organize with Collections

1. **Collections** → **+ New Collection**
2. Name: `RDC API`
3. Add requests to it
4. Right-click to organize in folders

---

## ❓ Troubleshooting

### "Cannot GET /api/auth/register"

❌ **Wrong:** GET method  
✅ **Right:** Use POST method

### "404 Not Found"

❌ **Wrong:** `http://localhost:5000/auth/register` (missing `/api`)  
✅ **Right:** `http://localhost:5000/api/auth/register`

### "Unauthorized 401"

❌ **Wrong:** Missing or incorrect token  
✅ **Right:** Copy token from registration/login response, paste in Bearer Token field

### "Email already registered 409"

❌ **Problem:** User already exists with that email  
✅ **Solution:** Use a different email address for testing

### "Cannot connect to localhost:5000"

❌ **Problem:** Server not running  
✅ **Solution:**

1. Open terminal in `backend` folder
2. Run: `npm run dev`
3. Wait for: "Server running on port 5000"

### "Invalid JSON"

❌ **Wrong:** Missing quotes, trailing comma  
✅ **Right:** Valid JSON format (use Postman formatter: Ctrl+Alt+L)

---

## 📚 Full Documentation

For complete API documentation, see:

- **[POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)** ← Full endpoint reference
- **[README_FIREBASE.md](./README_FIREBASE.md)** ← Backend info
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ← Curl examples

---

## ✅ Done!

You're ready to test your API with Postman!

**Quick Summary:**

1. ✅ Server running on http://localhost:5000
2. ✅ Register a test user
3. ✅ Get a token
4. ✅ Use token to access protected endpoints
5. ✅ Explore the API

---

**Happy testing!** 🎉
