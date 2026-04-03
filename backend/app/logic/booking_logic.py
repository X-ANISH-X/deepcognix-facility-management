def create_booking(conn, booking):
    cursor = conn.cursor(dictionary=True)
    try:
        # Validate that the referenced customer and service exist
        cursor.execute("SELECT id FROM users WHERE id = %s", (booking.customer_id,))
        if cursor.fetchone() is None:
            raise ValueError(f"Customer with id {booking.customer_id} does not exist")

        cursor.execute("SELECT id FROM services WHERE id = %s", (booking.service_id,))
        if cursor.fetchone() is None:
            raise ValueError(f"Service with id {booking.service_id} does not exist")

        query = """
        INSERT INTO bookings (
            customer_id, service_id, final_price,
            scheduled_date, scheduled_time_slot,
            address_line, building_name,
            floor_number, apartment_number,
            latitude, longitude, customer_notes
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """

        values = (
            booking.customer_id,
            booking.service_id,
            booking.final_price or 0.0,
            booking.scheduled_date,
            booking.scheduled_time_slot,
            booking.address_line or "",
            booking.building_name or "",
            booking.floor_number or "",
            booking.apartment_number or "",
            booking.latitude or 0.0,
            booking.longitude or 0.0,
            booking.customer_notes or ""  # ✅ THIS WAS BREAKING YOU
        )

        cursor.execute(query, values)
        conn.commit()

        return cursor.lastrowid

    except Exception as e:
        print("❌ CREATE BOOKING ERROR:", e)
        conn.rollback()
        raise

    finally:
        cursor.close()


def list_bookings(conn):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM bookings ORDER BY created_at DESC")
        return cursor.fetchall()
    except Exception as e:
        print("❌ LIST BOOKINGS ERROR:", e)
        raise
    finally:
        cursor.close()


def get_booking_by_id(conn, booking_id: int):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM bookings WHERE id = %s", (booking_id,))
        return cursor.fetchone()
    except Exception as e:
        print("❌ GET BOOKING ERROR:", e)
        raise
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

    except Exception as e:
        print("❌ START JOB ERROR:", e)
        conn.rollback()
        return False, str(e)

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

    except Exception as e:
        print("❌ COMPLETE JOB ERROR:", e)
        conn.rollback()
        return False, str(e)

    finally:
        cursor.close()