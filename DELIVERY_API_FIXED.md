# Delivery API - Fixed Route Order

## ✅ Fixed Issue

**Problem:** Routes in `backend/routes/delivery_enhanced.js` were in the wrong order. Generic routes (like `/:deliveryId`) were being matched before specific routes (like `/driver/:driverId`, `/analytics/:rdcId`), causing "Route not found" errors.

**Solution:** Reordered routes so specific routes come BEFORE generic ones.

---

## Correct Route Order

### 1. Base Route (no parameters)

```
GET  /api/delivery               (List all deliveries)
```

### 2. Specific Routes (must come before generic)

```
POST /api/delivery/optimize-route    (Route optimization)
GET  /api/delivery/driver/:driverId  (Get driver's deliveries)
GET  /api/delivery/analytics/:rdcId  (Get delivery analytics)
```

### 3. Generic Routes (comes last)

```
GET  /api/delivery/:deliveryId              (Get single delivery)
POST /api/delivery/:deliveryId/location     (Update GPS location)
POST /api/delivery/:deliveryId/complete     (Complete delivery)
```

---

## Testing the Endpoints

### 1. List All Deliveries

```bash
curl -X GET "http://localhost:5000/api/delivery"
```

Response:

```json
{
  "success": true,
  "message": "All deliveries",
  "deliveries": [],
  "filters": {}
}
```

### 2. Get Driver's Active Deliveries

```bash
curl -X GET "http://localhost:5000/api/delivery/driver/DRV-001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Get Delivery Tracking Info

```bash
curl -X GET "http://localhost:5000/api/delivery/DEL-001"
```

Response:

```json
{
  "success": true,
  "delivery": {
    "status": "pending"
  }
}
```

### 4. Update GPS Location

```bash
curl -X POST "http://localhost:5000/api/delivery/DEL-001/location" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 6.9271,
    "lon": 80.6369,
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

### 5. Complete Delivery

```bash
curl -X POST "http://localhost:5000/api/delivery/DEL-001/complete" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "signature": "data:image/png;base64,...",
    "photo": "data:image/png;base64,...",
    "recipientName": "John Doe",
    "notes": "Delivered successfully"
  }'
```

### 6. Get Delivery Analytics

```bash
curl -X GET "http://localhost:5000/api/delivery/analytics/RDC-CENTRAL" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 7. Optimize Delivery Route

```bash
curl -X POST "http://localhost:5000/api/delivery/optimize-route" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deliveries": [
      {"deliveryId": "DEL-001", "address": {"lat": 6.9271, "lon": 80.6369}},
      {"deliveryId": "DEL-002", "address": {"lat": 6.8350, "lon": 80.6700}}
    ],
    "depotLocation": {"lat": 6.9271, "lon": 80.6369}
  }'
```

---

## Authentication Notes

Routes marked with ✅ require JWT Bearer token in Authorization header:

- ✅ `GET /api/delivery/driver/:driverId` (delivery_staff or admin)
- ✅ `GET /api/delivery/analytics/:rdcId` (rdc_staff or admin)
- ✅ `POST /api/delivery/optimize-route` (rdc_staff or admin)
- ✅ `POST /api/delivery/:deliveryId/location` (delivery_staff)
- ✅ `POST /api/delivery/:deliveryId/complete` (delivery_staff)

Public routes (no auth required):

- 🔓 `GET /api/delivery`
- 🔓 `GET /api/delivery/:deliveryId`

---

## Route Ordering Important!

In Express.js, routes are matched in the order they're defined. Therefore:

- **Specific routes MUST come BEFORE generic routes**
- Example: `/driver/:driverId` must come before `/:deliveryId`
- Without this ordering, Express matches `/:deliveryId` and treats "driver" as a delivery ID

---

## Files Changed

- `backend/routes/delivery_enhanced.js` - Reordered routes for correct matching

All delivery endpoints should now work correctly! ✅
