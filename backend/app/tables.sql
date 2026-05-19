-- ==========================================
-- 1. USERS (UNCHANGED - REMOVED EXTRA FIELDS)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role ENUM('admin', 'customer', 'technician') NOT NULL DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. CATEGORIES & SERVICES (UNCHANGED)
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
    base_price DECIMAL(10,2),
    duration_minutes INT DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- ==========================================
-- 3. PACKAGES (NEW)
-- ==========================================
CREATE TABLE IF NOT EXISTS packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- 3B. SERVICE PACKAGES (ADMIN COMPAT)
-- ==========================================
CREATE TABLE IF NOT EXISTS service_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_package_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_package_id INT NOT NULL,
    service_id INT NOT NULL,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_service_package_item (service_package_id, service_id),
    FOREIGN KEY (service_package_id) REFERENCES service_packages(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- ==========================================
-- 3C. TECHNICIAN PROFILES (ADMIN COMPAT)
-- ==========================================
CREATE TABLE IF NOT EXISTS technician_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    technician_id INT NOT NULL UNIQUE,
    availability_status ENUM('available', 'busy', 'offline') DEFAULT 'available',
    skills TEXT,
    rating DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 3D. PAYMENTS (ADMIN COMPAT)
-- ==========================================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(120),
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_payments_booking_id (booking_id)
);

-- ==========================================
-- 4. PACKAGE CHECKLIST (TEMPLATE)
-- ==========================================
CREATE TABLE IF NOT EXISTS package_checklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    task_name VARCHAR(255),
    order_index INT,
    UNIQUE KEY unique_package_task (package_id, task_name),
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
);

-- ==========================================
-- 5. BOOKINGS (MINIMAL CHANGE)
-- ==========================================
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    service_id INT NOT NULL,  -- KEEP (team dependency)
    package_id INT NOT NULL,  -- ADDED
    technician_id INT,

    status ENUM(
        'submitted',
        'approved',
        'assigned',
        'on_the_way',
        'arrival_approval_pending',
        'in_progress',
        'customer_review_pending',
        'admin_review_pending',
        'completed',
        'rejection_requested',
        'rejected'
    ) DEFAULT 'submitted',

    final_price DECIMAL(10,2),

    scheduled_date DATE NOT NULL,
    scheduled_time_slot ENUM('09:00 AM','11:00 AM','01:00 PM','03:00 PM','05:00 PM') NOT NULL,

    address_line TEXT NOT NULL,
    building_name VARCHAR(100),
    floor_number VARCHAR(20),
    apartment_number VARCHAR(20),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),

    customer_notes TEXT,
    preferred_technician VARCHAR(120),
    parking_instructions TEXT,
    pet_warning TEXT,
    call_before_arrival BOOLEAN DEFAULT FALSE,
    technician_notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (technician_id) REFERENCES users(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (package_id) REFERENCES packages(id)
);

-- ==========================================
-- 6. BOOKING CHECKLIST (ACTUAL TASKS)
-- ==========================================
CREATE TABLE IF NOT EXISTS booking_checklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    task_name VARCHAR(255),
    order_index INT,
    is_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- ==========================================
-- 7. TECHNICIAN LOCATION (KEEP EXISTING STYLE)
-- ==========================================
CREATE TABLE IF NOT EXISTS technician_live_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    technician_id INT NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    accuracy FLOAT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 8. BOOKING REQUESTS (ADMIN-HANDLED WORKFLOW)
-- ==========================================
CREATE TABLE IF NOT EXISTS booking_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    requested_by INT NOT NULL,
    reviewed_by INT,
    request_type ENUM('completion','rejection','escalation','feedback','cancellation') NOT NULL,
    status ENUM('pending','approved','rejected','resolved') DEFAULT 'pending',
    message TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================
-- 9. NOTIFICATIONS (UNCHANGED)
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(120),
    notification_type VARCHAR(50),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 10. PACKAGES DATA
-- ==========================================
INSERT INTO packages (name, price, description) VALUES
('Silver', 999.00, 'Basic cleaning'),
('Gold', 1999.00, 'Deep cleaning'),
('Platinum', 2999.00, 'Premium cleaning')
ON DUPLICATE KEY UPDATE
description = VALUES(description),
price = VALUES(price),
is_active = TRUE;

-- ==========================================
-- 11. CHECKLIST DATA
-- ==========================================
INSERT IGNORE INTO package_checklist (package_id, task_name, order_index) VALUES
(1, 'Dust furniture, shelves, and accessible surfaces', 1),
(1, 'Sweep and mop floors', 2),
(1, 'Clean kitchen countertop and sink', 3),
(1, 'Wipe cabinet exteriors', 4),
(1, 'Clean bathroom wash basin, mirror, and toilet', 5),
(1, 'Collect and dispose garbage', 6),
(1, 'Dust internal window sills and frames', 7),
(1, 'Clean door handles', 8),
(1, 'Sweep and mop balcony', 9),

(2, 'Dust furniture, shelves, and accessible surfaces', 1),
(2, 'Sweep and mop floors', 2),
(2, 'Clean kitchen countertop and sink', 3),
(2, 'Wipe cabinet exteriors', 4),
(2, 'Clean bathroom wash basin, mirror, and toilet', 5),
(2, 'Collect and dispose garbage', 6),
(2, 'Dust internal window sills and frames', 7),
(2, 'Clean door handles', 8),
(2, 'Sweep and mop balcony', 9),
(2, 'Deep clean kitchen cabinets inside and outside', 10),
(2, 'Degrease and clean kitchen wall tiles', 11),
(2, 'Clean exterior of microwave, fridge, and stove', 12),
(2, 'Deep clean bathroom tiles and shower area', 13),
(2, 'Polish glass and mirrors', 14),
(2, 'Vacuum sofas and cushions', 15),
(2, 'Detailed dusting of doors, frames, and wardrobe exteriors', 16),
(2, 'Clean interior-side window glass', 17),
(2, 'Deep clean and mop floors', 18),

(3, 'Dust furniture, shelves, and accessible surfaces', 1),
(3, 'Sweep and mop floors', 2),
(3, 'Clean kitchen countertop and sink', 3),
(3, 'Wipe cabinet exteriors', 4),
(3, 'Clean bathroom wash basin, mirror, and toilet', 5),
(3, 'Collect and dispose garbage', 6),
(3, 'Dust internal window sills and frames', 7),
(3, 'Clean door handles', 8),
(3, 'Sweep and mop balcony', 9),
(3, 'Deep clean kitchen cabinets inside and outside', 10),
(3, 'Degrease and clean kitchen wall tiles', 11),
(3, 'Clean exterior of microwave, fridge, and stove', 12),
(3, 'Deep clean bathroom tiles and shower area', 13),
(3, 'Polish glass and mirrors', 14),
(3, 'Vacuum sofas and cushions', 15),
(3, 'Detailed dusting of doors, frames, and wardrobe exteriors', 16),
(3, 'Clean interior-side window glass', 17),
(3, 'Deep clean and mop floors', 18),
(3, 'Steam sanitize bathrooms and kitchen areas', 19),
(3, 'Deep vacuum carpets and sofas', 20),
(3, 'Vacuum clean mattress', 21),
(3, 'Clean behind accessible furniture', 22),
(3, 'Clean AC vents', 23),
(3, 'Interior window glass streak-free finish', 24),
(3, 'Wall spot cleaning for light stains', 25),
(3, 'Detailed wardrobe internal cleaning', 26),
(3, 'Interior fridge cleaning', 27),
(3, 'Premium floor polishing and shine restoration', 28),
(3, 'Pressure clean balcony where applicable', 29);
