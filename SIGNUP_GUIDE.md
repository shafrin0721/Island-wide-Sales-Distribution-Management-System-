# Signup & User Role System

## Overview

The application supports three user roles based on signup credentials:

- **Customer** - Default role (no key required)
- **RDC Staff** - Requires RDC key
- **Delivery Staff** - Requires Delivery key

---

## Signup Flow

### For Customers

1. Go to `/signup.html`
2. Fill in personal information:
   - First Name
   - Last Name
   - Email
   - Phone
   - Address
   - Password (min 6 characters)
3. **Leave "Unique Key" field empty**
4. Accept Terms of Service
5. Click "Create Account"
6. User is created as a **Customer**
7. Redirected to login page
8. Login and access customer dashboard

### For RDC Staff

1. Go to `/signup.html`
2. Fill in all required fields
3. Enter RDC Key in "Unique Key" field:
   - Valid keys: `RDC_KEY_2024` or any key starting with `RDC` (e.g., `RDC001`)
4. Accept Terms of Service
5. Click "Create Account"
6. User is created with **RDC role**
7. Redirected to login page
8. Login and access RDC dashboard at `/pages/rdc/dashboard.html`

### For Delivery Staff

1. Go to `/signup.html`
2. Fill in all required fields
3. Enter Delivery Key in "Unique Key" field:
   - Valid keys: `DELIVERY_KEY_2024` or any key starting with `DELIVERY` (e.g., `DELIVERY001`)
4. Accept Terms of Service
5. Click "Create Account"
6. User is created with **Delivery role**
7. Redirected to login page
8. Login and access delivery dashboard at `/pages/delivery/dashboard.html`

---

## Test Keys

### RDC Keys (Valid)

```
RDC_KEY_2024
RDC001
RDC_ADMIN
RDC_STAFF
```

### Delivery Keys (Valid)

```
DELIVERY_KEY_2024
DELIVERY001
DELIVERY_STAFF
DELIVERY_DRIVER
```

### Invalid Keys

```
INVALID_KEY       ❌ Will show error
ADMIN123          ❌ Will show error
TEST_KEY          ❌ Will show error
```

---

## Test Credentials

### Customer Account

```
Email: customer@example.com
Password: password123
Role: customer
```

### RDC Account

```
Email: rdc@example.com
Password: password123
Key: RDC_KEY_2024
Role: rdc
```

### Delivery Account

```
Email: delivery@example.com
Password: password123
Key: DELIVERY_KEY_2024
Role: delivery
```

---

## Role-Based Dashboards

### Customer Dashboard

- View products
- Add to cart
- Checkout
- View order history
- Manage profile
- **Access:** `/pages/customer/products.html`

### RDC Dashboard

- View inventory
- Manage orders
- View delivery assignments
- **Access:** `/pages/rdc/dashboard.html`

### Delivery Dashboard

- View assigned deliveries
- Update delivery status
- Navigate routes
- **Access:** `/pages/delivery/dashboard.html`

---

## API Integration

### Registration Endpoint

```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "address": "123 Main St",
  "role": "customer"  // or "rdc", "delivery"
}
```

### Response

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "uid": "user_id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "customer"
  },
  "token": "jwt_token_here"
}
```

---

## Error Handling

### Common Signup Errors

| Error                                  | Cause              | Solution                            |
| -------------------------------------- | ------------------ | ----------------------------------- |
| All fields are required                | Missing input      | Fill all required fields            |
| Password must be at least 6 characters | Weak password      | Use 6+ characters                   |
| Passwords do not match                 | Confirmation error | Ensure both passwords are identical |
| Invalid key                            | Wrong key format   | Use valid RDC or Delivery key       |
| Email already registered               | Account exists     | Try different email or login        |

---

## Security Features

✅ **Password Validation**

- Minimum 6 characters required
- Password confirmation check
- Hashed storage

✅ **Email Validation**

- Must be valid email format
- Duplicate check on registration

✅ **Key Validation**

- Only specific keys accepted
- Case-insensitive matching
- Prevents unauthorized role assignment

✅ **User Data**

- Stored in localStorage for session persistence
- JWT token for API authentication
- Role-based access control enforced

---

## Customizing Role Keys

To modify valid keys, edit `signup.html` lines 303-316:

```javascript
// Determine user role based on key
let role = "customer"; // default role

if (key) {
  if (key === "RDC_KEY_2024" || key.toUpperCase().startsWith("RDC")) {
    role = "rdc";
  } else if (
    key === "DELIVERY_KEY_2024" ||
    key.toUpperCase().startsWith("DELIVERY")
  ) {
    role = "delivery";
  } else {
    showMessage("Invalid key. Please check and try again.", "error");
    return;
  }
}
```

---

## Next Steps

1. **Test Signup**: Create accounts with different roles
2. **Test Login**: Verify users can log in and access correct dashboards
3. **Test Navigation**: Ensure role-based navigation works
4. **Configure Keys**: Update keys in production environment
5. **Deploy**: Push to production with real Firebase/Database
