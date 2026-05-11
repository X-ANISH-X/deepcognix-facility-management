from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime, timedelta

from app.init_db import init_db
from app.seed_dummy_data import (
    SeedUser,
    ensure_booking,
    ensure_booking_checklist,
    ensure_category,
    ensure_location,
    ensure_notification,
    ensure_service,
    ensure_user,
    get_connection,
    set_task_progress,
)


@dataclass
class SeedServicePackage:
    name: str
    price: float
    description: str
    service_ids: list[int]
    estimated_times: dict[str, str]
    is_active: bool = True


DEFAULT_PACKAGE_CHECKLISTS: dict[str, list[str]] = {
    "Silver": [
        "Dust furniture, shelves, and accessible surfaces",
        "Sweep and mop floors",
        "Clean kitchen countertop and sink",
        "Wipe cabinet exteriors",
        "Clean bathroom wash basin, mirror, and toilet",
        "Collect and dispose garbage",
        "Dust internal window sills and frames",
        "Clean door handles",
        "Sweep and mop balcony",
    ],
    "Gold": [
        "Dust furniture, shelves, and accessible surfaces",
        "Sweep and mop floors",
        "Clean kitchen countertop and sink",
        "Wipe cabinet exteriors",
        "Clean bathroom wash basin, mirror, and toilet",
        "Collect and dispose garbage",
        "Dust internal window sills and frames",
        "Clean door handles",
        "Sweep and mop balcony",
        "Deep clean kitchen cabinets inside and outside",
        "Degrease and clean kitchen wall tiles",
        "Clean exterior of microwave, fridge, and stove",
        "Deep clean bathroom tiles and shower area",
        "Polish glass and mirrors",
        "Vacuum sofas and cushions",
        "Detailed dusting of doors, frames, and wardrobe exteriors",
        "Clean interior-side window glass",
        "Deep clean and mop floors",
    ],
    "Platinum": [
        "Dust furniture, shelves, and accessible surfaces",
        "Sweep and mop floors",
        "Clean kitchen countertop and sink",
        "Wipe cabinet exteriors",
        "Clean bathroom wash basin, mirror, and toilet",
        "Collect and dispose garbage",
        "Dust internal window sills and frames",
        "Clean door handles",
        "Sweep and mop balcony",
        "Deep clean kitchen cabinets inside and outside",
        "Degrease and clean kitchen wall tiles",
        "Clean exterior of microwave, fridge, and stove",
        "Deep clean bathroom tiles and shower area",
        "Polish glass and mirrors",
        "Vacuum sofas and cushions",
        "Detailed dusting of doors, frames, and wardrobe exteriors",
        "Clean interior-side window glass",
        "Deep clean and mop floors",
        "Steam sanitize bathrooms and kitchen areas",
        "Deep vacuum carpets and sofas",
        "Vacuum clean mattress",
        "Clean behind accessible furniture",
        "Clean AC vents",
        "Interior window glass streak-free finish",
        "Wall spot cleaning for light stains",
        "Detailed wardrobe internal cleaning",
        "Interior fridge cleaning",
        "Premium floor polishing and shine restoration",
        "Pressure clean balcony where applicable",
    ],
}


def ensure_service_package_meta_table(cursor) -> None:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS service_package_meta (
            package_id INT PRIMARY KEY,
            service_ids_json LONGTEXT NOT NULL,
            estimated_times_json LONGTEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
        """
    )


def upsert_service_package_meta(
    cursor,
    package_id: int,
    service_ids: list[int],
    estimated_times: dict[str, str],
) -> None:
    ensure_service_package_meta_table(cursor)
    cursor.execute(
        """
        INSERT INTO service_package_meta (package_id, service_ids_json, estimated_times_json)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE
            service_ids_json = VALUES(service_ids_json),
            estimated_times_json = VALUES(estimated_times_json)
        """,
        (package_id, json.dumps(service_ids), json.dumps(estimated_times)),
    )


def ensure_package_checklist(cursor, package_id: int, tasks: list[str]) -> None:
    cursor.execute("DELETE FROM package_checklist WHERE package_id = %s", (package_id,))
    for index, task_name in enumerate(tasks, start=1):
        cursor.execute(
            """
            INSERT INTO package_checklist (package_id, task_name, order_index)
            VALUES (%s, %s, %s)
            """,
            (package_id, task_name, index),
        )


def ensure_booking_request(cursor, *, booking_id: int, requested_by: int, request_type: str, message: str) -> None:
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
                message = %s,
                reviewed_by = NULL,
                admin_notes = NULL,
                reviewed_at = NULL,
                status = 'pending'
            WHERE id = %s
            """,
            (requested_by, message, existing[0]),
        )
        return

    cursor.execute(
        """
        INSERT INTO booking_requests (booking_id, requested_by, request_type, message, status)
        VALUES (%s, %s, %s, %s, 'pending')
        """,
        (booking_id, requested_by, request_type, message),
    )


