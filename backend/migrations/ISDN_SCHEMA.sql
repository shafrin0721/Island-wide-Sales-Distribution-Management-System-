# ISDN Distribution
Management System - Database Schema

## SQL Schema Definition

### 1. Users Table
(Extended)
```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  profile_image_url TEXT,
  
  -- User Type
  role ENUM('customer', 'rdc_staff', 'logistics', 'rdc_manager', 'ho_manager', 'admin') NOT NULL DEFAULT 'customer',
  
  -- Customer Specific
  customer_type ENUM
('retailer', 'supermarket', 'reseller', 'other') NULL,
  business_name VARCHAR
(255),
  business_registration VARCHAR
(255),
  tax_id VARCHAR
(50),
  credit_limit DECIMAL
(10, 2) DEFAULT 10000.00,
  payment_terms VARCHAR
(50) DEFAULT 'Net 30',
  
  -- RDC Staff Specific
  assigned_rdc_id UUID REFERENCES rdcs
(rdc_id),
  staff_id VARCHAR
(50) UNIQUE,
  
  -- Address
  street_address VARCHAR
(255),
  city VARCHAR
(100),
  postal_code VARCHAR
(20),
  province VARCHAR
(100),
  country VARCHAR
(100),
  
  -- Status
  status ENUM
('active', 'inactive', 'suspended', 'pending_verification') DEFAULT 'pending_verification',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_email
(email),
  INDEX idx_role
(role),
  INDEX idx_assigned_rdc
(assigned_rdc_id)
);
```

### 2. Regional Distribution Centers
(RDCs)
```sql
CREATE TABLE rdcs (
  rdc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rdc_code VARCHAR(20) UNIQUE NOT NULL,
  rdc_name VARCHAR(100) NOT NULL,
  region ENUM('North', 'South', 'East', 'West', 'Central') NOT NULL,
  
  -- Contact
  phone VARCHAR
(20),
  email VARCHAR
(255),
  
  -- Address
  street_address VARCHAR
(255),
  city VARCHAR
(100),
  postal_code VARCHAR
(20),
  province VARCHAR
(100),
  
  -- Management
  manager_id UUID REFERENCES users
(user_id),
  supervisor_id UUID REFERENCES users
(user_id),
  
  -- Capacity
  max_capacity INT DEFAULT 50000, -- units
  warehouse_size_sqft INT,
  
  -- Operations
  operating_hours_start TIME,
  operating_hours_end TIME,
  delivery_radius_km INT DEFAULT 100,
  
  -- Status
  status ENUM
('operational', 'maintenance', 'closed') DEFAULT 'operational',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE
(rdc_name, region),
  INDEX idx_region
(region),
  INDEX idx_manager
(manager_id)
);
```

### 3. Products
```sql
CREATE TABLE products (
  product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  
  -- Descriptions
  description TEXT,
  product_image_url TEXT,
  
  -- Supplier
  supplier_id UUID REFERENCES suppliers(supplier_id),
  
  -- Pricing
  cost_price DECIMAL(10, 2) NOT NULL,
  wholesale_price DECIMAL(10, 2) NOT NULL,
  retail_price DECIMAL(10, 2) NOT NULL,
  
  -- Packaging
  unit_of_measure ENUM('pieces', 'kg', 'liters', 'boxes', 'cases') DEFAULT 'pieces',
  units_per_case INT,
  case_weight DECIMAL
(10, 2), -- kg
  case_dimensions VARCHAR
(50), -- LxWxH cm
  
  -- Stock Management
  reorder_level INT DEFAULT 100,
  reorder_quantity INT DEFAULT 500,
  shelf_life_days INT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_sku
(sku),
  INDEX idx_category
(category),
  INDEX idx_supplier
(supplier_id)
);
```

### 4. Inventory
(Real-Time Stock Levels)
```sql
CREATE TABLE inventory (
  inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rdc_id UUID NOT NULL REFERENCES rdcs(rdc_id),
  product_id UUID NOT NULL REFERENCES products(product_id),
  
  -- Stock Levels
  quantity_on_hand INT DEFAULT 0,
  quantity_reserved INT DEFAULT 0, -- allocated to orders
  quantity_available INT GENERATED ALWAYS AS
(quantity_on_hand - quantity_reserved) STORED,
  quantity_damaged INT DEFAULT 0,
  quantity_expired INT DEFAULT 0,
  
  -- Reorder Info
  reorder_level INT,
  last_reorder_date TIMESTAMP,
  
  -- Location
  warehouse_aisle VARCHAR
(20),
  warehouse_shelf VARCHAR
(20),
  warehouse_bin VARCHAR
(20),
  
  -- Timestamps
  last_counted_at TIMESTAMP,
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE
(rdc_id, product_id),
  INDEX idx_rdc
(rdc_id),
  INDEX idx_product
(product_id),
  INDEX idx_quantity_available
(quantity_available)
);
```

