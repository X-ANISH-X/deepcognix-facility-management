from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

import mysql.connector

from app.core.config import settings
from app.core.security import get_password_hash
from app.init_db import init_db


@dataclass
class SeedUser:
    full_name: str
    email: str
    phone_number: str
    role: str
    password: str


def get_connection():
    return mysql.connector.connect(
        host=settings.DB_HOST,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
        port=settings.DB_PORT,
    )


def ensure_user(cursor, user: SeedUser) -> int:
    cursor.execute("SELECT id FROM users WHERE email = %s", (user.email,))
    existing = cursor.fetchone()

    password_hash = get_password_hash(user.password)
    if existing:
        user_id = existing[0]
        cursor.execute(
            """
            UPDATE users
            SET full_name = %s,
                phone_number = %s,
                role = %s,
                is_active = TRUE,
                password_hash = %s
            WHERE id = %s
            """,
            (user.full_name, user.phone_number, user.role, password_hash, user_id),
        )
        return user_id

    cursor.execute(
        """
        INSERT INTO users (full_name, email, password_hash, phone_number, role, is_active)
        VALUES (%s, %s, %s, %s, %s, TRUE)
        """,
        (user.full_name, user.email, password_hash, user.phone_number, user.role),
    )
    return cursor.lastrowid


def ensure_category(cursor, name: str, icon_url: str | None = None) -> int:
    cursor.execute("SELECT id FROM categories WHERE name = %s", (name,))
    row = cursor.fetchone()
    if row:
        category_id = row[0]
        cursor.execute(
            "UPDATE categories SET icon_url = %s, is_active = TRUE WHERE id = %s",
            (icon_url, category_id),
        )
        return category_id

    cursor.execute(
        "INSERT INTO categories (name, icon_url, is_active) VALUES (%s, %s, TRUE)",
        (name, icon_url),
    )
    return cursor.lastrowid


def ensure_service(
    cursor,
    *,
    category_id: int,
    name: str,
    description: str,
    base_price: float,
    duration_minutes: int,
) -> int:
    cursor.execute("SELECT id FROM services WHERE name = %s", (name,))
    row = cursor.fetchone()
    if row:
        service_id = row[0]
        cursor.execute(
            """
            UPDATE services
            SET category_id = %s,
                description = %s,
                base_price = %s,
                duration_minutes = %s,
                is_active = TRUE
            WHERE id = %s
            """,
            (category_id, description, base_price, duration_minutes, service_id),
        )
        return service_id

    cursor.execute(
        """
        INSERT INTO services (category_id, name, description, base_price, duration_minutes, is_active)
        VALUES (%s, %s, %s, %s, %s, TRUE)
        """,
        (category_id, name, description, base_price, duration_minutes),
    )
    return cursor.lastrowid


def get_package(cursor, name: str) -> tuple[int, float]:
    cursor.execute("SELECT id, price FROM packages WHERE name = %s AND is_active = TRUE", (name,))
    row = cursor.fetchone()
    if not row:
        raise ValueError(f"Package '{name}' not found. Run app.init_db first.")
    return int(row[0]), float(row[1])