def ensure_package(cursor, package: SeedServicePackage) -> int:
    cursor.execute("SELECT id FROM packages WHERE name = %s", (package.name,))
    row = cursor.fetchone()
    if row:
        package_id = int(row[0])
        cursor.execute(
            """
            UPDATE packages
            SET price = %s,
                description = %s,
                is_active = %s
            WHERE id = %s
            """,
            (package.price, package.description, package.is_active, package_id),
        )
        return package_id

    cursor.execute(
        """
        INSERT INTO packages (name, price, description, is_active)
        VALUES (%s, %s, %s, %s)
        """,
        (package.name, package.price, package.description, package.is_active),
    )
    return int(cursor.lastrowid)


def set_booking_timestamp(cursor, booking_id: int, timestamp: datetime) -> None:
    cursor.execute(
        """
        UPDATE bookings
        SET created_at = %s,
            updated_at = %s
        WHERE id = %s
        """,
        (timestamp, timestamp, booking_id),
    )


def seed_admin_dashboard_data() -> None:
    init_db()

    conn = get_connection()
    cursor = conn.cursor(buffered=True)
    try:
        cursor.execute("DELETE FROM technician_live_locations")
        cursor.execute("DELETE FROM notifications")
        cursor.execute("DELETE FROM booking_checklist")
        cursor.execute("DELETE FROM bookings")
        cursor.execute("DELETE FROM package_checklist")
        cursor.execute("DELETE FROM service_package_meta")
        cursor.execute("DELETE FROM packages")
        cursor.execute("DELETE FROM services")
        cursor.execute("DELETE FROM categories")
        cursor.execute("DELETE FROM users")

        for table_name in [
            "technician_live_locations",
            "notifications",
            "booking_checklist",
            "bookings",
            "package_checklist",
            "service_package_meta",
            "packages",
            "services",
            "categories",
            "users",
        ]:
            cursor.execute(f"ALTER TABLE {table_name} AUTO_INCREMENT = 1")

        admin_id = ensure_user(
            cursor,
            SeedUser("Admin User", "sam@gmail.com", "9876500001", "admin", "test123"),
        )

        customer_ids = [
            ensure_user(cursor, SeedUser("Sam Customer", "sam234@gmail.com", "9876500002", "customer", "test123")),
            ensure_user(cursor, SeedUser("Aisha Malik", "aisha.dashboard@example.com", "9876500101", "customer", "test123")),
            ensure_user(cursor, SeedUser("Rohan Mehta", "rohan.dashboard@example.com", "9876500102", "customer", "test123")),
        ]

        technician_ids = [
            ensure_user(cursor, SeedUser("Samarth Vasisht", "sam123@gmail.com", "9876500003", "technician", "test123")),
            ensure_user(cursor, SeedUser("Neeraj Kumar", "neeraj.dashboard@example.com", "9876500201", "technician", "test123")),
            ensure_user(cursor, SeedUser("Kavya Sharma", "kavya.dashboard@example.com", "9876500202", "technician", "test123")),
            ensure_user(cursor, SeedUser("Farhan Ali", "farhan.dashboard@example.com", "9876500203", "technician", "test123")),
            ensure_user(cursor, SeedUser("Priyanka Das", "priyanka.dashboard@example.com", "9876500204", "technician", "test123")),
        ]

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
        hvac_category_id = ensure_category(
            cursor,
            "HVAC",
            "https://images.unsplash.com/photo-1581579185169-1b1bfa3d5d2f?auto=format&fit=crop&w=300&q=80",
        )
        security_category_id = ensure_category(
            cursor,
            "Security",
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80",
        )

        service_catalog = {
            "Home Deep Cleaning": ensure_service(
                cursor,
                category_id=cleaning_category_id,
                name="Home Deep Cleaning",
                description="Apartment and villa cleaning with package-based checklist execution.",
                base_price=999.00,
                duration_minutes=180,
            ),
            "Sofa & Upholstery Cleaning": ensure_service(
                cursor,
                category_id=cleaning_category_id,
                name="Sofa & Upholstery Cleaning",
                description="Fabric and upholstery focused cleaning for living room furniture.",
                base_price=799.00,
                duration_minutes=120,
            ),
            "AC Cleaning": ensure_service(
                cursor,
                category_id=hvac_category_id,
                name="AC Cleaning",
                description="Split and window AC cleaning with filter and coil service.",
                base_price=699.00,
                duration_minutes=90,
            ),
            "Plumbing Inspection": ensure_service(
                cursor,
                category_id=maintenance_category_id,
                name="Plumbing Inspection",
                description="Leak inspection and fixture health check.",
                base_price=549.00,
                duration_minutes=60,
            ),
            "Electrical Safety Check": ensure_service(
                cursor,
                category_id=maintenance_category_id,
                name="Electrical Safety Check",
                description="Outlet, switchboard, and load inspection.",
                base_price=649.00,
                duration_minutes=75,
            ),
            "CCTV & Access Control Check": ensure_service(
                cursor,
                category_id=security_category_id,
                name="CCTV & Access Control Check",
                description="Security system inspection and access panel verification.",
                base_price=899.00,
                duration_minutes=120,
            ),
        }

        silver_id = ensure_package(
            cursor,
            SeedServicePackage(
                name="Silver",
                price=999.00,
                description="Basic cleaning",
                service_ids=[service_catalog["Home Deep Cleaning"], service_catalog["Plumbing Inspection"]],
                estimated_times={"1BHK": "2h 15m", "2BHK": "2h 45m", "3BHK": "3h 15m"},
            ),
        )
        gold_id = ensure_package(
            cursor,
            SeedServicePackage(
                name="Gold",
                price=1999.00,
                description="Deep cleaning",
                service_ids=[service_catalog["Home Deep Cleaning"], service_catalog["Sofa & Upholstery Cleaning"], service_catalog["AC Cleaning"]],
                estimated_times={"1BHK": "3h 15m", "2BHK": "4h 00m", "3BHK": "4h 45m"},
            ),
        )
        platinum_id = ensure_package(
            cursor,
            SeedServicePackage(
                name="Platinum",
                price=2999.00,
                description="Premium cleaning",
                service_ids=[service_catalog["Home Deep Cleaning"], service_catalog["Sofa & Upholstery Cleaning"], service_catalog["AC Cleaning"], service_catalog["Electrical Safety Check"], service_catalog["CCTV & Access Control Check"]],
                estimated_times={"1BHK": "4h 30m", "2BHK": "5h 30m", "3BHK": "6h 45m"},
            ),
        )
        silver_price = 999.00
        gold_price = 1999.00
        platinum_price = 2999.00

        ensure_package_checklist(cursor, silver_id, DEFAULT_PACKAGE_CHECKLISTS["Silver"])
        ensure_package_checklist(cursor, gold_id, DEFAULT_PACKAGE_CHECKLISTS["Gold"])
        ensure_package_checklist(cursor, platinum_id, DEFAULT_PACKAGE_CHECKLISTS["Platinum"])

        move_out_refresh_id = ensure_package(
            cursor,
            SeedServicePackage(
                name="Move-Out Refresh",
                price=3499.00,
                description="High-touch package for full apartment turnover and handover prep.",
                service_ids=[
                    service_catalog["Home Deep Cleaning"],
                    service_catalog["Sofa & Upholstery Cleaning"],
                    service_catalog["Electrical Safety Check"],
                ],
                estimated_times={
                    "1BHK": "4h 30m",
                    "2BHK": "5h 30m",
                    "3BHK": "6h 30m",
                },
            ),
        )

        upsert_service_package_meta(cursor, silver_id, [service_catalog["Home Deep Cleaning"], service_catalog["Plumbing Inspection"]], {"1BHK": "2h 15m", "2BHK": "2h 45m", "3BHK": "3h 15m"})
        upsert_service_package_meta(cursor, gold_id, [service_catalog["Home Deep Cleaning"], service_catalog["Sofa & Upholstery Cleaning"], service_catalog["AC Cleaning"]], {"1BHK": "3h 15m", "2BHK": "4h 00m", "3BHK": "4h 45m"})
        upsert_service_package_meta(cursor, platinum_id, [service_catalog["Home Deep Cleaning"], service_catalog["Sofa & Upholstery Cleaning"], service_catalog["AC Cleaning"], service_catalog["Electrical Safety Check"], service_catalog["CCTV & Access Control Check"]], {"1BHK": "4h 30m", "2BHK": "5h 30m", "3BHK": "6h 45m"})
        upsert_service_package_meta(cursor, move_out_refresh_id, [service_catalog["Home Deep Cleaning"], service_catalog["AC Cleaning"], service_catalog["Electrical Safety Check"]], {"1BHK": "4h", "2BHK": "5h", "3BHK": "6h"})

        today = date.today()
        booking_specs = [
            {
                "customer_id": customer_ids[0],
                "service_id": service_catalog["Home Deep Cleaning"],
                "package_id": gold_id,
                "technician_id": technician_ids[0],
                "status": "completed",
                "final_price": gold_price,
                "scheduled_date": today - timedelta(days=6),
                "scheduled_time_slot": "09:00 AM",
                "address_line": "Flat 402, Maple Residency, Sector 62",
                "building_name": "Maple Residency",
                "floor_number": "4",
                "apartment_number": "402",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "customer_notes": "Ring the bell once and call if needed.",
                "technician_notes": "Finished on time.",
                "completed_tasks": 9,
            },
            {
                "customer_id": customer_ids[1],
                "service_id": service_catalog["Sofa & Upholstery Cleaning"],
                "package_id": silver_id,
                "technician_id": technician_ids[1],
                "status": "completed",
                "final_price": silver_price,
                "scheduled_date": today - timedelta(days=5),
                "scheduled_time_slot": "11:00 AM",
                "address_line": "Tower B, Riverfront Heights, Indiranagar",
                "building_name": "Riverfront Heights",
                "floor_number": "12",
                "apartment_number": "1203",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "customer_notes": "Parking available in visitor slot B12.",
                "technician_notes": "Customer requested quick turnaround.",
                "completed_tasks": 6,
            },
            {
                "customer_id": customer_ids[2],
                "service_id": service_catalog["AC Cleaning"],
                "package_id": silver_id,
                "technician_id": technician_ids[2],
                "status": "in_progress",
                "final_price": silver_price,
                "scheduled_date": today - timedelta(days=4),
                "scheduled_time_slot": "01:00 PM",
                "address_line": "House 17, Palm Grove Villas",
                "building_name": "Palm Grove Villas",
                "floor_number": "Ground",
                "apartment_number": "17",
                "latitude": 19.0760,
                "longitude": 72.8777,
                "customer_notes": "Pet dog at home, please keep door closed.",
                "technician_notes": "AC filters cleaned.",
                "completed_tasks": 5,
            },
            {
                "customer_id": customer_ids[0],
                "service_id": service_catalog["Electrical Safety Check"],
                "package_id": move_out_refresh_id,
                "technician_id": technician_ids[3],
                "status": "assigned",
                "final_price": 3499.00,
                "scheduled_date": today - timedelta(days=3),
                "scheduled_time_slot": "03:00 PM",
                "address_line": "Flat 803, Skyview Apartments",
                "building_name": "Skyview Apartments",
                "floor_number": "8",
                "apartment_number": "803",
                "latitude": 17.3850,
                "longitude": 78.4867,
                "customer_notes": "Service the bedroom AC first.",
                "technician_notes": "Progressing through package checklist.",
                "completed_tasks": 4,
            },
            {
                "customer_id": customer_ids[1],
                "service_id": service_catalog["Plumbing Inspection"],
                "package_id": gold_id,
                "technician_id": technician_ids[4],
                "status": "approved",
                "final_price": gold_price,
                "scheduled_date": today - timedelta(days=2),
                "scheduled_time_slot": "05:00 PM",
                "address_line": "Flat 903, Blue Cedar Heights",
                "building_name": "Blue Cedar Heights",
                "floor_number": "9",
                "apartment_number": "903",
                "latitude": 22.5726,
                "longitude": 88.3639,
                "customer_notes": "Awaiting technician assignment.",
                "technician_notes": "Queued for evening slot.",
                "completed_tasks": 0,
            },
            {
                "customer_id": customer_ids[2],
                "service_id": service_catalog["CCTV & Access Control Check"],
                "package_id": platinum_id,
                "technician_id": None,
                "status": "submitted",
                "final_price": platinum_price,
                "scheduled_date": today - timedelta(days=1),
                "scheduled_time_slot": "09:00 AM",
                "address_line": "Skyline Residency, Block C",
                "building_name": "Skyline Residency",
                "floor_number": "11",
                "apartment_number": "1102",
                "latitude": 25.2048,
                "longitude": 55.2708,
                "customer_notes": "Awaiting approval for next week.",
                "technician_notes": None,
                "completed_tasks": 0,
            },
            {
                "customer_id": customer_ids[0],
                "service_id": service_catalog["Home Deep Cleaning"],
                "package_id": move_out_refresh_id,
                "technician_id": technician_ids[2],
                "status": "customer_review_pending",
                "final_price": 3499.00,
                "scheduled_date": today,
                "scheduled_time_slot": "11:00 AM",
                "address_line": "Garden View Towers, Unit 1604",
                "building_name": "Garden View Towers",
                "floor_number": "16",
                "apartment_number": "1604",
                "latitude": 23.8103,
                "longitude": 90.4125,
                "customer_notes": "Please focus on kitchen and bathrooms.",
                "technician_notes": "Completion awaiting customer review.",
                "completed_tasks": 10,
            },
            {
                "customer_id": customer_ids[1],
                "service_id": service_catalog["AC Cleaning"],
                "package_id": silver_id,
                "technician_id": technician_ids[4],
                "status": "rejection_requested",
                "final_price": silver_price,
                "scheduled_date": today + timedelta(days=1),
                "scheduled_time_slot": "01:00 PM",
                "address_line": "Orchid Park, Block A",
                "building_name": "Orchid Park",
                "floor_number": "6",
                "apartment_number": "601",
                "latitude": 13.0827,
                "longitude": 80.2707,
                "customer_notes": "Customer requested status review before finalization.",
                "technician_notes": "Rejection requested for minor billing adjustment.",
                "completed_tasks": 2,
            },
        ]

        booking_ids: list[int] = []
        for index, item in enumerate(booking_specs):
            completed_tasks = item.pop("completed_tasks")
            booking_id = ensure_booking(cursor, **item)
            ensure_booking_checklist(cursor, booking_id, item["package_id"])

            if item["status"] == "completed":
                set_task_progress(cursor, booking_id, complete_all=True)
            else:
                set_task_progress(cursor, booking_id, completed_count=completed_tasks)

            timestamp = datetime.combine(item["scheduled_date"], datetime.min.time()) + timedelta(hours=9 + index)
            set_booking_timestamp(cursor, booking_id, timestamp)
            booking_ids.append(booking_id)

        ensure_notification(cursor, admin_id, "Two bookings are waiting for approval and assignment.", False, "Booking Awaiting Assignment", "booking_submitted")
        ensure_notification(cursor, admin_id, "One technician requested completion approval.", False, "Completion Approval Needed", "admin_review_pending")
        ensure_notification(cursor, admin_id, "One customer requested a booking rejection review.", False, "Rejection Review Needed", "rejection_requested")
        ensure_notification(cursor, technician_ids[0], "New assignment: Gold package cleaning at Maple Residency.", False, "New Job Assigned", "job_assigned")
        ensure_notification(cursor, technician_ids[2], "Your booking completion request is pending admin review.", False, "Completion Request Sent", "admin_review_pending")
        ensure_notification(cursor, technician_ids[4], "Your booking is pending review for rejection approval.", False, "Rejection Review Sent", "rejection_requested")
        ensure_notification(cursor, customer_ids[0], "Your technician started the service and checklist is in progress.", False, "Technician Started Job", "job_started")
        ensure_notification(cursor, admin_id, "Commercial support request from Sam Customer needs a callback.", False, "Support Request Received", "support_contact")

        ensure_booking_request(
            cursor,
            booking_id=booking_ids[6],
            requested_by=technician_ids[2],
            request_type="completion",
            message="Technician marked the booking as complete and is awaiting customer approval.",
        )
        ensure_booking_request(
            cursor,
            booking_id=booking_ids[7],
            requested_by=technician_ids[4],
            request_type="rejection",
            message="Technician requested rejection approval for a billing adjustment.",
        )

        # Add live locations for all technicians ensuring they all appear with badges on map
        # Samarth Vasisht - multiple updates showing movement
        ensure_location(cursor, booking_ids[0], technician_ids[0], 28.6140, 77.2091, 7.2)
        ensure_location(cursor, booking_ids[0], technician_ids[0], 28.6139, 77.2089, 6.5)
        
        # Neeraj Kumar - multiple updates showing movement  
        ensure_location(cursor, booking_ids[1], technician_ids[1], 12.9717, 77.5947, 6.8)
        ensure_location(cursor, booking_ids[1], technician_ids[1], 12.9716, 77.5945, 5.9)
        
        # Kavya Sharma - on-site with multiple updates
        ensure_location(cursor, booking_ids[2], technician_ids[2], 19.0761, 72.8778, 6.7)
        ensure_location(cursor, booking_ids[2], technician_ids[2], 19.0762, 72.8780, 5.1)
        ensure_location(cursor, booking_ids[2], technician_ids[2], 19.0763, 72.8781, 4.8)
        
        # Farhan Ali - en-route with multiple updates
        ensure_location(cursor, booking_ids[3], technician_ids[3], 17.3852, 78.4870, 6.4)
        ensure_location(cursor, booking_ids[3], technician_ids[3], 17.3854, 78.4872, 5.6)
        ensure_location(cursor, booking_ids[3], technician_ids[3], 17.3856, 78.4874, 5.2)
        
        # Priyanka Das - assigned with multiple updates
        ensure_location(cursor, booking_ids[4], technician_ids[4], 22.5727, 88.3640, 5.5)
        ensure_location(cursor, booking_ids[4], technician_ids[4], 22.5728, 88.3641, 5.1)
        ensure_location(cursor, booking_ids[5], technician_ids[4], 23.8104, 90.4127, 4.9)

        conn.commit()

        print("Admin dashboard seed completed successfully.")
        print("")
        print("Primary login credentials:")
        print("  Admin      -> sam@gmail.com / test123")
        print("  Customer   -> sam234@gmail.com / test123")
        print("  Technician -> sam123@gmail.com / test123")
        print("")
        print("Seeded dashboard data includes:")
        print("  - Five technicians")
        print("  - Multiple bookings across submitted, approved, assigned, in-progress, customer-review-pending, completed, and rejection-requested states")
        print("  - Service-package metadata for Silver, Gold, Platinum, and Move-Out Refresh")
        print("  - Booking request rows for completion and rejection review flows")
        print("  - Notifications and live technician locations")
        print("  - Enough data for charts, sidebar lists, and technician map testing")
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    seed_admin_dashboard_data()
