import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../services/api_client.dart';

class BookingController extends GetxController {
  final ApiClient _api = ApiClient();

  // ================= CORE =================
  final bookingId = 0.obs;
  final serviceId = 1.obs;
  final packageId = 0.obs;
  final price = 0.0.obs;

  final selectedDate = "".obs;
  final selectedTime = "".obs;
  final selectedAddress = "".obs;

  final selectedLat = 12.9716.obs;
  final selectedLng = 77.5946.obs;

  // ================= STATUS =================
  final bookingStatus = "submitted".obs;
  final isPolling = false.obs;

  // ================= TECHNICIAN =================
  final technicianName = "".obs;
  final technicianPhone = "".obs;
  final technicianRating = "".obs;

  final technicianLat = 0.0.obs;
  final technicianLng = 0.0.obs;

  // ================= ADDRESS =================
  final addresses = <String>[].obs;

  void addAddress(String address) {
    if (!addresses.contains(address)) {
      addresses.add(address);
    }
  }

  // ================= CHECKLIST =================
  final checklist = <String>[
    "Dusting",
    "Mopping",
    "Kitchen Cleaning",
    "Bathroom Cleaning",
  ].obs;

  final completedTasks = <String>[].obs;

  double get progress =>
      checklist.isEmpty ? 0 : completedTasks.length / checklist.length;

  void toggleTask(String task) {
    if (completedTasks.contains(task)) {
      completedTasks.remove(task);
    } else {
      completedTasks.add(task);
    }
  }

  Future<void> markServiceCompleted() async {
    await completeBooking();
  }

  // ================= SLOTS =================
  final availableSlots = <String>[].obs;

  void loadSlotsForDate(DateTime date) {
    availableSlots.value = [
      "09:00 AM",
      "11:00 AM",
      "01:00 PM",
      "03:00 PM",
      "05:00 PM",
    ];
  }

  // ================= TIME FIX (THE REAL HERO) =================
  String normalizeTime(String slotLabel) {
    final dt = DateFormat.jm().parse(slotLabel); // 09:00 AM
    return DateFormat.Hms().format(dt); // 09:00:00
  }

  // ================= CREATE BOOKING =================
  Future<void> createBooking() async {
    try {
      if (packageId.value == 0) throw Exception("Select a package");
      if (selectedAddress.value.isEmpty) throw Exception("Enter address");
      if (selectedDate.value.isEmpty || selectedTime.value.isEmpty) {
        throw Exception("Select date & time");
      }

      final body = {
        "customer_id": 1,
        "service_id": serviceId.value,
        "package_id": packageId.value,

        // ✅ CORRECT FIELDS
        "scheduled_date": selectedDate.value,
        "scheduled_time_slot": normalizeTime(selectedTime.value),

        "address_line": selectedAddress.value,

        // required fillers
        "building_name": "",
        "floor_number": "",
        "apartment_number": "",

        "latitude": selectedLat.value,
        "longitude": selectedLng.value,

        "final_price": price.value,
      };

      debugPrint("🚀 FINAL BODY → $body");

      final res = await _api.post("/bookings", body);

      final id = res["id"] ?? res["booking_id"];
      bookingId.value = id is int ? id : int.parse(id.toString());

      bookingStatus.value = "submitted";

      startPolling();

    } catch (e) {
      debugPrint("❌ ERROR → $e");
      Get.snackbar("Booking Failed", e.toString());
    }
  }

  // ================= STATUS =================
  Future<void> fetchStatus() async {
    try {
      final res = await _api.get("/bookings/${bookingId.value}");

      bookingStatus.value = res["status"] ?? "";

      final tech = res["technician"];
      if (tech != null) {
        technicianName.value = tech["name"] ?? "";
        technicianPhone.value = tech["phone"] ?? "";
        technicianRating.value = tech["rating"]?.toString() ?? "";
      }
    } catch (e) {
      debugPrint("STATUS ERROR → $e");
    }
  }

  // ================= ACTIONS =================
  Future<void> approveArrival() async {
    await _api.post("/bookings/${bookingId.value}/start", {});
    bookingStatus.value = "in_progress";
  }

  Future<void> completeBooking() async {
    await _api.post("/bookings/${bookingId.value}/complete", {});
    bookingStatus.value = "completed";
  }

  // ================= POLLING =================
  Timer? pollingTimer;

  void startPolling() {
    if (bookingId.value == 0) return;

    isPolling.value = true;

    pollingTimer?.cancel();

    pollingTimer = Timer.periodic(
      const Duration(seconds: 5),
      (_) async {
        await fetchStatus();
      },
    );
  }

  @override
  void onClose() {
    pollingTimer?.cancel();
    super.onClose();
  }
}