def ensure_booking(
    cursor,
    *,
    customer_id: int,
    service_id: int,
    package_id: int,
    technician_id: int | None,
    status: str,
    final_price: float,
    scheduled_date: date,
    scheduled_time_slot: str,
    address_line: str,
    building_name: str,
    floor_number: str,
    apartment_number: str,
    latitude: float,
    longitude: float,
    customer_notes: str,
    technician_notes: str | None = None,
) -> int:
    cursor.execute(
        """
        SELECT id
        FROM bookings
        WHERE customer_id = %s
          AND service_id = %s
          AND package_id = %s
          AND scheduled_date = %s
          AND scheduled_time_slot = %s
          AND address_line = %s
        """,
        (
            customer_id,
            service_id,
            package_id,
            scheduled_date,
            scheduled_time_slot,
            address_line,
        ),
    )
    row = cursor.fetchone()
    if row:
        booking_id = row[0]
        cursor.execute(
            """
            UPDATE bookings
            SET technician_id = %s,
                status = %s,
                final_price = %s,
                building_name = %s,
                floor_number = %s,
                apartment_number = %s,
                latitude = %s,
                longitude = %s,
                customer_notes = %s,
                technician_notes = %s
            WHERE id = %s
            """,
            (
                technician_id,
                status,
                final_price,
                building_name,
                floor_number,
                apartment_number,
                latitude,
                longitude,
                customer_notes,
                technician_notes,
                booking_id,
            ),
        )
        return booking_id

    cursor.execute(
        """
        INSERT INTO bookings (
            customer_id, service_id, package_id, technician_id, status, final_price,
            scheduled_date, scheduled_time_slot, address_line, building_name,
            floor_number, apartment_number, latitude, longitude,
            customer_notes, technician_notes
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            customer_id,
            service_id,
            package_id,
            technician_id,
            status,
            final_price,
            scheduled_date,
            scheduled_time_slot,
            address_line,
            building_name,
            floor_number,
            apartment_number,
            latitude,
            longitude,
            customer_notes,
            technician_notes,
        ),
    )
    return cursor.lastrowid


def ensure_booking_checklist(cursor, booking_id: int, package_id: int):
    cursor.execute("SELECT COUNT(*) FROM booking_checklist WHERE booking_id = %s", (booking_id,))
    count = cursor.fetchone()[0]
    if count > 0:
        return

    cursor.execute(
        """
        INSERT INTO booking_checklist (booking_id, task_name, order_index, is_completed)
        SELECT %s, task_name, order_index, FALSE
        FROM package_checklist
        WHERE package_id = %s
        ORDER BY order_index ASC, id ASC
        """,
        (booking_id, package_id),
    )


def set_task_progress(cursor, booking_id: int, completed_count: int | None = None, complete_all: bool = False):
    if complete_all:
        cursor.execute(
            "UPDATE booking_checklist SET is_completed = TRUE WHERE booking_id = %s",
            (booking_id,),
        )
        return

    cursor.execute(
        "UPDATE booking_checklist SET is_completed = FALSE WHERE booking_id = %s",
        (booking_id,),
    )
    if completed_count and completed_count > 0:
        cursor.execute(
            """
            SELECT id
            FROM booking_checklist
            WHERE booking_id = %s
            ORDER BY order_index ASC, id ASC
            LIMIT %s
            """,
            (booking_id, completed_count),
        )
        task_ids = [row[0] for row in cursor.fetchall()]
        if task_ids:
            placeholders = ", ".join(["%s"] * len(task_ids))
            cursor.execute(
                f"UPDATE booking_checklist SET is_completed = TRUE WHERE id IN ({placeholders})",
                tuple(task_ids),
            )


def ensure_payment(cursor, booking_id: int, amount: float, status: str, payment_method: str):
    cursor.execute("SELECT id FROM payments WHERE booking_id = %s", (booking_id,))
    row = cursor.fetchone()
    if row:
        cursor.execute(
            """
            UPDATE payments
            SET amount = %s, status = %s, payment_method = %s
            WHERE booking_id = %s
            """,
            (amount, status, payment_method, booking_id),
        )
        return

    cursor.execute(
        """
        INSERT INTO payments (booking_id, amount, payment_method, status)
        VALUES (%s, %s, %s, %s)
        """,
        (booking_id, amount, payment_method, status),
    )


def ensure_notification(
    cursor,
    user_id: int,
    message: str,
    is_read: bool = False,
    title: str = "Notification",
    notification_type: str = "general",
):
    cursor.execute(
        "SELECT id FROM notifications WHERE user_id = %s AND message = %s",
        (user_id, message),
    )
    existing = cursor.fetchone()
    if existing:
        cursor.execute(
            """
            UPDATE notifications
            SET title = %s, notification_type = %s, is_read = %s
            WHERE id = %s
            """,
            (title, notification_type, is_read, existing[0]),
        )
        return

    cursor.execute(
        """
        INSERT INTO notifications (user_id, title, notification_type, message, is_read)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (user_id, title, notification_type, message, is_read),
    )