### 5. Orders
```sql
CREATE TABLE orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Parties Involved
  customer_id UUID NOT NULL REFERENCES users(user_id),
  assigned_rdc_id UUID REFERENCES rdcs(rdc_id),
  
  -- Order Details
  order_type ENUM('standard', 'urgent', 'bulk', 'recurring') DEFAULT 'standard',
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  required_delivery_date DATE,
  
  -- Quantities
  total_units INT,
  total_cases INT,
  
  -- Pricing
  subtotal DECIMAL
(12, 2),
  tax DECIMAL
(12, 2),
  shipping DECIMAL
(12, 2) DEFAULT 0,
  discount DECIMAL
(12, 2) DEFAULT 0,
  total_amount DECIMAL
(12, 2),
  
  -- Status
  order_status ENUM
('pending', 'confirmed', 'picking', 'packed', 'dispatched', 'delivered', 'cancelled') DEFAULT 'pending',
  payment_status ENUM
('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
  
  -- Delivery
  delivery_address VARCHAR
(500),
  delivery_contact_name VARCHAR
(255),
  delivery_contact_phone VARCHAR
(20),
  
  -- Special Instructions
  special_instructions TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_customer
(customer_id),
  INDEX idx_rdc
(assigned_rdc_id),
  INDEX idx_status
(order_status),
  INDEX idx_order_date
(order_date)
);
```

### 6. Order Items
```sql
CREATE TABLE order_items (
  order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(product_id),
  
  -- Quantities
  quantity_ordered INT NOT NULL,
  quantity_allocated INT DEFAULT 0,
  quantity_picked INT DEFAULT 0,
  quantity_packed INT DEFAULT 0,
  quantity_shipped INT DEFAULT 0,
  
  -- Pricing
  unit_price DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(12, 2),
  
  -- Status
  item_status ENUM('pending', 'allocated', 'picking', 'packed', 'shipped') DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_order
(order_id),
  INDEX idx_product
(product_id)
);
```

### 7. Deliveries
```sql
CREATE TABLE deliveries
(
    delivery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(order_id),

    -- Routing
    rdc_id UUID NOT NULL REFERENCES rdcs(rdc_id),
    vehicle_id UUID REFERENCES vehicles(vehicle_id),
    driver_id UUID REFERENCES users(user_id),

    -- Schedule
    scheduled_date DATE,
    scheduled_start_time TIME,
    scheduled_end_time TIME,

    -- Actual
    actual_start_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,

    -- Location
    delivery_latitude DECIMAL(10, 8),
    delivery_longitude DECIMAL(10, 8),
    gps_route GEOMETRY(LineString,
    4326), -- GPS track
  
  -- Status
  delivery_status ENUM
    ('pending', 'in_transit', 'at_location', 'delivered', 'failed', 'returned') DEFAULT 'pending',
  
  -- Proof of Delivery
  signature_image_url TEXT,
  delivery_photo_url TEXT,
  customer_signature_required BOOLEAN DEFAULT TRUE,
  customer_name_received VARCHAR
    (255),
  delivery_notes TEXT,
  
  -- Returns
  items_returned BOOLEAN DEFAULT FALSE,
  return_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_order
    (order_id),
  INDEX idx_driver
    (driver_id),
  INDEX idx_status
    (delivery_status),
  INDEX idx_scheduled_date
    (scheduled_date)
);
```

### 8. Invoices
```sql
    CREATE TABLE invoices (
  invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(order_id),
  
  -- Customer
  customer_id UUID NOT NULL REFERENCES users(user_id),
  invoice_address TEXT,
  
  -- Dates
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Amounts
  subtotal DECIMAL(12, 2),
  tax DECIMAL(12, 2),
  shipping DECIMAL(12, 2),
  total_amount DECIMAL(12, 2),
  
  -- Payment
  payment_status ENUM('unpaid', 'partial', 'paid', 'overdue', 'cancelled') DEFAULT 'unpaid',
  payment_date TIMESTAMP,
  payment_method ENUM
    ('cash', 'cheque', 'bank_transfer', 'credit_card', 'digital_wallet'),
  payment_reference VARCHAR
    (255),
  
  -- Delivery
  delivery_date TIMESTAMP,
  delivery_id UUID REFERENCES deliveries
    (delivery_id),
  
  -- Document
  invoice_pdf_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_customer
    (customer_id),
  INDEX idx_order
    (order_id),
  INDEX idx_payment_status
    (payment_status),
  INDEX idx_due_date
    (due_date)
);
```

### 9. Stock Transfers
```sql
    CREATE TABLE stock_transfers (
  transfer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- RDCs
  from_rdc_id UUID NOT NULL REFERENCES rdcs(rdc_id),
  to_rdc_id UUID NOT NULL REFERENCES rdcs(rdc_id),
  
  -- Product
  product_id UUID NOT NULL REFERENCES products(product_id),
  quantity INT NOT NULL,
  
  -- Status
  transfer_status ENUM('pending', 'approved', 'shipped', 'received', 'cancelled') DEFAULT 'pending',
  
  -- Approvals
  requested_by UUID REFERENCES users
    (user_id),
  approved_by UUID REFERENCES users
    (user_id),
  approved_at TIMESTAMP,
  
  -- Shipping
  shipped_date TIMESTAMP,
  received_date TIMESTAMP,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_from_rdc
    (from_rdc_id),
  INDEX idx_to_rdc
    (to_rdc_id),
  INDEX idx_product
    (product_id),
  INDEX idx_status
    (transfer_status)
);
```

