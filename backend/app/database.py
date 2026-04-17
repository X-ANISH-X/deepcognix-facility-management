import mysql.connector
from mysql.connector import pooling
from app.core.config import settings

# Create a Connection Pool
db_config = {
    "host": settings.DB_HOST,
    "user": settings.DB_USER,
    "password": settings.DB_PASSWORD,
    "database": settings.DB_NAME,
    "port": settings.DB_PORT
}

connection_pool = None

try:
    connection_pool = pooling.MySQLConnectionPool(
        pool_name="deepcognix_pool",
        pool_size=20,
        pool_reset_session=True,
        **db_config
    )
    print("✅ Database Connection Pool Created")
except mysql.connector.Error as err:
    print(f"❌ Error initializing DB Pool: {err}")

def get_db_connection():
    """Dependency: Get a connection from the pool, yield it, then return it."""
    if not connection_pool:
        raise Exception("Database connection pool is not initialized")
    
    connection = connection_pool.get_connection()
    try:
        yield connection
    finally:
        connection.close()