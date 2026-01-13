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
    print("✅ Tables initialized successfully!")
    conn.close()

if __name__ == "__main__":
    init_db()