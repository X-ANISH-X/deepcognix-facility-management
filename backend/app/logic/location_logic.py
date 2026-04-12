def save_location(conn, booking_id, technician_id, latitude, longitude, accuracy):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            INSERT INTO technician_live_locations
            (booking_id, technician_id, latitude, longitude, accuracy)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (booking_id, technician_id, latitude, longitude, accuracy),
        )
        conn.commit()
    finally:
        cursor.close()


def get_latest_location(conn, booking_id):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT booking_id, technician_id, latitude, longitude, accuracy, recorded_at
            FROM technician_live_locations
            WHERE booking_id = %s
            ORDER BY recorded_at DESC, id DESC
            LIMIT 1
            """,
            (booking_id,),
        )
        return cursor.fetchone()
    finally:
        cursor.close()
