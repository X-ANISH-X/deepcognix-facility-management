import mysql.connector
from app.core.config import settings


def _column_exists(cursor, table_name: str, column_name: str) -> bool:
    cursor.execute(
        """
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = %s
          AND TABLE_NAME = %s
          AND COLUMN_NAME = %s
        """,
        (settings.DB_NAME, table_name, column_name),
    )
    return cursor.fetchone() is not None


def _index_exists(cursor, table_name: str, index_name: str) -> bool:
    cursor.execute(
        """
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = %s
          AND TABLE_NAME = %s
          AND INDEX_NAME = %s
        """,
        (settings.DB_NAME, table_name, index_name),
    )
    return cursor.fetchone() is not None


def _table_exists(cursor, table_name: str) -> bool:
    cursor.execute(
        """
        SELECT 1
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = %s
          AND TABLE_NAME = %s
        """,
        (settings.DB_NAME, table_name),
    )
    return cursor.fetchone() is not None


def _run_safe_alter(cursor, statement: str):
    try:
        cursor.execute(statement)
    except mysql.connector.Error:
        pass


def _cleanup_duplicate_checklist_rows(cursor):
    cursor.execute(
        """
        DELETE pc1
        FROM package_checklist pc1
        JOIN package_checklist pc2
          ON pc1.package_id = pc2.package_id
         AND pc1.task_name = pc2.task_name
         AND pc1.id > pc2.id
        """
    )

    cursor.execute(
        """
        DELETE bc1
        FROM booking_checklist bc1
        JOIN booking_checklist bc2
          ON bc1.booking_id = bc2.booking_id
         AND bc1.task_name = bc2.task_name
         AND bc1.id > bc2.id
        """
    )


def _cleanup_duplicate_packages(cursor):
    cursor.execute(
        """
        SELECT name, MIN(id) AS keep_id
        FROM packages
        GROUP BY name
        HAVING COUNT(*) > 1
        """
    )
    duplicate_groups = cursor.fetchall()

    for package_name, keep_id in duplicate_groups:
        cursor.execute(
            "SELECT id FROM packages WHERE name = %s AND id <> %s",
            (package_name, keep_id),
        )
        duplicate_ids = [row[0] for row in cursor.fetchall()]

        for duplicate_id in duplicate_ids:
            cursor.execute(
                """
                INSERT IGNORE INTO package_checklist (package_id, task_name, order_index)
                SELECT %s, task_name, order_index
                FROM package_checklist
                WHERE package_id = %s
                """,
                (keep_id, duplicate_id),
            )
            cursor.execute("DELETE FROM package_checklist WHERE package_id = %s", (duplicate_id,))
            cursor.execute("UPDATE bookings SET package_id = %s WHERE package_id = %s", (keep_id, duplicate_id))

            if _table_exists(cursor, "service_package_meta"):
                cursor.execute("SELECT COUNT(*) FROM service_package_meta WHERE package_id = %s", (keep_id,))
                keep_has_meta = cursor.fetchone()[0] > 0
                if keep_has_meta:
                    cursor.execute("DELETE FROM service_package_meta WHERE package_id = %s", (duplicate_id,))
                else:
                    cursor.execute(
                        "UPDATE service_package_meta SET package_id = %s WHERE package_id = %s",
                        (keep_id, duplicate_id),
                    )

            cursor.execute("DELETE FROM packages WHERE id = %s", (duplicate_id,))


def _cleanup_duplicate_services(cursor):
    cursor.execute(
        """
        SELECT name, MIN(id) AS keep_id
        FROM services
        GROUP BY name
        HAVING COUNT(*) > 1
        """
    )
    duplicate_groups = cursor.fetchall()

    for service_name, keep_id in duplicate_groups:
        cursor.execute(
            "SELECT id FROM services WHERE name = %s AND id <> %s",
            (service_name, keep_id),
        )
        duplicate_ids = [row[0] for row in cursor.fetchall()]

        for duplicate_id in duplicate_ids:
            cursor.execute("UPDATE bookings SET service_id = %s WHERE service_id = %s", (keep_id, duplicate_id))

            if _table_exists(cursor, "service_package_items"):
                cursor.execute(
                    """
                    INSERT IGNORE INTO service_package_items (service_package_id, service_id, quantity)
                    SELECT service_package_id, %s, quantity
                    FROM service_package_items
                    WHERE service_id = %s
                    """,
                    (keep_id, duplicate_id),
                )
                cursor.execute("DELETE FROM service_package_items WHERE service_id = %s", (duplicate_id,))

            cursor.execute("DELETE FROM services WHERE id = %s", (duplicate_id,))


