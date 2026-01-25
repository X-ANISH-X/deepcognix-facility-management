def save_location(conn, booking_id, technician_id, latitude, longitude, accuracy):
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
        INSERT INTO technician_locations
        (booking_id, technician_id, latitude, longitude, accuracy)
        VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            booking_id,
            technician_id,
            latitude,
            longitude,
            accuracy
        ))
        conn.commit()
    finally:
        cursor.close()


def get_latest_location(conn, booking_id):
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
        SELECT booking_id, technician_id, latitude, longitude, accuracy, recorded_at
        FROM technician_locations
        WHERE booking_id = %s
        ORDER BY recorded_at DESC
        LIMIT 1
        """
        cursor.execute(query, (booking_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
