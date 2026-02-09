# RDC Backend - Firebase Cloud Database Edition

> **Status:** ✅ Fully migrated to Firebase Cloud Database  
> **Storage:** ☁️ Cloud-hosted (No local storage needed)  
> **Authentication:** 🔐 Firebase Auth (built-in)  
> **Database:** 🗄️ Firestore (NoSQL)  
> **Multi-user:** ✅ Anyone can register and login globally

---

## 🎯 What Changed?

Previously, the backend used PostgreSQL (local database). Now it uses **Firebase** for:

| Feature         | Before (PostgreSQL)     | After (Firebase)            |
| --------------- | ----------------------- | --------------------------- |
| Database        | Local, on your computer | Cloud, accessible worldwide |
| Storage         | Limited by your drive   | Unlimited scalable storage  |
| Authentication  | Custom JWT tokens       | Built-in Firebase Auth      |
| User Management | Manual password hashing | Automatic, secure           |
| Backup          | Manual                  | Automatic daily             |
| Cost            | Pay for server          | Free tier / pay-as-you-go   |
| Setup Time      | 30+ minutes             | 5 minutes                   |

---

## 📦 Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Firebase

Create a `.env` file in the backend folder:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT (optional, kept for backward compatibility)
JWT_SECRET=your_jwt_secret

# Third-party Services
STRIPE_SECRET_KEY=your_stripe_key
NODEMAILER_EMAIL=your_email@gmail.com
NODEMAILER_PASSWORD=your_app_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE=your_twilio_phone
```

### 3. Setup Firebase Project

Follow the **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** guide to:

- Create a Firebase project
- Enable Firestore database
- Enable Firebase Authentication
- Get your credentials
- Set environment variables

### 4. Start the Server

```bash
npm run dev
```

Expected output:

```
✓ Firebase initialized successfully
Server running on port 5000
```

---

## 🚀 API Endpoints

### Authentication Endpoints

All requests should include the Firebase token in the header:

```
Authorization: Bearer YOUR_FIREBASE_TOKEN
```

#### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "role": "customer"
}

Response:
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

#### Login User

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
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

#### Get Current User

```bash
GET /api/auth/me
Authorization: Bearer YOUR_TOKEN

Response:
{
  "success": true,
  "user": {
    "uid": "firebase_uid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "phone": "+1234567890",
    "role": "customer",
    "status": "active",
    "createdAt": "2024-01-16T02:23:00Z",
    "updatedAt": "2024-01-16T02:23:00Z"
  }
}
```

#### Update Profile

```bash
PUT /api/auth/profile
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "full_name": "John Smith",
  "phone": "+1234567890",
  "preferences": {
    "language": "en",
    "notifications": true
  }
}
```

#### Change Password

```bash
POST /api/auth/change-password
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

#### Logout

```bash
POST /api/auth/logout
Authorization: Bearer YOUR_TOKEN
```

#### Refresh Token

```bash
POST /api/auth/refresh-token
Authorization: Bearer YOUR_TOKEN
```

#### Verify Token

```bash
GET /api/auth/verify
Authorization: Bearer YOUR_TOKEN
```

---

## 📊 Firestore Collections

The database automatically creates these collections:

### Users Collection

```
/users/{uid}
├── email: string
├── displayName: string
├── phone: string
├── role: enum (customer|admin|delivery|rdc)
├── status: enum (active|inactive|deleted)
├── preferences: object
├── createdAt: timestamp
├── updatedAt: timestamp
└── lastLogin: timestamp
```

### Products Collection

```
/products/{productId}
├── name: string
├── description: string
├── price: number
├── category: string
├── stock: number
├── image: string
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Orders Collection

```
/orders/{orderId}
├── customer_id: string (uid)
├── items: array
├── status: enum (pending|confirmed|shipped|delivered|cancelled)
├── total: number
├── shipping_address: object
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Additional Collections

- Deliveries
- Payments
- Notifications
- Recommendations
- Analytics
- Inventory

---

## 🔐 Security Rules

The default Firestore security rules allow read/write for authenticated users. Before going to production, update the rules in Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Admin can access anything
    match /{document=**} {
      allow read, write: if
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Public products
    match /products/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## 🐛 Troubleshooting

### "Firebase connection failed"

```
✓ Verify FIREBASE_PROJECT_ID in .env
✓ Check FIREBASE_PRIVATE_KEY format
✓ Confirm FIREBASE_CLIENT_EMAIL
✓ Ensure Firestore is enabled in Firebase Console
```

### "Permission denied" Error

```
✓ Update Firestore Security Rules
✓ Verify user is authenticated
✓ Check token is valid
```

### "Cannot find module" Error

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Invalid credentials" Error

```
✓ Download new Firebase credentials from Google Cloud Console
✓ Replace in .env file
✓ Ensure PRIVATE_KEY has literal \n characters
```

---

## 📚 File Structure

```
backend/
├── config/
│   └── firebase.js          ← Firebase config & utilities
├── middleware/
│   └── auth.js              ← Firebase auth middleware
├── routes/
│   ├── auth.js              ← Firebase auth routes
│   ├── products.js
│   ├── orders.js
│   ├── delivery.js
│   ├── payments.js
│   └── analytics.js
├── services/
│   ├── NotificationService.js
│   └── RecommendationEngine.js
├── server.js                ← Main server with Firebase init
├── package.json
├── .env.example
└── FIREBASE_SETUP.md        ← Setup guide
```

---

## 🔄 Migration Notes

### From PostgreSQL to Firebase

If you had data in PostgreSQL, here's how to migrate:

1. **Export PostgreSQL data** as JSON
2. **Transform** to Firestore format (if needed)
3. **Import** into Firestore via Firebase Console
4. **Test** all endpoints

Example migration script available in migrations folder.

---

## 💡 Best Practices

### Development

```bash
npm run dev              # Start with hot reload
npm run dev:debug      # Debug mode
```

### Production

```bash
npm start              # Start server
NODE_ENV=production    # Set environment
```

### Monitoring

- Check Firebase Console for database usage
- Monitor Firestore reads/writes
- Track authentication events
- Set up alerts for quota limits

---

## 🆘 Support & Documentation

- **Firebase Setup:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- **Backend Index:** [../BACKEND_PROJECT_INDEX.md](../BACKEND_PROJECT_INDEX.md)
- **API Reference:** [../BACKEND_IMPLEMENTATION_SUMMARY.md](../BACKEND_IMPLEMENTATION_SUMMARY.md)
- **Firebase Docs:** https://firebase.google.com/docs/firestore
- **Firebase Auth:** https://firebase.google.com/docs/auth

---

## ✨ Key Features

✅ **No local storage needed** - Everything in the cloud  
✅ **Automatic backups** - Firebase handles it  
✅ **Global access** - Anyone can register from anywhere  
✅ **Enterprise security** - Google-level encryption  
✅ **Real-time updates** - Firestore live sync  
✅ **Auto-scaling** - Handles any number of users  
✅ **Free tier** - Get started for free  
✅ **Easy integration** - Built-in authentication

---

## 🎉 You're Ready!

Your RDC backend is now powered by Firebase Cloud Database.

**Next steps:**

1. Setup Firebase (see FIREBASE_SETUP.md)
2. Start the server: `npm run dev`
3. Create test users
4. Integrate with your frontend
5. Deploy to production

**Status:** ✅ Firebase Migration Complete
