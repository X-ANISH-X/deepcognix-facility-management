def create_category(conn, category):
    cursor = conn.cursor()
    try:
        query = """
        INSERT INTO categories (name, icon_url)
        VALUES (%s, %s)
        """
        cursor.execute(query, (category.name, category.icon_url))
        conn.commit()
        return cursor.lastrowid
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()


def get_all_categories(conn):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, name, icon_url, is_active FROM categories WHERE is_active = TRUE"
        )
        return cursor.fetchall()
    finally:
        cursor.close()