def _ensure_booking_status_values(cursor):
    # First expand the ENUM to include any intermediate values that might exist in the data
    _run_safe_alter(
        cursor,
        """
        ALTER TABLE bookings
        MODIFY status ENUM(
            'submitted',
            'approved',
            'assigned',
            'in_progress',
            'customer_review_pending',
            'admin_review_pending',
            'completed',
            'rejection_requested',
            'rejected',
            'cancelled',
            'completion_requested'
        ) DEFAULT 'submitted'
        """,
    )
    # Now that the ENUM is expanded, we can safely update the obsolete statuses
    cursor.execute("UPDATE bookings SET status = 'submitted' WHERE status = 'cancelled'")
    cursor.execute("UPDATE bookings SET status = 'admin_review_pending' WHERE status = 'completion_requested'")
    # Finally, contract the ENUM back to the canonical values
    _run_safe_alter(
        cursor,
        """
        ALTER TABLE bookings
        MODIFY status ENUM(
            'submitted',
            'approved',
            'assigned',
            'in_progress',
            'customer_review_pending',
            'admin_review_pending',
            'completed',
            'rejection_requested',
            'rejected'
        ) DEFAULT 'submitted'
        """,
    )


def _ensure_booking_time_slot_values(cursor):
    cursor.execute("ALTER TABLE bookings MODIFY scheduled_time_slot VARCHAR(20) NOT NULL")
    cursor.execute(
        """
        UPDATE bookings
        SET scheduled_time_slot = CASE scheduled_time_slot
            WHEN 'morning' THEN '09:00 AM'
            WHEN 'afternoon' THEN '01:00 PM'
            WHEN 'evening' THEN '05:00 PM'
            ELSE scheduled_time_slot
        END
        """
    )
    cursor.execute(
        """
        UPDATE bookings
        SET scheduled_time_slot = '09:00 AM'
        WHERE scheduled_time_slot NOT IN (
            '09:00 AM',
            '11:00 AM',
            '01:00 PM',
            '03:00 PM',
            '05:00 PM'
        )
        """
    )
    cursor.execute(
        """
        ALTER TABLE bookings
        MODIFY scheduled_time_slot ENUM(
            '09:00 AM',
            '11:00 AM',
            '01:00 PM',
            '03:00 PM',
            '05:00 PM'
        ) NOT NULL
        """,
    )


def ensure_schema_updates(cursor):
    if not _column_exists(cursor, "users", "updated_at"):
        _run_safe_alter(
            cursor,
            "ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
        )

    if not _column_exists(cursor, "services", "updated_at"):
        _run_safe_alter(
            cursor,
            "ALTER TABLE services ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
        )

    if not _column_exists(cursor, "packages", "updated_at"):
        _run_safe_alter(
            cursor,
            "ALTER TABLE packages ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
        )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS service_packages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """
    )

    cursor.execute(
        """
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
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS technician_profiles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            technician_id INT NOT NULL UNIQUE,
            availability_status ENUM('available', 'busy', 'offline') DEFAULT 'available',
            skills TEXT,
            rating DECIMAL(3,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """
    )

    cursor.execute(
        """
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
        )
        """
    )

    if not _column_exists(cursor, "booking_checklist", "order_index"):
        _run_safe_alter(cursor, "ALTER TABLE booking_checklist ADD COLUMN order_index INT")

    if not _column_exists(cursor, "notifications", "title"):
        _run_safe_alter(cursor, "ALTER TABLE notifications ADD COLUMN title VARCHAR(120) NULL AFTER user_id")

    if not _column_exists(cursor, "notifications", "notification_type"):
        _run_safe_alter(
            cursor,
            "ALTER TABLE notifications ADD COLUMN notification_type VARCHAR(50) NULL AFTER title",
        )

    if not _column_exists(cursor, "bookings", "preferred_technician"):
        _run_safe_alter(
            cursor,
            "ALTER TABLE bookings ADD COLUMN preferred_technician VARCHAR(120) NULL AFTER customer_notes",
        )

    if not _column_exists(cursor, "bookings", "parking_instructions"):
        _run_safe_alter(
            cursor,
            "ALTER TABLE bookings ADD COLUMN parking_instructions TEXT NULL AFTER preferred_technician",
        )

    if not _column_exists(cursor, "bookings", "pet_warning"):
        _run_safe_alter(
            cursor,
            "ALTER TABLE bookings ADD COLUMN pet_warning TEXT NULL AFTER parking_instructions",
        )

    if not _column_exists(cursor, "bookings", "call_before_arrival"):
        _run_safe_alter(
            cursor,
            "ALTER TABLE bookings ADD COLUMN call_before_arrival BOOLEAN DEFAULT FALSE AFTER pet_warning",
        )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS booking_additional_services (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            service_id INT NOT NULL,
            service_name VARCHAR(100) NOT NULL,
            service_price DECIMAL(10,2) NOT NULL,
            is_included BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_booking_additional_service (booking_id, service_id),
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
        )
        """
    )

    if not _column_exists(cursor, "technician_live_locations", "booking_id"):
        _run_safe_alter(cursor, "ALTER TABLE technician_live_locations ADD COLUMN booking_id INT NULL")
        _run_safe_alter(
            cursor,
            """
            ALTER TABLE technician_live_locations
            ADD CONSTRAINT fk_technician_live_locations_booking
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
            """,
        )

    _ensure_booking_status_values(cursor)
    _ensure_booking_time_slot_values(cursor)
    _cleanup_duplicate_checklist_rows(cursor)
    _cleanup_duplicate_packages(cursor)
    _cleanup_duplicate_services(cursor)

    if not _index_exists(cursor, "packages", "unique_package_name"):
        _run_safe_alter(
            cursor,
            "ALTER TABLE packages ADD CONSTRAINT unique_package_name UNIQUE (name)",
        )

    if not _index_exists(cursor, "services", "unique_service_name"):
        _run_safe_alter(
            cursor,
            "ALTER TABLE services ADD CONSTRAINT unique_service_name UNIQUE (name)",
        )

    if not _index_exists(cursor, "package_checklist", "unique_package_task"):
        _run_safe_alter(
            cursor,
            "ALTER TABLE package_checklist ADD CONSTRAINT unique_package_task UNIQUE (package_id, task_name)",
        )

    if not _index_exists(cursor, "booking_checklist", "unique_booking_task"):
        _run_safe_alter(
            cursor,
            "ALTER TABLE booking_checklist ADD CONSTRAINT unique_booking_task UNIQUE (booking_id, task_name)",
        )


