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


def start_job(conn, booking_id, technician_id):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT status, technician_id FROM bookings WHERE id = %s",
            (booking_id,)
        )
        booking = cursor.fetchone()

        if not booking:
            return False, "Booking not found"

        if booking["technician_id"] != technician_id:
            return False, "Booking not assigned to technician"

        if booking["status"] != "assigned":
            return False, "Job can be started only when assigned"

        cursor.execute(
            "UPDATE bookings SET status = 'in_progress' WHERE id = %s",
            (booking_id,)
        )
        conn.commit()
        return True, None
    finally:
        cursor.close()


def complete_job(conn, booking_id: int, technician_id: int):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, status, technician_id FROM bookings WHERE id = %s",
            (booking_id,)
        )
        booking = cursor.fetchone()

        if not booking:
            return False, "Booking not found"

        if booking["technician_id"] != technician_id:
            return False, "Booking not assigned to technician"

        if booking["status"] != "in_progress":
            return False, "Job can be completed only when in progress"

        cursor.execute(
            "UPDATE bookings SET status = 'completed' WHERE id = %s",
            (booking_id,)
        )
        conn.commit()
        return True, None
    finally:
        cursor.close()
