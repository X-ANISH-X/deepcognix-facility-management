-- ==========================================
-- 1. USERS & AUTHENTICATION
-- Matches: User Step 1, Tech Step 1, Admin Step 1, 7, 8
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role ENUM('admin', 'customer', 'technician') NOT NULL DEFAULT 'customer',
    profile_picture_url VARCHAR(255), -- Matches Profile Management
    is_active BOOLEAN DEFAULT TRUE,   -- Matches Admin User Management (Block/Activate)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. SERVICE MANAGEMENT
-- Matches: User Step 3, Admin Step 3
-- ==========================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL, 
    icon_url VARCHAR(255), 
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL, -- The "Default Price" set by Admin
    duration_minutes INT DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- ==========================================
-- 3. BOOKINGS & ORDERS (CRITICAL UPDATES)
-- Matches: User Step 3, 4, 5 | Tech Step 2, 3, 4, 5, 6 | Admin Step 4, 5, 9
-- ==========================================
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    service_id INT NOT NULL,
    technician_id INT, -- Nullable initially (Admin assigns later)
    
    -- UPDATED STATUS FLOW to match your text:
    -- 'submitted'   -> User fills form (User Step 3)
    -- 'approved'    -> Admin approves & sets price (User Step 4)
    -- 'assigned'    -> Admin assigns tech, Tech sees "Ready" (Tech Step 4)
    -- 'in_progress' -> Tech starts job (Tech Step 4)
    -- 'completed'   -> Tech finishes job (Tech Step 4)
    status ENUM('submitted', 'approved', 'assigned', 'in_progress', 'completed', 'cancelled', 'rejected') DEFAULT 'submitted',
    
    -- PRICING LOGIC
    final_price DECIMAL(10, 2), -- Stores the specific price set by Admin in Step 4
    
    -- Schedule
    scheduled_date DATE NOT NULL,      -- Used for Tech Step 6 (Daily Filter)
    scheduled_time_slot TIME NOT NULL, 
    
    -- Location & Details
    address_line TEXT NOT NULL,
    building_name VARCHAR(100) NOT NULL, 
    floor_number VARCHAR(20) NOT NULL,
    apartment_number VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Notes
    customer_notes TEXT,        -- From User Request Form
    technician_notes TEXT,      -- Matches Tech Step 5 (Completion Notes)
    customer_signature_url VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (technician_id) REFERENCES users(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- ==========================================
-- 4. PAYMENTS
-- Matches: Admin Step 2 ("Completed jobs... once payment is received")
-- ==========================================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- ==========================================
-- 5. TECHNICIAN LIVE TRACKING
-- Matches: Admin Step 6 (Real-time tracking)
-- ==========================================
CREATE TABLE IF NOT EXISTS technician_locations (
    technician_id INT PRIMARY KEY,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 6. NOTIFICATIONS
-- Matches: User Step 6, Tech Step 7, Admin Step 10
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);