def init_db():
    print("🔄 Connecting to MySQL Server...")

    # Connect directly to the existing database.
    # The database was created during initial MySQL setup.
    # deepcognix user has all privileges on deepcognix_db but
    # does NOT have global CREATE DATABASE permission.
    conn = mysql.connector.connect(
        host=settings.DB_HOST,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
        port=settings.DB_PORT,
    )
    print(f"✅ Connected to database '{settings.DB_NAME}'.")
    cursor = conn.cursor(buffered=True)
    
    # 4. Read and Execute tables.sql
    with open("app/tables.sql", "r") as f:
        sql_script = f.read()
    
    commands = sql_script.split(';')
    schema_commands: list[str] = []
    data_commands: list[str] = []

    for command in commands:
        statement = command.strip()
        if not statement:
            continue

        upper_statement = statement.upper()
        if upper_statement.startswith("INSERT INTO ") or upper_statement.startswith("INSERT IGNORE INTO "):
            data_commands.append(statement)
        else:
            schema_commands.append(statement)

    for statement in schema_commands:
        cursor.execute(statement)

    ensure_schema_updates(cursor)

    for statement in data_commands:
        cursor.execute(statement)

    conn.commit()

    # =============================================
    # Seed initial reference data to avoid FK errors
    # =============================================
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    if user_count == 0:
        cursor.execute(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            ("Default Customer", "customer@example.com", "password123", "customer")
        )
        print("✅ Default customer inserted")

    cursor.execute("SELECT COUNT(*) FROM categories")
    category_count = cursor.fetchone()[0]
    if category_count == 0:
        cursor.execute(
            "INSERT INTO categories (name, icon_url) VALUES (%s, %s)",
            ("General", "https://example.com/icon.png")
        )
        category_id = cursor.lastrowid
        print("✅ Default category inserted")
    else:
        cursor.execute("SELECT id FROM categories LIMIT 1")
        category_id = cursor.fetchone()[0]

    # Ensure explicit seed IDs are present so client payloads using hardcoded IDs always work
    for explicit_id, name, description, base_price, duration in [
        (1, "Standard Cleaning", "Default service", 50.00, 60),
        (2, "Deep Cleaning", "Deep clean service", 90.00, 120),
        (3, "Window Cleaning", "Window cleaning service", 40.00, 45)
    ]:
        cursor.execute("SELECT id FROM services WHERE id = %s", (explicit_id,))
        if cursor.fetchone() is None:
            cursor.execute(
                "INSERT INTO services (id, category_id, name, description, base_price, duration_minutes) VALUES (%s, %s, %s, %s, %s, %s)",
                (explicit_id, category_id, name, description, base_price, duration)
            )
            print(f"✅ Seeded service id {explicit_id}: {name}")
    
    conn.commit()
    print("✅ Tables initialized successfully!")
    conn.close()

if __name__ == "__main__":
    init_db()
