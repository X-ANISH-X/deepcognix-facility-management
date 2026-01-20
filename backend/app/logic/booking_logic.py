def create_booking(conn, booking):
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
        INSERT INTO bookings (
            customer_id, service_id,
            scheduled_date, scheduled_time_slot,
            address_line, building_name,
            floor_number, apartment_number,
            latitude, longitude, customer_notes
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """
        values = (
            booking.customer_id,
            booking.service_id,
            booking.scheduled_date,
            booking.scheduled_time_slot,
            booking.address_line,
            booking.building_name,
            booking.floor_number,
            booking.apartment_number,
            booking.latitude,
            booking.longitude,
            booking.customer_notes
        )
        cursor.execute(query, values)
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()


def list_bookings(conn):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM bookings ORDER BY created_at DESC")
        return cursor.fetchall()
    finally:
        cursor.close()


def get_booking_by_id(conn, booking_id: int):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM bookings WHERE id = %s", (booking_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