def ensure_location(cursor, booking_id: int, technician_id: int, latitude: float, longitude: float, accuracy: float):
    cursor.execute(
        """
        SELECT id
        FROM technician_live_locations
        WHERE booking_id = %s AND technician_id = %s AND latitude = %s AND longitude = %s
        """,
        (booking_id, technician_id, latitude, longitude),
    )
    if cursor.fetchone():
        return

    cursor.execute(
        """
        INSERT INTO technician_live_locations (booking_id, technician_id, latitude, longitude, accuracy)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (booking_id, technician_id, latitude, longitude, accuracy),
    )


def seed_dummy_data():
    init_db()

    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        users = {
            "admin": SeedUser("Priya Nair", "admin.demo@deepcognix.com", "9876500001", "admin", "Admin@123"),
            # Quick-test accounts — same password as admin for easy local testing
            "user_demo": SeedUser("Demo User", "user.demo@deepcognix.com", "9876500002", "customer", "Admin@123"),
            "tech_demo": SeedUser("Demo Technician", "technician.demo@deepcognix.com", "9876500003", "technician", "Admin@123"),
            "customer_1": SeedUser("Aisha Malhotra", "aisha.demo@deepcognix.com", "9876501001", "customer", "Customer@123"),
            "customer_2": SeedUser("Rohan Mehta", "rohan.demo@deepcognix.com", "9876501002", "customer", "Customer@123"),
            "tech_1": SeedUser("Samarth Vasisht", "sam123@gmail.com", "9876502001", "technician", "test123"),
            "tech_2": SeedUser("Neeraj Kumar", "neeraj.tech@deepcognix.com", "9876502002", "technician", "Tech@123"),
            "tech_3": SeedUser("Kavya Sharma", "kavya.tech@deepcognix.com", "9876502003", "technician", "Tech@123"),
        }

        user_ids = {key: ensure_user(cursor, user) for key, user in users.items()}

        cleaning_category_id = ensure_category(
            cursor,
            "Cleaning",
            "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80",
        )
        maintenance_category_id = ensure_category(
            cursor,
            "Maintenance",
            "https://images.unsplash.com/photo-1581092160607-ee22731c2db4?auto=format&fit=crop&w=300&q=80",
        )

        home_cleaning_service_id = ensure_service(
            cursor,
            category_id=cleaning_category_id,
            name="Home Deep Cleaning",
            description="Apartment and villa cleaning with package-based checklist execution.",
            base_price=999.00,
            duration_minutes=180,
        )
        sofa_service_id = ensure_service(
            cursor,
            category_id=cleaning_category_id,
            name="Sofa & Upholstery Cleaning",
            description="Fabric and upholstery focused cleaning for living room furniture.",
            base_price=799.00,
            duration_minutes=120,
        )
        ac_service_id = ensure_service(
            cursor,
            category_id=maintenance_category_id,
            name="AC Service Visit",
            description="Routine AC cleaning and inspection visit.",
            base_price=699.00,
            duration_minutes=90,
        )

        silver_id, silver_price = get_package(cursor, "Silver")
        gold_id, gold_price = get_package(cursor, "Gold")
        platinum_id, platinum_price = get_package(cursor, "Platinum")

        today = date.today()

        bookings = [
            {
                "customer_id": user_ids["customer_1"],
                "service_id": home_cleaning_service_id,
                "package_id": gold_id,
                "technician_id": user_ids["tech_1"],
                "status": "assigned",
                "final_price": gold_price,
                "scheduled_date": today + timedelta(days=1),
                "scheduled_time_slot": "morning",
                "address_line": "Flat 402, Maple Residency, Sector 62",
                "building_name": "Maple Residency",
                "floor_number": "4",
                "apartment_number": "402",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "customer_notes": "Please ring the bell once and call if needed.",
                "technician_notes": "Assigned for tomorrow morning slot.",
                "task_mode": ("assigned", 0),
            },
            {
                "customer_id": user_ids["customer_2"],
                "service_id": home_cleaning_service_id,
                "package_id": platinum_id,
                "technician_id": user_ids["tech_1"],
                "status": "in_progress",
                "final_price": platinum_price,
                "scheduled_date": today,
                "scheduled_time_slot": "afternoon",
                "address_line": "Tower B, Riverfront Heights, Indiranagar",
                "building_name": "Riverfront Heights",
                "floor_number": "12",
                "apartment_number": "1203",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "customer_notes": "Parking available in visitor slot B12.",
                "technician_notes": "Customer requested focus on kitchen and bathrooms first.",
                "task_mode": ("progress", 11),
            },
            {
                "customer_id": user_ids["customer_1"],
                "service_id": sofa_service_id,
                "package_id": silver_id,
                "technician_id": user_ids["tech_1"],
                "status": "completed",
                "final_price": silver_price,
                "scheduled_date": today - timedelta(days=2),
                "scheduled_time_slot": "evening",
                "address_line": "House 17, Palm Grove Villas",
                "building_name": "Palm Grove Villas",
                "floor_number": "Ground",
                "apartment_number": "17",
                "latitude": 19.0760,
                "longitude": 72.8777,
                "customer_notes": "Pet dog at home, please keep door closed.",
                "technician_notes": "Service finished and customer confirmed completion.",
                "task_mode": ("complete", 0),
            },
            {
                "customer_id": user_ids["customer_2"],
                "service_id": ac_service_id,
                "package_id": silver_id,
                "technician_id": user_ids["tech_2"],
                "status": "assigned",
                "final_price": silver_price,
                "scheduled_date": today + timedelta(days=2),
                "scheduled_time_slot": "afternoon",
                "address_line": "Flat 803, Skyview Apartments",
                "building_name": "Skyview Apartments",
                "floor_number": "8",
                "apartment_number": "803",
                "latitude": 17.3850,
                "longitude": 78.4867,
                "customer_notes": "Service the bedroom AC first.",
                "technician_notes": "Secondary technician assignment for testing.",
                "task_mode": ("assigned", 0),
            },
            {
                "customer_id": user_ids["customer_1"],
                "service_id": home_cleaning_service_id,
                "package_id": gold_id,
                "technician_id": None,
                "status": "submitted",
                "final_price": gold_price,
                "scheduled_date": today + timedelta(days=4),
                "scheduled_time_slot": "morning",
                "address_line": "Flat 903, Blue Cedar Heights",
                "building_name": "Blue Cedar Heights",
                "floor_number": "9",
                "apartment_number": "903",
                "latitude": 22.5726,
                "longitude": 88.3639,
                "customer_notes": "Booking awaiting admin approval and assignment.",
                "technician_notes": None,
                "task_mode": ("assigned", 0),
            },
        ]

        booking_ids: list[int] = []
        for item in bookings:
            task_mode, progress_count = item.pop("task_mode")
            booking_id = ensure_booking(cursor, **item)
            ensure_booking_checklist(cursor, booking_id, item["package_id"])

            if task_mode == "complete":
                set_task_progress(cursor, booking_id, complete_all=True)
            elif task_mode == "progress":
                set_task_progress(cursor, booking_id, completed_count=progress_count)
            else:
                set_task_progress(cursor, booking_id, completed_count=0)

            booking_ids.append(booking_id)

            payment_status = "success" if item["status"] == "completed" else "pending"
            payment_method = "upi" if item["status"] == "completed" else "card"
            ensure_payment(cursor, booking_id, item["final_price"], payment_status, payment_method)

        ensure_notification(
            cursor,
            user_ids["tech_1"],
            "New assignment: Gold package cleaning at Maple Residency tomorrow morning.",
            False,
            "New Job Assigned",
            "job_assigned",
        )
        ensure_notification(
            cursor,
            user_ids["tech_1"],
            "Job in progress: Platinum cleaning at Riverfront Heights.",
            False,
            "Job In Progress",
            "job_started",
        )
        ensure_notification(
            cursor,
            user_ids["customer_2"],
            "Your technician has started the Platinum cleaning service.",
            False,
            "Technician Started Job",
            "job_started",
        )
        ensure_notification(
            cursor,
            user_ids["admin"],
            "One booking is awaiting approval and technician assignment.",
            False,
            "Booking Awaiting Assignment",
            "booking_submitted",
        )

        ensure_location(cursor, booking_ids[1], user_ids["tech_1"], 12.9717, 77.5948, 8.2)
        ensure_location(cursor, booking_ids[1], user_ids["tech_1"], 12.9718, 77.5950, 5.4)
        ensure_location(cursor, booking_ids[2], user_ids["tech_1"], 19.0761, 72.8778, 9.8)

        conn.commit()

        print("Seeded realistic demo data successfully.")
        print("")
        print("Demo login credentials:")
        print("  Admin           -> admin.demo@deepcognix.com / Admin@123")
        print("  [User App]      -> user.demo@deepcognix.com / Admin@123")
        print("  [Tech App]      -> technician.demo@deepcognix.com / Admin@123")
        print("  Customer 1      -> aisha.demo@deepcognix.com / Customer@123")
        print("  Customer 2      -> rohan.demo@deepcognix.com / Customer@123")
        print("  Tech 1          -> sam123@gmail.com / test123")
        print("  Tech 2          -> neeraj.tech@deepcognix.com / Tech@123")
        print("  Tech 3          -> kavya.tech@deepcognix.com / Tech@123")
        print("")
        print("Seeded data includes:")
        print("  - Active categories and services")
        print("  - Assigned, in-progress, completed, and submitted bookings")
        print("  - Package-driven checklist tasks")
        print("  - Payments, notifications, and sample technician locations")
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    seed_dummy_data()