### 10. Vehicles
```sql
    CREATE TABLE vehicles (
  vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_plate VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type ENUM('van', 'truck', 'motorcycle') DEFAULT 'van',
  capacity_units INT,
  capacity_weight_kg INT,
  
  -- Assignment
  assigned_rdc_id UUID REFERENCES rdcs
    (rdc_id),
  
  -- GPS
  gps_device_id VARCHAR
    (100),
  
  -- Status
  status ENUM
    ('active', 'maintenance', 'inactive') DEFAULT 'active',
  
  -- Metadata
  purchase_date DATE,
  last_maintenance DATE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_assigned_rdc
    (assigned_rdc_id)
);
```

### 11. Suppliers
```sql
    CREATE TABLE suppliers (
  supplier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  
  -- Address
  street_address VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(100),
  country VARCHAR(100),
  
  -- Terms
  payment_terms VARCHAR(50),
  lead_time_days INT,
  minimum_order_qty INT,
  
  -- Status
  status ENUM('active', 'inactive') DEFAULT 'active',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_supplier_name
    (supplier_name)
);
```

### 12. Audit Log
```sql
    CREATE TABLE audit_logs
    (
        log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id),
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100),
        entity_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        INDEX idx_user (user_id),
        INDEX idx_created_at (created_at),
        INDEX idx_entity (entity_type, entity_id)
    );
    ```

### 13. Notifications
```sql
    CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  
  -- Content
  title VARCHAR(255),
  message TEXT,
  notification_type ENUM('order', 'delivery', 'invoice', 'stock', 'system') DEFAULT 'system',
  
  -- Reference
  related_order_id UUID REFERENCES orders
    (order_id),
  related_delivery_id UUID REFERENCES deliveries
    (delivery_id),
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Channel
  send_email BOOLEAN DEFAULT TRUE,
  send_sms BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user
    (user_id),
  INDEX idx_is_read
    (is_read)
);
```

---

## Indexes Summary

```sql
    -- Performance Indexes
    CREATE INDEX idx_inventory_availability ON inventory(rdc_id, product_id, quantity_available);
    CREATE INDEX idx_orders_customer_status ON orders(customer_id, order_status);
    CREATE INDEX idx_orders_rdc_status ON orders(assigned_rdc_id, order_status);
    CREATE INDEX idx_deliveries_driver_date ON deliveries(driver_id, scheduled_date);
    CREATE INDEX idx_order_items_order ON order_items(order_id, item_status);
    CREATE INDEX idx_invoices_customer ON invoices(customer_id, payment_status);

    -- Search Indexes (for PostgreSQL Full Text Search)
    CREATE INDEX idx_products_search ON products USING GIN
    (to_tsvector
    ('english', product_name || ' ' || description));

    -- Geo Indexes (for distance queries)
    CREATE INDEX idx_deliveries_location ON deliveries USING GIST
    (gps_route);
```

---

## Key Relationships

```
Users
├── RDCs
    (assigned_rdc_id)
├── Orders
    (customer_id)
├── Deliveries
    (driver_id)
└── Audit Logs
    (user_id)

RDCs
├── Inventory
    (rdc_id)
├── Orders
    (assigned_rdc_id)
├── Stock Transfers
    (from_rdc_id, to_rdc_id)
└── Vehicles
    (assigned_rdc_id)

Products
├── Inventory
    (product_id) - many RDCs
├── Order Items
    (product_id)
└── Stock Transfers
    (product_id)

Orders
├── Order Items
    (order_id)
├── Invoices
    (order_id)
├── Deliveries
    (order_id)
└── Notifications
    (related_order_id)

Deliveries
├── Invoices
    (delivery_id)
└── Notifications
    (related_delivery_id)
```

---

## Migration Strategy

1. **Phase 1**:
    Create all tables
2. **Phase 2**:
    Add indexes
3. **Phase 3**: Populate reference data
    (RDCs, suppliers, sample products)
4. **Phase 4**:
    Set up triggers
    for audit logging
5. **Phase 5**: Configure real-time inventory sync
6. **Phase 6**: Performance testing & optimization

---

## Notes

- All IDs
    use UUID
    for distributed system scalability
- Timestamps
    use TIMESTAMP
    for timezone-aware operations
- JSONB for audit logs allows flexible data capture
- Enum types for fixed status values
    (more efficient than strings)
- Geometry types for GPS tracking
    (requires PostGIS extension)
- Indexes optimized for common queries
- Soft deletes can be added via `deleted_at` timestamp
    if needed
