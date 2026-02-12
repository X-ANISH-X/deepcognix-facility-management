import mysql.connector
from app.model.auth_model import UserRegister
from app.core.security import get_password_hash

def get_user_by_email(conn, email: str):
    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT * FROM users WHERE email = %s"
        cursor.execute(query, (email,))
        return cursor.fetchone()
    finally:
        cursor.close()

def create_user(conn, user: UserRegister):
    cursor = conn.cursor()
    try:
        hashed_password = get_password_hash(user.password)
        query = """
        INSERT INTO users (full_name, email, password_hash, phone_number, role)
        VALUES (%s, %s, %s, %s, %s)
        """
        values = (user.full_name, user.email, hashed_password, user.phone_number, user.role)
        cursor.execute(query, values)
        conn.commit()
        return cursor.lastrowid
    except mysql.connector.Error as err:
        conn.rollback()
        raise err
    finally:
        cursor.close()