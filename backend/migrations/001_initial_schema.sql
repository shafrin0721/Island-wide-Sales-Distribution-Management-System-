-- =====================================================
-- RDC MANAGEMENT SYSTEM - INITIAL DATABASE SCHEMA
-- SQL Server (T-SQL) Version
-- Created: 2024
-- =====================================================

-- =====================================================
-- USERS TABLE (Authentication & Role Management)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'users')
BEGIN
    CREATE TABLE users
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) NOT NULL DEFAULT 'customer',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        profile_image_url VARCHAR(500),
        bio TEXT,
        address VARCHAR(500),
        city VARCHAR(100),
        country VARCHAR(100),
        postal_code VARCHAR(20),
        preferred_language VARCHAR(10) DEFAULT 'en',
        two_factor_enabled BIT DEFAULT 0,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME
    );
END;

-- =====================================================
-- PRODUCTS TABLE (Catalog Management)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'products')
BEGIN
    CREATE TABLE products
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        sub_category VARCHAR(100),
        price DECIMAL(10, 2) NOT NULL,
        cost_price DECIMAL(10, 2),
        sku VARCHAR(100) UNIQUE NOT NULL,
        barcode VARCHAR(100),
        stock_level INT NOT NULL DEFAULT 0,
        reorder_level INT DEFAULT 10,
        supplier_id INT,
        image_url VARCHAR(500),
        rating DECIMAL(3, 2) DEFAULT 0,
        rating_count INT DEFAULT 0,
        is_featured BIT DEFAULT 0,
        is_active BIT DEFAULT 1,
        weight_kg DECIMAL(8, 2),
        dimensions VARCHAR(100),
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END;

-- =====================================================
-- CATEGORIES TABLE (Product Organization)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'categories')
BEGIN
    CREATE TABLE categories
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        parent_id INT,
        image_url VARCHAR(500),
        display_order INT,
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id)
    );
END;

-- =====================================================
-- SUPPLIERS TABLE (Supplier Management)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'suppliers')
BEGIN
    CREATE TABLE suppliers
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(20),
        address VARCHAR(500),
        city VARCHAR(100),
        country VARCHAR(100),
        rating DECIMAL(3, 2),
        terms_of_payment VARCHAR(100),
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
END;

-- =====================================================
-- INVENTORY TABLE (Multi-RDC Stock Management)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'inventory')
BEGIN
    CREATE TABLE inventory
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        product_id INT NOT NULL,
        rdc_location VARCHAR(100) NOT NULL,
        stock_level INT NOT NULL DEFAULT 0,
        reserved_quantity INT DEFAULT 0,
        available_quantity INT DEFAULT 0,
        reorder_level INT DEFAULT 10,
        last_restock_date DATETIME,
        last_inventory_count DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        UNIQUE(product_id, rdc_location)
    );
END;

-- =====================================================
-- INVENTORY MOVEMENTS TABLE (Audit Trail)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'inventory_movements')
BEGIN
    CREATE TABLE inventory_movements
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        product_id INT NOT NULL,
        rdc_from VARCHAR(100),
        rdc_to VARCHAR(100),
        quantity INT NOT NULL,
        movement_type VARCHAR(50) NOT NULL,
        reference_id INT,
        reference_type VARCHAR(50),
        notes TEXT,
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END;

-- =====================================================
-- ORDERS TABLE (Order Management)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'orders')
BEGIN
    CREATE TABLE orders
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INT NOT NULL,
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        scheduled_delivery_date DATE,
        delivery_address TEXT,
        delivery_city VARCHAR(100),
        delivery_country VARCHAR(100),
        delivery_postal_code VARCHAR(20),
        subtotal DECIMAL(10, 2) NOT NULL,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        shipping_cost DECIMAL(10, 2) DEFAULT 0,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        payment_method VARCHAR(50),
        payment_date DATETIME,
        notes TEXT,
        special_instructions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id)
    );
END;

-- =====================================================
-- ORDER ITEMS TABLE (Individual Order Line Items)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'order_items')
BEGIN
    CREATE TABLE order_items
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        line_total DECIMAL(10, 2) NOT NULL,
        fulfillment_status VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    );
END;

-- =====================================================
-- PAYMENTS TABLE (Payment Transactions)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'payments')
BEGIN
    CREATE TABLE payments
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        transaction_id VARCHAR(255),
        stripe_charge_id VARCHAR(255),
        stripe_payment_intent_id VARCHAR(255),
        reference_number VARCHAR(100),
        notes TEXT,
        processed_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (processed_by) REFERENCES users(id)
    );
END;

