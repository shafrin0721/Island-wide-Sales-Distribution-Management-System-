# 📂 PROJECT STRUCTURE & NPM SETUP GUIDE

## ⚠️ Important: Node.js Dependencies Location

The RDC Management System has a **monolithic structure** with frontend and backend:

```
APP/
├── index.html              ← Frontend (no npm needed)
├── css/                    ← Frontend styles
├── js/                     ← Frontend JavaScript
├── pages/                  ← Frontend pages
│
└── backend/                ← Backend (Node.js + npm)
    ├── package.json        ← ⭐ NPM IS HERE
    ├── package-lock.json
    ├── node_modules/       ← Installed packages (21)
    ├── server.js           ← Main server file
    ├── routes/             ← API endpoints
    ├── services/           ← Business logic
    └── config/             ← Configuration
```

---

## ✅ CORRECT WAY TO INSTALL DEPENDENCIES

### Step 1: Navigate to Backend Directory
```powershell
cd backend
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Verify Installation
```powershell
npm list --depth=0
```

---

## ❌ WRONG WAY (What You Did)

```powershell
npm install  # ❌ From root directory - NO package.json here!
```

This fails because there's no `package.json` in the root directory.

---

## ✅ STATUS CHECK

**Backend Dependencies:** Already installed ✅

```
✅ 21 packages installed
✅ node_modules/ directory exists
✅ All services loaded successfully
✅ Ready to start server
```

---

## 🚀 QUICK START (Correct Steps)

### 1. Navigate to Backend
```powershell
cd "d:\top up\Advance Software Engineerinh\APP\backend"
```

### 2. Start Development Server
```powershell
npm start       # Production mode
npm run dev     # Development mode with auto-reload
```

### 3. Open Frontend in Browser
```
File → Open: index.html
Or: http://localhost:8000 (if using http-server)
```

---

## 📝 ENVIRONMENT SETUP

Create `.env` file in `backend/` folder:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Add your credentials here
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
STRIPE_SECRET_KEY=...
etc.
```

---

## 🔧 TROUBLESHOOTING

### Error: "Cannot find package.json"
- **Cause:** Running npm from root directory
- **Solution:** `cd backend` then run npm commands

### Error: "node_modules not found"
- **Cause:** Dependencies not installed in backend
- **Solution:** `npm install` (from backend folder)

### Error: "Port already in use"
- **Cause:** Another process on port 5000
- **Solution:** Change PORT in .env or kill process

### Error: "Firebase not initialized"
- **Cause:** Missing .env credentials
- **Solution:** Add FIREBASE_* variables to .env

---

## 📦 WHAT'S INSTALLED

✅ **21 Production & Development Packages:**
- Express.js (Web framework)
- Socket.io (Real-time updates)
- Firebase Admin (Database)
- Stripe (Payments)
- Nodemailer (Email)
- PDFKit (PDF generation)
- Redis (Caching)
- And more...

---

## ✨ SUMMARY

- **Frontend:** No npm needed (static HTML/CSS/JS)
- **Backend:** Navigate to `backend/` folder first
- **npm commands:** Always run from `backend/` directory
- **Dependencies:** Already installed and ready ✅

---

**Next Step:** Run `cd backend && npm start` to begin! 🚀
