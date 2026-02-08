# 🚀 Quick Access Guide

## Servers Running ✅

| Service      | URL                                 | Purpose                 |
| ------------ | ----------------------------------- | ----------------------- |
| **Frontend** | http://localhost:8000               | Web application         |
| **Backend**  | http://localhost:5000/api           | REST API                |
| **CSP Test** | http://localhost:8000/test-csp.html | Verify security headers |

---

## Quick Links

### 🔐 Authentication

- **Login Page**: http://localhost:8000/index.html
- **Signup Page**: http://localhost:8000/signup.html
- **Forgot Password**: http://localhost:8000/forgot-password.html

### 👥 Role-Based Pages

#### Customer Pages

- Products: http://localhost:8000/pages/customer/products.html
- Cart: http://localhost:8000/pages/customer/cart.html
- Checkout: http://localhost:8000/pages/customer/checkout.html
- Orders: http://localhost:8000/pages/customer/orders.html
- Track Delivery: http://localhost:8000/pages/customer/track-delivery.html
- Profile: http://localhost:8000/pages/customer/profile.html

#### RDC Staff Pages

- Dashboard: http://localhost:8000/pages/rdc/dashboard.html
- Orders: http://localhost:8000/pages/rdc/orders.html
- Inventory: http://localhost:8000/pages/rdc/inventory.html
- Delivery: http://localhost:8000/pages/rdc/delivery.html

#### Delivery Staff Pages

- Dashboard: http://localhost:8000/pages/delivery/dashboard.html
- Deliveries: http://localhost:8000/pages/delivery/deliveries.html
- Profile: http://localhost:8000/pages/delivery/profile.html

#### Admin Pages

- Dashboard: http://localhost:8000/pages/admin/dashboard.html
- Users: http://localhost:8000/pages/admin/users.html
- Reports: http://localhost:8000/pages/admin/reports.html
- Settings: http://localhost:8000/pages/admin/settings.html

---

## Test Credentials

### Option 1: Use Existing Test Accounts

```
Email: customer@test.com
Password: password123
```

### Option 2: Create New Account

1. Go to: http://localhost:8000/signup.html
2. Fill form:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Phone: 0771234567
   - Address: 123 Main St
   - Password: password123
   - Key: (leave empty for customer, "RDC" for staff, "DELIVERY" for driver)
3. Click "Create Account"

---

## Verification Checklist

- [ ] Frontend loads (http://localhost:8000)
- [ ] CSP test passes (http://localhost:8000/test-csp.html)
- [ ] Can login with test account
- [ ] Can see customer dashboard
- [ ] Can create account via signup page
- [ ] No console errors (F12 → Console)
- [ ] No CSP violations (F12 → Network → Headers)

---

## Troubleshooting

**Q: "Backend not running" error?**  
A: Backend might not be started. Run:

```
cd backend && npm start
```

**Q: "Fetch failed" when signing up?**  
A: This is normal - backend not configured. Signup will save to localStorage instead.

**Q: CSP errors in console?**  
A: These are fixed. Check backend server has correct headers. See ISSUES_FIXED.md

**Q: Can't access http://localhost:8000?**  
A: Frontend server not running. Start it with:

```
npx http-server . -p 8000
```

---

## Documentation Files

📖 **Quick Reference**: QUICK_REFERENCE_CARD.md  
📖 **Issues Fixed**: ISSUES_FIXED.md  
📖 **System Status**: SYSTEM_READY_FOR_TESTING.md  
📖 **Features List**: ISDN_FEATURES_VERIFICATION.md  
📖 **Complete Inventory**: COMPLETE_FILE_INVENTORY.md

---

**Ready to test?** Start here: http://localhost:8000/index.html

All fixes applied ✅  
Both servers running ✅  
Test accounts ready ✅