-- =====================================================
-- DELIVERIES TABLE (Real-time Delivery Tracking)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'deliveries')
BEGIN
    CREATE TABLE deliveries
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        delivery_number VARCHAR(50) UNIQUE NOT NULL,
        driver_id INT,
        vehicle_registration VARCHAR(50),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        pickup_location VARCHAR(255),
        delivery_location VARCHAR(255),
        scheduled_delivery_time DATETIME,
        actual_pickup_time DATETIME,
        actual_delivery_time DATETIME,
        gps_latitude DECIMAL(10, 8),
        gps_longitude DECIMAL(11, 8),
        current_route_stage VARCHAR(100),
        estimated_delivery_time DATETIME,
        temperature_reading DECIMAL(5, 2),
        signature_image_url VARCHAR(500),
        delivery_proof_url VARCHAR(500),
        notes TEXT,
        failure_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (driver_id) REFERENCES users(id)
    );
END;

-- =====================================================
-- DELIVERY TRACKING HISTORY (Real-time GPS Updates)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'delivery_tracking_history')
BEGIN
    CREATE TABLE delivery_tracking_history
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        delivery_id INT NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        accuracy DECIMAL(6, 2),
        speed DECIMAL(6, 2),
        heading DECIMAL(6, 2),
        altitude DECIMAL(8, 2),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
    );
END;

-- =====================================================
-- NOTIFICATIONS TABLE (Email/SMS Notification Log)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'notifications')
BEGIN
    CREATE TABLE notifications
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        channel VARCHAR(50) NOT NULL,
        recipient_email VARCHAR(255),
        recipient_phone VARCHAR(20),
        subject VARCHAR(255),
        message TEXT,
        data NVARCHAR(MAX),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        sent_at DATETIME,
        read_at DATETIME,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
END;

-- =====================================================
-- ANALYTICS TABLE (Sales & Performance Metrics)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'analytics')
BEGIN
    CREATE TABLE analytics
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        metric_type VARCHAR(100) NOT NULL,
        metric_name VARCHAR(255) NOT NULL,
        value DECIMAL(15, 2),
        period_date DATE,
        rdc_location VARCHAR(100),
        category VARCHAR(100),
        metadata NVARCHAR(MAX),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
END;

-- =====================================================
-- RECOMMENDATIONS TABLE (ML-Based Recommendations)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'recommendations')
BEGIN
    CREATE TABLE recommendations
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        score DECIMAL(5, 4),
        reason VARCHAR(255),
        recommendation_type VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    );
END;

-- =====================================================
-- USER PREFERENCES TABLE (Personalization)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'user_preferences')
BEGIN
    CREATE TABLE user_preferences
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        preferred_language VARCHAR(10) DEFAULT 'en',
        notification_email_enabled BIT DEFAULT 1,
        notification_sms_enabled BIT DEFAULT 1,
        dark_mode_enabled BIT DEFAULT 0,
        marketing_communications BIT DEFAULT 1,
        newsletter_subscribed BIT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
END;

-- =====================================================
-- AUDIT LOG TABLE (System Audit Trail)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'audit_logs')
BEGIN
    CREATE TABLE audit_logs
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT,
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(100),
        record_id INT,
        old_values NVARCHAR(MAX),
        new_values NVARCHAR(MAX),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
END;

-- =====================================================
-- SESSIONS TABLE (User Sessions)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'sessions')
BEGIN
    CREATE TABLE sessions
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(500) UNIQUE NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at DATETIME,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
END;

-- =====================================================
-- INDEXES (Performance Optimization)
-- =====================================================
IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_users_email')
    CREATE INDEX idx_users_email ON users(email);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_users_role')
    CREATE INDEX idx_users_role ON users(role);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_users_created_at')
    CREATE INDEX idx_users_created_at ON users(created_at);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_products_category')
    CREATE INDEX idx_products_category ON products(category);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_products_sku')
    CREATE INDEX idx_products_sku ON products(sku);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_orders_customer_id')
    CREATE INDEX idx_orders_customer_id ON orders(customer_id);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_orders_status')
    CREATE INDEX idx_orders_status ON orders(status);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_orders_created_at')
    CREATE INDEX idx_orders_created_at ON orders(created_at);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_order_items_order_id')
    CREATE INDEX idx_order_items_order_id ON order_items(order_id);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_inventory_product_id')
    CREATE INDEX idx_inventory_product_id ON inventory(product_id);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_inventory_rdc_location')
    CREATE INDEX idx_inventory_rdc_location ON inventory(rdc_location);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_deliveries_order_id')
    CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_deliveries_status')
    CREATE INDEX idx_deliveries_status ON deliveries(status);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_deliveries_driver_id')
    CREATE INDEX idx_deliveries_driver_id ON deliveries(driver_id);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_notifications_user_id')
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_notifications_created_at')
    CREATE INDEX idx_notifications_created_at ON notifications(created_at);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_audit_logs_user_id')
    CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_audit_logs_created_at')
    CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_sessions_user_id')
    CREATE INDEX idx_sessions_user_id ON sessions(user_id);

IF NOT EXISTS (SELECT *
FROM sys.indexes
WHERE name = 'idx_sessions_token')
    CREATE INDEX idx_sessions_token ON sessions(token);

-- =====================================================
-- END OF SCHEMA
-- =====================================================
