from app.logic.notification_logic import create_notification


def normalize_booking_status(status: str | None) -> str | None:
    """
    Normalize booking status labels for compatibility.
    Treats 'completion_requested' (legacy/mobile) as an alias for
    'admin_review_pending' (canonical backend status).
    
    This shim ensures consistent status handling across all frontends
    and mobile apps, allowing both labels to be accepted and stored
    as the canonical 'admin_review_pending' label.
    
    Args:
        status: The booking status string to normalize.
    
    Returns:
        Normalized status: 'completion_requested' → 'admin_review_pending',
        all others unchanged. None is returned unchanged.
    """
    if status is None:
        return None
    
    if status == 'completion_requested':
        return 'admin_review_pending'
    
    return status


def _fetch_active_package(cursor, package_id: int):
    cursor.execute(
        """
        SELECT id, name, price, description
        FROM packages
        WHERE id = %s AND is_active = TRUE
        """,
        (package_id,),
    )
    return cursor.fetchone()


def _fetch_active_service(cursor, service_id: int):
    cursor.execute(
        """
        SELECT id, category_id, name, base_price, duration_minutes
        FROM services
        WHERE id = %s AND is_active = TRUE
        """,
        (service_id,),
    )
    return cursor.fetchone()


def _fetch_booking(cursor, booking_id: int):
    cursor.execute(
        """
        SELECT *
        FROM bookings
        WHERE id = %s
        """,
        (booking_id,),
    )
    return cursor.fetchone()


def _upsert_payment_record(
    cursor,
    *,
    booking_id: int,
    amount: float,
    status: str,
    payment_method: str,
    transaction_reference: str,
    mark_paid: bool = False,
):
    cursor.execute(
        """
        SELECT id
        FROM payments
        WHERE booking_id = %s
        ORDER BY id DESC
        LIMIT 1
        """,
        (booking_id,),
    )
    existing = cursor.fetchone()

    if existing:
        cursor.execute(
            """
            UPDATE payments
            SET amount = %s,
                status = %s,
                payment_method = %s,
                transaction_reference = %s,
                paid_at = CASE WHEN %s THEN CURRENT_TIMESTAMP ELSE paid_at END
            WHERE id = %s
            """,
            (amount, status, payment_method, transaction_reference, mark_paid, existing["id"]),
        )
        return existing["id"]

    cursor.execute(
        """
        INSERT INTO payments (booking_id, amount, status, payment_method, transaction_reference, paid_at)
        VALUES (%s, %s, %s, %s, %s, CASE WHEN %s THEN CURRENT_TIMESTAMP ELSE NULL END)
        """,
        (booking_id, amount, status, payment_method, transaction_reference, mark_paid),
    )
    return cursor.lastrowid


def _create_or_refresh_booking_request(
    cursor,
    *,
    booking_id: int,
    requested_by: int,
    request_type: str,
    message: str,
):
    cursor.execute(
        """
        SELECT id
        FROM booking_requests
        WHERE booking_id = %s
          AND request_type = %s
          AND status = 'pending'
        ORDER BY id DESC
        LIMIT 1
        """,
        (booking_id, request_type),
    )
    existing = cursor.fetchone()
    if existing:
        cursor.execute(
            """
            UPDATE booking_requests
            SET requested_by = %s,
                message = %s
            WHERE id = %s
            """,
            (requested_by, message, existing["id"]),
        )
        return existing["id"]

    cursor.execute(
        """
        INSERT INTO booking_requests (booking_id, requested_by, request_type, message, status)
        VALUES (%s, %s, %s, %s, 'pending')
        """,
        (booking_id, requested_by, request_type, message),
    )
    return cursor.lastrowid


def create_booking(conn, booking, customer_id: int):
    cursor = conn.cursor(dictionary=True)
    try:
        package = _fetch_active_package(cursor, booking.package_id)
        if not package:
            raise ValueError("Invalid package selected")

        service = _fetch_active_service(cursor, booking.service_id)
        if not service:
            raise ValueError("Invalid service selected")

        cursor.execute(
            """
            INSERT INTO bookings (
                customer_id, service_id, package_id,
                scheduled_date, scheduled_time_slot,
                address_line, building_name,
                floor_number, apartment_number,
                latitude, longitude,
                final_price, customer_notes,
                preferred_technician, parking_instructions,
                pet_warning, call_before_arrival
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                customer_id,
                booking.service_id,
                booking.package_id,
                booking.scheduled_date,
                booking.scheduled_time_slot,
                booking.address_line,
                booking.building_name,
                booking.floor_number,
                booking.apartment_number,
                booking.latitude,
                booking.longitude,
                package["price"],
                booking.customer_notes,
                booking.preferred_technician,
                booking.parking_instructions,
                booking.pet_warning,
                booking.call_before_arrival,
            ),
        )
        booking_id = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO booking_checklist (booking_id, task_name, order_index, is_completed)
            SELECT %s, deduped.task_name, deduped.order_index, FALSE
            FROM (
                SELECT task_name, MIN(order_index) AS order_index
                FROM package_checklist
                WHERE package_id = %s
                GROUP BY task_name
            ) AS deduped
            ORDER BY deduped.order_index ASC, deduped.task_name ASC
            """,
            (booking_id, booking.package_id),
        )

