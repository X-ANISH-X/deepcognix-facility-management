import mysql.connector
from app.core.config import settings

def init_db():
    print("🔄 Connecting to MySQL Server...")
    
    # 1. Connect to MySQL Server (No DB selected yet)
    conn = mysql.connector.connect(
        host=settings.DB_HOST,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD
    )
    cursor = conn.cursor()
    
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
    cursor = conn.cursor()
    
    # 4. Read and Execute tables.sql
    with open("app/tables.sql", "r") as f:
        sql_script = f.read()
    
    commands = sql_script.split(';')
    for command in commands:
        if command.strip():
            cursor.execute(command)
            
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