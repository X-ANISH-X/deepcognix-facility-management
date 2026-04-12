def create_service(conn, service):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id FROM categories WHERE id = %s AND is_active = TRUE",
            (service.category_id,),
        )
        category = cursor.fetchone()
        if not category:
            raise ValueError("Category not found or inactive")

        query = """
        INSERT INTO services
        (category_id, name, description, base_price, duration_minutes)
        VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(
            query,
            (
                service.category_id,
                service.name,
                service.description,
                service.base_price,
                service.duration_minutes
            )
        )
        conn.commit()
        return cursor.lastrowid
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()


def get_all_services(conn):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM services WHERE is_active = TRUE"
        )
        return cursor.fetchall()
    finally:
        cursor.close()


def get_services_by_category(conn, category_id: int):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM services WHERE category_id = %s AND is_active = TRUE",
            (category_id,)
        )
        return cursor.fetchall()
    finally:
        cursor.close()