# Made an edit here to test the notification system
        cursor.execute("SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE")
        for admin in cursor.fetchall():
            create_notification(
                cursor,
                user_id=admin["id"],
                title="New Booking Submitted",
                message=f"Booking #{booking_id} was submitted and is waiting for review.",
                notification_type="booking_submitted",
            )

        conn.commit()
        return booking_id
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()


def list_bookings(conn, user_id: int | None = None, role: str | None = None):
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
        SELECT
            b.*,
            p.name AS package_name,
            s.name AS service_name,
            c.full_name AS customer_name,
            c.email AS customer_email,
            c.phone_number AS customer_phone,
            t.full_name AS technician_name,
            t.phone_number AS technician_phone
        FROM bookings b
        JOIN packages p ON p.id = b.package_id
        JOIN services s ON s.id = b.service_id
        JOIN users c ON c.id = b.customer_id
        LEFT JOIN users t ON t.id = b.technician_id
        """
        params = ()

        if role == "customer":
            query += " WHERE b.customer_id = %s"
            params = (user_id,)
        elif role == "technician":
            query += " WHERE b.technician_id = %s"
            params = (user_id,)

        query += " ORDER BY b.created_at DESC"
        cursor.execute(query, params)
        return cursor.fetchall()
    finally:
        cursor.close()


def get_booking_by_id(conn, booking_id: int):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT
                b.*,
                p.name AS package_name,
                s.name AS service_name,
                c.full_name AS customer_name,
                c.email AS customer_email,
                c.phone_number AS customer_phone,
                t.full_name AS technician_name,
                t.phone_number AS technician_phone
            FROM bookings b
            JOIN packages p ON p.id = b.package_id
            JOIN services s ON s.id = b.service_id
            JOIN users c ON c.id = b.customer_id
            LEFT JOIN users t ON t.id = b.technician_id
            WHERE b.id = %s
            """,
            (booking_id,),
        )
        return cursor.fetchone()
    finally:
        cursor.close()


def assign_booking(conn, booking_id: int, technician_id: int):
    cursor = conn.cursor(dictionary=True)
    try:
        booking = _fetch_booking(cursor, booking_id)
        if not booking:
            return False, "Booking not found"

        cursor.execute(
            """
            SELECT id, role, is_active
            FROM users
            WHERE id = %s
            """,
            (technician_id,),
        )
        technician = cursor.fetchone()
        if not technician or not technician["is_active"]:
            return False, "Technician not found or inactive"

        if technician["role"] != "technician":
            return False, "Selected user is not a technician"

        cursor.execute(
            """
            UPDATE bookings
            SET technician_id = %s, status = 'assigned'
            WHERE id = %s
            """,
            (technician_id, booking_id),
        )
        create_notification(
            cursor,
            user_id=technician_id,
            title="New Job Assigned",
            message=f"Booking #{booking_id} has been assigned to you. Review the job and start when ready.",
            notification_type="job_assigned",
        )
        conn.commit()
        return True, None
    finally:
        cursor.close()


