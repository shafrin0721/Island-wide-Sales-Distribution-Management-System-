# Firebase Backend - Quick Reference

## 🚀 5-Minute Startup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Create `.env` File

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
PORT=5000
NODE_ENV=development
```

### 3. Get Firebase Credentials

Go to: https://console.firebase.google.com/

- Project Settings → Service Accounts → Generate Private Key
- Copy values to `.env`

### 4. Start Server

```bash
npm run dev
```

Expected: `✓ Firebase initialized successfully`

---

## 📚 API Quick Reference

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"password123",
    "full_name":"John Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"password123"
  }'
```

### Get Current User

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Profile

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name":"John Smith",
    "phone":"+1234567890"
  }'
```

### Change Password

```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword":"oldpass",
    "newPassword":"newpass"
  }'
```

### Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔥 Firebase Utilities

### In Your Route Handlers

```javascript
const {
  db,
  auth,
  createUser,
  getUserByEmail,
  verifyToken,
} = require("../config/firebase");

// Create document
await db.collection("products").doc(productId).set(data);

// Get document
const doc = await db.collection("users").doc(uid).get();
const data = doc.data();

// Query documents
const query = await db
  .collection("orders")
  .where("customer_id", "==", userId)
  .limit(10)
  .get();

// Update document
await db.collection("users").doc(uid).update({ lastLogin: new Date() });

// Delete document
await db.collection("products").doc(productId).delete();

// Batch operations
const batch = db.batch();
batch.set(ref1, data1);
batch.update(ref2, data2);
await batch.commit();

// Create user
await createUser(email, password, displayName);

// Get user
const user = await getUserByEmail(email);

// Verify token
const decodedToken = await verifyToken(token);
```

---

## 📊 Firestore Collections Structure

### Users

```
/users/{uid}
  - email: string
  - displayName: string
  - phone: string
  - role: string (customer|admin|delivery|rdc)
  - status: string (active|inactive|deleted)
  - preferences: object
  - createdAt: timestamp
  - updatedAt: timestamp
  - lastLogin: timestamp
```

### Products

```
/products/{productId}
  - name: string
  - price: number
  - stock: number
  - category: string
  - description: string
  - image: string
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Orders

```
/orders/{orderId}
  - customer_id: string
  - items: array
  - status: string
  - total: number
  - createdAt: timestamp
  - updatedAt: timestamp
```

---

## 🆘 Troubleshooting

### Firebase not connecting

```
❌ Error: "Firebase connection failed"
✅ Fix:
  1. Check .env file exists
  2. Verify FIREBASE_PROJECT_ID
  3. Check FIREBASE_PRIVATE_KEY has \n characters
  4. Confirm Firestore is enabled
```

### Permission denied

```
❌ Error: "Permission denied"
✅ Fix:
  1. Update Firestore Security Rules
  2. Verify user is authenticated
  3. Check token is valid
```

### Module not found

```
❌ Error: "Cannot find module"
✅ Fix:
  npm install
  npm run dev
```

### Cannot get user

```
❌ Error: "User not found"
✅ Fix:
  1. Verify user exists in Firestore
  2. Check email is correct
  3. Verify collection name is 'users'
```

---

## 🔐 Security Rules

### Default (Development)

```
Allow all authenticated users to read/write
```

### Production

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /products/{doc=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## 📂 File Structure

```
backend/
├── config/
│   ├── firebase.js          ← Firebase config
│   └── database.js          ← Old PostgreSQL (backup)
├── middleware/
│   └── auth.js              ← Firebase auth
├── routes/
│   ├── auth.js              ← Firebase auth routes
│   ├── products.js
│   ├── orders.js
│   ├── payments.js
│   ├── delivery.js
│   └── analytics.js
├── services/
│   ├── NotificationService.js
│   └── RecommendationEngine.js
├── server.js                ← Main server
├── package.json
├── .env.example             ← Config template
├── FIREBASE_SETUP.md        ← Setup guide
├── README_FIREBASE.md       ← Full docs
└── MIGRATION_SUMMARY.md     ← Migration info
```

---

## 🌐 Deployment

### Local Development

```bash
npm run dev
```

### Production Build

```bash
NODE_ENV=production npm start
```

### Docker (Optional)

```bash
docker build -t rdc-backend .
docker run -p 5000:5000 --env-file .env rdc-backend
```

---

## 💻 Environment Variables

Required:

```env
FIREBASE_PROJECT_ID      # From Firebase Console
FIREBASE_PRIVATE_KEY     # From Firebase Console
FIREBASE_CLIENT_EMAIL    # From Firebase Console
```

Optional:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret
STRIPE_SECRET_KEY
NODEMAILER_EMAIL
NODEMAILER_PASSWORD
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE
```

---

## 📞 Support Resources

- **Firebase Setup:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- **Backend Docs:** [README_FIREBASE.md](./README_FIREBASE.md)
- **Migration Info:** [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)
- **Firebase Docs:** https://firebase.google.com/docs
- **Firestore Guide:** https://firebase.google.com/docs/firestore

---

## ✨ Status

| Component       | Status       |
| --------------- | ------------ |
| Firebase Config | ✅           |
| Auth Routes     | ✅           |
| Server Init     | ✅           |
| Dependencies    | ✅           |
| Documentation   | ✅           |
| **Overall**     | **✅ READY** |

---

## 🎯 What's Next?

1. ✅ Copy `.env` credentials
2. ✅ Run `npm install`
3. ✅ Run `npm run dev`
4. ✅ Test registration/login
5. ✅ Deploy to production

---

**Created:** January 16, 2026  
**Status:** ✅ Production Ready  
**Database:** Firebase Firestore  
**Auth:** Firebase Authentication
