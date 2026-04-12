def create_notification(
    cursor,
    *,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
):
    cursor.execute(
        """
        INSERT INTO notifications (user_id, title, notification_type, message, is_read)
        VALUES (%s, %s, %s, %s, FALSE)
        """,
        (user_id, title, notification_type, message),
    )


def list_notifications(conn, user_id: int):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT id, user_id, title, notification_type, message, is_read, created_at
            FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC, id DESC
            LIMIT 50
            """,
            (user_id,),
        )
        return cursor.fetchall()
    finally:
        cursor.close()


def mark_notification_read(conn, user_id: int, notification_id: int):
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            UPDATE notifications
            SET is_read = TRUE
            WHERE id = %s AND user_id = %s
            """,
            (notification_id, user_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()


def mark_all_notifications_read(conn, user_id: int):
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = %s",
            (user_id,),
        )
        conn.commit()
    finally:
        cursor.close()