def get_booking_tasks(conn, booking_id: int):
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT id, booking_id, task_name, order_index, is_completed
            FROM booking_checklist
            WHERE booking_id = %s
            ORDER BY order_index ASC, id ASC
            """,
            (booking_id,),
        )
        return cursor.fetchall()
    finally:
        cursor.close()


def update_booking_task_status(conn, booking_id: int, task_id: int, technician_id: int, is_completed: bool):
    cursor = conn.cursor(dictionary=True)
    try:
        booking = _fetch_booking(cursor, booking_id)
        if not booking:
            return False, "Booking not found"

        if booking["technician_id"] != technician_id:
            return False, "Booking not assigned to technician"

        cursor.execute(
            """
            SELECT id
            FROM booking_checklist
            WHERE id = %s AND booking_id = %s
            """,
            (task_id, booking_id),
        )
        task = cursor.fetchone()
        if not task:
            return False, "Task not found for booking"

        cursor.execute(
            """
            UPDATE booking_checklist
            SET is_completed = %s
            WHERE id = %s AND booking_id = %s
            """,
            (is_completed, task_id, booking_id),
        )
        create_notification(
            cursor,
            user_id=booking["customer_id"],
            title="Checklist Updated",
            message=f"Technician updated the checklist for booking #{booking_id}.",
            notification_type="checklist_updated",
        )
        conn.commit()
        return True, None
    finally:
        cursor.close()


def start_job(conn, booking_id, technician_id):
    cursor = conn.cursor(dictionary=True)
    try:
        booking = _fetch_booking(cursor, booking_id)
        if not booking:
            return False, "Booking not found"

        if booking["technician_id"] != technician_id:
            return False, "Booking not assigned to technician"

        if booking["status"] != "arrival_approval_pending":
            return False, f"Job can be started only after reaching the location (current: {booking['status']})"

        cursor.execute(
            "UPDATE bookings SET status = 'in_progress' WHERE id = %s",
            (booking_id,),
        )
        create_notification(
            cursor,
            user_id=technician_id,
            title="Job Accepted",
            message=f"You accepted and started booking #{booking_id}. Live progress is now active.",
            notification_type="job_started",
        )
        create_notification(
            cursor,
            user_id=booking["customer_id"],
            title="Technician Started Job",
            message=f"Your technician has started booking #{booking_id}.",
            notification_type="job_started",
        )
        conn.commit()
        return True, None
    finally:
        cursor.close()


def mark_booking_on_the_way(conn, booking_id: int, technician_id: int):
    """
    Mark booking as 'on_the_way' when technician is en route.
    Safe transition: assigned -> on_the_way
    """
    cursor = conn.cursor(dictionary=True)
    try:
        booking = _fetch_booking(cursor, booking_id)
        if not booking:
            return False, "Booking not found"

        if booking["technician_id"] != technician_id:
            return False, "Booking not assigned to technician"

        if booking["status"] != "assigned":
            return False, f"Cannot mark as on_the_way from {booking['status']} status"

        cursor.execute(
            "UPDATE bookings SET status = 'on_the_way' WHERE id = %s",
            (booking_id,),
        )
        create_notification(
            cursor,
            user_id=technician_id,
            title="On The Way",
            message=f"You marked booking #{booking_id} as on the way. Share your live location with customer.",
            notification_type="on_the_way",
        )
        create_notification(
            cursor,
            user_id=booking["customer_id"],
            title="Technician On The Way",
            message=f"Your technician is on the way for booking #{booking_id}. You can track live progress.",
            notification_type="on_the_way",
        )
        conn.commit()
        return True, None
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        cursor.close()


def mark_booking_arrival_pending(conn, booking_id: int, technician_id: int):
    """
    Mark booking as 'arrival_approval_pending' when technician has arrived.
    Safe transition: on_the_way -> arrival_approval_pending
    """
    cursor = conn.cursor(dictionary=True)
    try:
        booking = _fetch_booking(cursor, booking_id)
        if not booking:
            return False, "Booking not found"

        if booking["technician_id"] != technician_id:
            return False, "Booking not assigned to technician"

        if booking["status"] != "on_the_way":
            return False, f"Cannot request arrival confirmation from {booking['status']} status"

        cursor.execute(
            "UPDATE bookings SET status = 'arrival_approval_pending' WHERE id = %s",
            (booking_id,),
        )
        create_notification(
            cursor,
            user_id=technician_id,
            title="Arrival Confirmation Requested",
            message=f"Awaiting customer confirmation for arrival at booking #{booking_id}.",
            notification_type="arrival_approval_pending",
        )
        create_notification(
            cursor,
            user_id=booking["customer_id"],
            title="Technician Arrived",
            message=f"Your technician has arrived for booking #{booking_id}. Please confirm arrival to begin service.",
            notification_type="arrival_approval_pending",
        )
        conn.commit()
        return True, None
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        cursor.close()


def request_job_rejection(conn, booking_id: int, technician_id: int, reason: str):
    cursor = conn.cursor(dictionary=True)
    try:
        booking = _fetch_booking(cursor, booking_id)
        if not booking:
            return False, "Booking not found"

        if booking["technician_id"] != technician_id:
            return False, "Booking not assigned to technician"

        if booking["status"] != "assigned":
            return False, "Only assigned jobs can be rejected before starting"

        clean_reason = reason.strip()
        if not clean_reason:
            return False, "Rejection reason is required"

        cursor.execute(
            """
            UPDATE bookings
            SET status = 'rejection_requested',
                technician_notes = %s
            WHERE id = %s
            """,
            (clean_reason, booking_id),
        )
        _create_or_refresh_booking_request(
            cursor,
            booking_id=booking_id,
            requested_by=technician_id,
            request_type="rejection",
            message=clean_reason,
        )

        create_notification(
            cursor,
            user_id=technician_id,
            title="Rejection Requested",
            message=f"Your rejection request for booking #{booking_id} was sent to admin. Reason: {clean_reason}",
            notification_type="job_rejection_requested",
        )

        cursor.execute("SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE")
        for admin in cursor.fetchall():
            create_notification(
                cursor,
                user_id=admin["id"],
                title="Rejection Approval Needed",
                message=f"Technician requested rejection for booking #{booking_id}. Reason: {clean_reason}",
                notification_type="job_rejection_requested",
            )

        conn.commit()
        return True, None
    finally:
        cursor.close()


def approve_job_rejection(conn, booking_id: int, admin_id: int):
    cursor = conn.cursor(dictionary=True)
    try:
        booking = _fetch_booking(cursor, booking_id)
        if not booking:
            return False, "Booking not found"

        if booking["status"] != "rejection_requested":
            return False, "Booking does not have a pending rejection request"

        cursor.execute(
            "UPDATE bookings SET status = 'rejected' WHERE id = %s",
            (booking_id,),
        )
        cursor.execute(
            """
            UPDATE booking_requests
            SET status = 'approved',
                reviewed_by = %s,
                reviewed_at = CURRENT_TIMESTAMP
            WHERE booking_id = %s
              AND request_type = 'rejection'
              AND status = 'pending'
            """,
            (admin_id, booking_id),
        )

        create_notification(
            cursor,
            user_id=booking["technician_id"],
            title="Rejection Approved",
            message=f"Admin approved your rejection request for booking #{booking_id}.",
            notification_type="job_rejected",
        )
        create_notification(
            cursor,
            user_id=booking["customer_id"],
            title="Booking Reassignment Needed",
            message=f"Your booking #{booking_id} needs reassignment after technician rejection approval.",
            notification_type="job_rejected",
        )
        create_notification(
            cursor,
            user_id=admin_id,
            title="Rejection Approved",
            message=f"You approved the technician rejection request for booking #{booking_id}.",
            notification_type="job_rejected",
        )

        conn.commit()
        return True, None
    finally:
        cursor.close()


def request_job_completion(conn, booking_id: int, technician_id: int, notes: str | None = None):
    cursor = conn.cursor(dictionary=True)
    try:
        booking = _fetch_booking(cursor, booking_id)
        if not booking:
            return False, "Booking not found"

        if booking["technician_id"] != technician_id:
            return False, "Booking not assigned to technician"

        if booking["status"] != "in_progress":
            return False, "Job can be completed only when in progress"

        cursor.execute(
            """
            SELECT COUNT(*) AS remaining_tasks
            FROM booking_checklist
            WHERE booking_id = %s AND is_completed = FALSE
            """,
            (booking_id,),
        )
        pending = cursor.fetchone()
        if pending and pending["remaining_tasks"] > 0:
            return False, "Complete all checklist tasks before finishing the job"

        cursor.execute(
            """
            UPDATE bookings
            SET status = 'customer_review_pending',
                technician_notes = %s
            WHERE id = %s
            """,
            (
                notes.strip() if notes and notes.strip() else booking.get("technician_notes"),
                booking_id,
            ),
        )
        request_message = (
            notes.strip()
            if notes and notes.strip()
            else f"Technician marked booking #{booking_id} as complete and is awaiting customer approval."
        )
        _create_or_refresh_booking_request(
            cursor,
            booking_id=booking_id,
            requested_by=technician_id,
            request_type="completion",
            message=request_message,
        )
        create_notification(
            cursor,
            user_id=technician_id,
            title="Completion Approval Requested",
            message=f"Completion approval request was sent to the customer for booking #{booking_id}.",
            notification_type="customer_review_pending",
        )
        create_notification(
            cursor,
            user_id=booking["customer_id"],
            title="Review Completed Job",
            message=f"Your technician marked booking #{booking_id} as completed. Please review the checklist progress and approve completion.",
            notification_type="customer_review_pending",
        )
        conn.commit()
        return True, None
    finally:
        cursor.close()


def customer_approve_job_completion(conn, booking_id: int, customer_id: int):
    cursor = conn.cursor(dictionary=True)
    try:
        booking = _fetch_booking(cursor, booking_id)
        if not booking:
            return False, "Booking not found"

        if booking["customer_id"] != customer_id:
            return False, "You cannot approve this booking"

        if booking["status"] != "customer_review_pending":
            return False, "Booking is not waiting for customer approval"

        cursor.execute(
            "UPDATE bookings SET status = 'admin_review_pending' WHERE id = %s",
            (booking_id,),
        )

        create_notification(
            cursor,
            user_id=booking["technician_id"],
            title="Customer Approved Work",
            message=f"The customer approved booking #{booking_id}. Final admin approval is pending.",
            notification_type="admin_review_pending",
        )
        create_notification(
            cursor,
            user_id=customer_id,
            title="Completion Sent To Admin",
            message=f"Booking #{booking_id} was approved by you and sent to admin for final confirmation.",
            notification_type="admin_review_pending",
        )
        cursor.execute("SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE")
        for admin in cursor.fetchall():
            create_notification(
                cursor,
                user_id=admin["id"],
                title="Completion Approval Needed",
                message=f"Customer approved booking #{booking_id}. Review and approve final completion.",
                notification_type="completion_requested",
            )

        conn.commit()
        return True, None
    finally:
        cursor.close()


def customer_request_rework(conn, booking_id: int, customer_id: int, reason: str):
    cursor = conn.cursor(dictionary=True)
    try:
        booking = _fetch_booking(cursor, booking_id)
        if not booking:
            return False, "Booking not found"

        if booking["customer_id"] != customer_id:
            return False, "You cannot request rework for this booking"

        if booking["status"] != "customer_review_pending":
            return False, "Rework can only be requested while customer review is pending"

        clean_reason = reason.strip()
        if not clean_reason:
            return False, "Rework reason is required"

        cursor.execute(
            """
            UPDATE bookings
            SET status = 'in_progress',
                technician_notes = %s
            WHERE id = %s
            """,
            (clean_reason, booking_id),
        )
        cursor.execute(
            """
            UPDATE booking_requests
            SET status = 'rejected',
                admin_notes = %s
            WHERE booking_id = %s
              AND request_type = 'completion'
              AND status = 'pending'
            """,
            (f"Customer requested rework: {clean_reason}", booking_id),
        )
        _create_or_refresh_booking_request(
            cursor,
            booking_id=booking_id,
            requested_by=customer_id,
            request_type="feedback",
            message=clean_reason,
        )

        if booking.get("technician_id"):
            create_notification(
                cursor,
                user_id=booking["technician_id"],
                title="Customer Requested Rework",
                message=f"Customer requested rework for booking #{booking_id}: {clean_reason}",
                notification_type="rework_requested",
            )
        cursor.execute("SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE")
        for admin in cursor.fetchall():
            create_notification(
                cursor,
                user_id=admin["id"],
                title="Customer Requested Rework",
                message=f"Customer requested rework for booking #{booking_id}: {clean_reason}",
                notification_type="rework_requested",
            )

        conn.commit()
        return True, None
    finally:
        cursor.close()


def approve_job_completion(conn, booking_id: int, admin_id: int):
    cursor = conn.cursor(dictionary=True)
    try:
        booking = _fetch_booking(cursor, booking_id)
        if not booking:
            return False, "Booking not found"

        if booking["status"] != "admin_review_pending":
            return False, "Booking does not have a pending completion request"

        cursor.execute(
            "UPDATE bookings SET status = 'completed' WHERE id = %s",
            (booking_id,),
        )
        cursor.execute(
            """
            UPDATE booking_requests
            SET status = 'approved',
                reviewed_by = %s,
                reviewed_at = CURRENT_TIMESTAMP
            WHERE booking_id = %s
              AND request_type = 'completion'
              AND status = 'pending'
            """,
            (admin_id, booking_id),
        )
        create_notification(
            cursor,
            user_id=booking["technician_id"],
            title="Completion Approved",
            message=f"Admin approved completion for booking #{booking_id}.",
            notification_type="job_completed",
        )
        create_notification(
            cursor,
            user_id=booking["customer_id"],
            title="Job Completed",
            message=f"Booking #{booking_id} has been completed and approved by admin.",
            notification_type="job_completed",
        )
        create_notification(
            cursor,
            user_id=admin_id,
            title="Completion Approved",
            message=f"You approved completion for booking #{booking_id}.",
            notification_type="job_completed",
        )
        conn.commit()
        return True, None
    finally:
        cursor.close()
