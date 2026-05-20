import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app.main import app
from app.model.auth_model import RefreshTokenRequest, UserLogin, UserRegister
from app.model.booking_model import AssignTechnicianRequest, BookingChecklistTaskUpdate, BookingCreate
from app.model.category_model import CategoryCreate
from app.model.location_model import LocationCreate
from app.model.service_model import ServiceCreate
from app.transport import auth, booking, category, location, service


class RouteFlowTests(unittest.TestCase):
    def test_expected_routes_are_registered(self):
        routes = {(route.path, tuple(sorted(route.methods))) for route in app.routes if hasattr(route, "methods")}
        expected = {
            ("/auth/register", ("POST",)),
            ("/auth/login", ("POST",)),
            ("/auth/me", ("GET",)),
            ("/categories/", ("GET",)),
            ("/categories/", ("POST",)),
            ("/services/", ("GET",)),
            ("/services/", ("POST",)),
            ("/packages/", ("GET",)),
            ("/bookings/", ("GET",)),
            ("/bookings/", ("POST",)),
            ("/location/", ("POST",)),
            ("/technicians", ("POST",)),
            ("/technicians/{technician_id}", ("DELETE",)),
            ("/customers/previous", ("GET",)),
            ("/notifications/admin/send", ("POST",)),
            ("/support/contact", ("POST",)),
        }

        for route in expected:
            self.assertIn(route, routes)

    def test_register_success(self):
        payload = UserRegister(
            full_name="Test User",
            email="test@example.com",
            password="secret12",
            phone_number="9999999999",
            role="customer",
        )

        with patch("app.transport.auth.user_logic.get_user_by_email", return_value=None), patch(
            "app.transport.auth.user_logic.create_user", return_value=101
        ):
            response = auth.register(payload, db=object())

        self.assertEqual(response["user_id"], 101)

    def test_register_duplicate_email_raises(self):
        payload = UserRegister(
            full_name="Test User",
            email="test@example.com",
            password="secret12",
            phone_number="9999999999",
            role="customer",
        )

        with patch("app.transport.auth.user_logic.get_user_by_email", return_value={"id": 1}):
            with self.assertRaises(HTTPException) as ctx:
                auth.register(payload, db=object())

        self.assertEqual(ctx.exception.status_code, 400)

    def test_login_success(self):
        payload = UserLogin(email="customer@example.com", password="secret12")

        with patch(
            "app.transport.auth.user_logic.get_user_by_email",
            return_value={
                "id": 7,
                "email": "customer@example.com",
                "password_hash": "hashed",
                "is_active": True,
                "role": "customer",
                "full_name": "Customer One",
            },
        ), patch("app.transport.auth.verify_password", return_value=True), patch(
            "app.transport.auth.create_access_token", return_value="jwt-token"
        ), patch("app.transport.auth.create_refresh_token", return_value="refresh-token"):
            response = auth.login(payload, db=object())

        self.assertEqual(response["access_token"], "jwt-token")
        self.assertEqual(response["refresh_token"], "refresh-token")
        self.assertEqual(response["role"], "customer")

    def test_refresh_session_returns_new_access_token(self):
        payload = RefreshTokenRequest(refresh_token="refresh-jwt")

        with patch("app.transport.auth.decode_refresh_token", return_value={"id": 7, "sub": "customer@example.com", "role": "customer"}), patch(
            "app.transport.auth.user_logic.get_user_by_id",
            return_value={
                "id": 7,
                "email": "customer@example.com",
                "role": "customer",
                "is_active": True,
                "full_name": "Customer One",
            },
        ), patch("app.transport.auth.create_access_token", return_value="new-jwt"), patch(
            "app.transport.auth.create_refresh_token", return_value="new-refresh-jwt"
        ):
            response = auth.refresh_access_token(payload, db=object())

        self.assertEqual(response["access_token"], "new-jwt")

    def test_me_returns_current_user(self):
        with patch(
            "app.transport.auth.user_logic.get_user_by_id",
            return_value={
                "id": 12,
                "full_name": "Tech One",
                "email": "tech@example.com",
                "phone_number": "12345",
                "role": "technician",
                "is_active": True,
            },
        ):
            response = auth.get_me(
                db=object(),
                current_user={"id": 12, "role": "technician", "email": "tech@example.com"},
            )

        self.assertEqual(response["role"], "technician")

    def test_category_create_requires_admin(self):
        payload = CategoryCreate(name="Cleaning", icon_url=None)

        with self.assertRaises(HTTPException) as ctx:
            category.create_category(
                payload,
                db=object(),
                current_user={"id": 4, "role": "customer", "email": "customer@example.com"},
            )

        self.assertEqual(ctx.exception.status_code, 403)

    def test_service_create_invalid_category(self):
        payload = ServiceCreate(
            category_id=999,
            name="Deep Clean",
            description="Full job",
            base_price=2000,
            duration_minutes=120,
        )

        with patch(
            "app.transport.service.service_logic.create_service",
            side_effect=ValueError("Category not found or inactive"),
        ):
            with self.assertRaises(HTTPException) as ctx:
                service.create_service(
                    payload,
                    db=object(),
                    current_user={"id": 1, "role": "admin", "email": "admin@example.com"},
                )

        self.assertEqual(ctx.exception.status_code, 400)

    def test_booking_create_uses_authenticated_customer(self):
        payload = BookingCreate(
            customer_id=999,
            service_id=10,
            package_id=2,
            scheduled_date="2026-04-10",
            scheduled_time_slot="09:00 AM",
            address_line="Flat 1",
            building_name="Tower A",
            floor_number="3",
            apartment_number="301",
            latitude=12.9,
            longitude=77.5,
            customer_notes="Please call on arrival",
        )

        captured = {}

        def fake_create_booking(_db, booking_payload, customer_id):
            captured["customer_id"] = customer_id
            captured["package_id"] = booking_payload.package_id
            return 301

        with patch("app.transport.booking.booking_logic.create_booking", side_effect=fake_create_booking):
            response = booking.create_booking(
                payload,
                db=object(),
                current_user={"id": 44, "role": "customer", "email": "customer@example.com"},
            )

        self.assertEqual(response["booking_id"], 301)
        self.assertEqual(captured["customer_id"], 44)
        self.assertEqual(captured["package_id"], 2)

    def test_assign_booking_requires_admin(self):
        payload = AssignTechnicianRequest(technician_id=8)

        with self.assertRaises(HTTPException) as ctx:
            booking.assign_booking(
                100,
                payload,
                db=object(),
                current_user={"id": 50, "role": "technician", "email": "tech@example.com"},
            )

        self.assertEqual(ctx.exception.status_code, 403)

    def test_update_booking_task_requires_technician(self):
        payload = BookingChecklistTaskUpdate(is_completed=True)

        with self.assertRaises(HTTPException) as ctx:
            booking.update_booking_task(
                100,
                5,
                payload,
                db=object(),
                current_user={"id": 2, "role": "customer", "email": "customer@example.com"},
            )

        self.assertEqual(ctx.exception.status_code, 403)

    def test_location_post_requires_assigned_technician(self):
        payload = LocationCreate(
            booking_id=11,
            latitude=12.91,
            longitude=77.61,
            accuracy=5.0,
        )

        with patch(
            "app.transport.location.get_booking_by_id",
            return_value={"id": 11, "technician_id": 99, "status": "assigned", "customer_id": 2},
        ):
            with self.assertRaises(HTTPException) as ctx:
                location.post_location(
                    payload,
                    conn=object(),
                    current_user={"id": 50, "role": "technician", "email": "tech@example.com"},
                )

        self.assertEqual(ctx.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
