def list_packages(conn):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT id, name, price, description, is_active
            FROM packages
            WHERE is_active = TRUE
            ORDER BY price ASC, id ASC
            """
        )
        return cursor.fetchall()
    finally:
        cursor.close()


def get_package_by_id(conn, package_id: int):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT id, name, price, description, is_active
            FROM packages
            WHERE id = %s
            """,
            (package_id,),
        )
        return cursor.fetchone()
    finally:
        cursor.close()


def get_package_tasks(conn, package_id: int):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT id, package_id, task_name, order_index
            FROM package_checklist
            WHERE package_id = %s
            ORDER BY order_index ASC, id ASC
            """,
            (package_id,),
        )
        return cursor.fetchall()
    finally:
        cursor.close()
