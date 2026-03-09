import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:user_a/src/services/api_client.dart';

class BookingController extends GetxController {

  final ApiClient _api = ApiClient();

  /// ---------------------------
  /// BOOKING STATUS
  /// ---------------------------

  final bookingStatus = "requested".obs;
  final bookingId = "".obs;

  void updateBookingStatus(String status) {
    bookingStatus.value = status;
    debugPrint("Booking status → $status");
  }

  /// ---------------------------
  /// BOOKING META
  /// ---------------------------

  final packageId = "".obs;
  final serviceId = "".obs;
  final price = 0.0.obs;

  /// ---------------------------
  /// DATE / TIME
  /// ---------------------------

  final selectedDate = "".obs;
  final selectedTime = "".obs;

  final availableSlots = <String>[].obs;
  final isLoadingSlots = false.obs;

  /// ---------------------------
  /// ADDRESS
  /// ---------------------------

  final selectedAddress = "".obs;
  final selectedLat = 0.0.obs;
  final selectedLng = 0.0.obs;

  final addresses = <String>[].obs;

  void addAddress(String address) {
    addresses.add(address);
  }

  /// ---------------------------
  /// TECHNICIAN
  /// ---------------------------

  final technicianName = "".obs;
  final technicianRating = "".obs;

  final technicianLat = 0.0.obs;
  final technicianLng = 0.0.obs;

  /// ---------------------------
  /// CHECKLIST SYSTEM
  /// ---------------------------

  final checklist = <String>[
    "Dusting",
    "Vacuum Cleaning",
    "Mopping",
    "Bathroom Cleaning",
    "Kitchen Cleaning",
  ].obs;

  final completedTasks = <String>[].obs;

  double get progress {
    if (checklist.isEmpty) return 0;
    return completedTasks.length / checklist.length;
  }

  void toggleTask(String task) {
    if (completedTasks.contains(task)) {
      completedTasks.remove(task);
    } else {
      completedTasks.add(task);
    }
  }

  /// compatibility method used by checklist screens
  void markServiceCompleted() {
    completeBooking();
  }

  /// ---------------------------
  /// CREATE BOOKING (API)
  /// ---------------------------

  Future<void> createBooking() async {

    try {

      final response = await _api.post("/bookings", {
        "service_id": serviceId.value,
        "package_id": packageId.value,
        "date": selectedDate.value,
        "time": selectedTime.value,
        "address": selectedAddress.value,
        "lat": selectedLat.value,
        "lng": selectedLng.value,
        "price": price.value,
      });

      bookingId.value = response["booking_id"].toString();

      updateBookingStatus("requested");

      /// start polling backend for updates
      startBookingStatusPolling();

    } catch (e) {

      Get.snackbar("Booking Failed", e.toString());

    }
  }

  /// ---------------------------
  /// APPROVE ARRIVAL
  /// ---------------------------

  Future<void> approveArrival() async {

    try {

      await _api.post("/bookings/${bookingId.value}/start", {});

      updateBookingStatus("in_progress");

    } catch (e) {
      Get.snackbar("Error", e.toString());
    }
  }

  /// ---------------------------
  /// COMPLETE BOOKING
  /// ---------------------------

  Future<void> completeBooking() async {

    try {

      await _api.post("/bookings/${bookingId.value}/complete", {});

      updateBookingStatus("payment_pending");

    } catch (e) {
      Get.snackbar("Error", e.toString());
    }
  }

  /// ---------------------------
  /// TIME SLOTS
  /// ---------------------------

  void loadSlotsForDate(DateTime date) {

    isLoadingSlots.value = true;

    Future.delayed(const Duration(milliseconds: 500), () {

      availableSlots.value = [
        "09:00 AM",
        "11:00 AM",
        "01:00 PM",
        "03:00 PM",
        "05:00 PM",
      ];

      isLoadingSlots.value = false;

    });
  }

  /// ---------------------------
  /// POLLING BOOKING STATUS
  /// ---------------------------

  Timer? pollingTimer;

  void startBookingStatusPolling() {

    pollingTimer?.cancel();

    pollingTimer = Timer.periodic(
      const Duration(seconds: 5),
      (timer) async {

        await fetchBookingStatus();

        if (bookingStatus.value == "completed") {
          timer.cancel();
        }
      },
    );
  }

  /// ---------------------------
  /// FETCH BOOKING STATUS
  /// ---------------------------

  Future<void> fetchBookingStatus() async {

    try {

      final response = await _api.get(
        "/bookings/${bookingId.value}"
      );

      updateBookingStatus(response["status"]);

      if (response["technician"] != null) {

        technicianName.value =
            response["technician"]["name"] ?? "";

        technicianRating.value =
            response["technician"]["rating"]
                ?.toString() ?? "";

      }

      /// fetch technician location
      await fetchTechnicianLocation();

    } catch (e) {

      debugPrint("Status polling error → $e");

    }
  }

  /// ---------------------------
  /// TECHNICIAN LOCATION
  /// ---------------------------

  Future<void> fetchTechnicianLocation() async {

    try {

      final response = await _api.get(
        "/location/${bookingId.value}"
      );

      technicianLat.value = response["lat"] ?? 0.0;
      technicianLng.value = response["lng"] ?? 0.0;

    } catch (_) {}
  }

  @override
  void onClose() {
    pollingTimer?.cancel();
    super.onClose();
  }
}