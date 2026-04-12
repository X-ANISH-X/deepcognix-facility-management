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


def _ensure_booking_status_values(cursor):
    _run_safe_alter(
        cursor,
        """
        ALTER TABLE bookings
        MODIFY status ENUM(
            'submitted',
            'approved',
            'assigned',
            'in_progress',
            'completed',
            'cancelled',
            'rejection_requested',
            'rejected'
        ) DEFAULT 'submitted'
        """,
    )


def ensure_schema_updates(cursor):
    if not _column_exists(cursor, "booking_checklist", "order_index"):
        _run_safe_alter(cursor, "ALTER TABLE booking_checklist ADD COLUMN order_index INT")

    if not _column_exists(cursor, "notifications", "title"):
        _run_safe_alter(cursor, "ALTER TABLE notifications ADD COLUMN title VARCHAR(120) NULL AFTER user_id")

    if not _column_exists(cursor, "notifications", "notification_type"):
        _run_safe_alter(
            cursor,
            "ALTER TABLE notifications ADD COLUMN notification_type VARCHAR(50) NULL AFTER title",
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
    _cleanup_duplicate_checklist_rows(cursor)

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
    
    # 1. Connect to MySQL Server (No DB selected yet)
    conn = mysql.connector.connect(
        host=settings.DB_HOST,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD
    )
    cursor = conn.cursor(buffered=True)
    
    # 2. Create Database
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {settings.DB_NAME}")
    print(f"✅ Database '{settings.DB_NAME}' checked/created.")
    
    conn.close()
    
    # 3. Connect to the specific Database
    conn = mysql.connector.connect(
        host=settings.DB_HOST,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME
    )
    cursor = conn.cursor(buffered=True)
    
    # 4. Read and Execute tables.sql
    with open("app/tables.sql", "r") as f:
        sql_script = f.read()
    
    commands = sql_script.split(';')
    for command in commands:
        if command.strip():
            cursor.execute(command)

    ensure_schema_updates(cursor)

    conn.commit()
    print("✅ Tables initialized successfully!")
    conn.close()

if __name__ == "__main__":
    init_db()
