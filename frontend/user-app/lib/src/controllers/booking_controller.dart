import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:get/get.dart';

import '../services/api_client.dart';

class BookingController extends GetxController {

  final ApiClient _api =
      ApiClient();

  // =========================================================
  // CORE BOOKING DATA
  // =========================================================
  final bookingId = 0.obs;

  final serviceId = 0.obs;

  final packageId = 0.obs;

  final price = 0.0.obs;

  // =========================================================
  // LOADING
  // =========================================================
  final isCreatingBooking =
      false.obs;

  // =========================================================
  // DATE & TIME
  // =========================================================
  final selectedDate =
      "".obs;

  final selectedTime =
      "".obs;

  // =========================================================
  // ADDRESS
  // =========================================================
  final selectedAddress =
      "".obs;

  final buildingName =
      "".obs;

  final floorNumber =
      "".obs;

  final apartmentNumber =
      "".obs;

  final selectedLat =
      0.0.obs;

  final selectedLng =
      0.0.obs;

  // =========================================================
  // NOTES
  // =========================================================
  final specialInstructions =
      "".obs;

  final preferredTechnician =
      "".obs;

  final parkingInstructions =
      "".obs;

  final petWarning =
      "".obs;

  final callBeforeArrival =
      false.obs;

  // =========================================================
  // STATUS
  // =========================================================
  final bookingStatus =
      "submitted".obs;

  final isPolling =
      false.obs;

  // =========================================================
  // ETA
  // =========================================================
  final estimatedArrivalMinutes =
      45.obs;

  final estimatedCompletionMinutes =
      180.obs;

  // =========================================================
  // TECHNICIAN
  // =========================================================
  final technicianName =
      "".obs;

  final technicianPhone =
      "".obs;

  final technicianRating =
      "".obs;

  // =========================================================
  // CHECKLIST
  // =========================================================
  final checklist =
      <String>[].obs;

  final completedTasks =
      <String>[].obs;

  double get progress {

    if (checklist.isEmpty) {
      return 0;
    }

    return completedTasks.length /
        checklist.length;
  }

  // =========================================================
  // ADDONS
  // =========================================================
  final addOns = [

    {
      "name":
          "Carpet Shampoo Cleaning",

      "price": 200.0,
    },

    {
      "name":
          "Curtain Cleaning",

      "price": 250.0,
    },

    {
      "name":
          "Sofa Shampoo Cleaning",

      "price": 300.0,
    },

    {
      "name":
          "Refrigerator Deep Cleaning",

      "price": 180.0,
    },

    {
      "name":
          "Oven Deep Cleaning",

      "price": 220.0,
    },

    {
      "name":
          "AC Duct Cleaning Coordination",

      "price": 400.0,
    },

    {
      "name":
          "Disinfection & Sanitization",

      "price": 350.0,
    },

  ].obs;

  final selectedAddOns =
      <Map<String, dynamic>>[]
          .obs;

  // =========================================================
  // TOGGLE ADDON
  // =========================================================
  void toggleAddOn(
    Map<String, dynamic> addon,
  ) {

    final exists =
        selectedAddOns.any(
      (a) =>
          a["name"] ==
          addon["name"],
    );

    final addonPrice =
        (addon["price"] ?? 0)
            .toDouble();

    if (exists) {

      selectedAddOns.removeWhere(
        (a) =>
            a["name"] ==
            addon["name"],
      );

      price.value -= addonPrice;

    } else {

      selectedAddOns.add(addon);

      price.value += addonPrice;
    }
  }

  // =========================================================
  // AVAILABLE SLOTS
  // =========================================================
  final availableSlots =
      <String>[].obs;

  void loadSlotsForDate(
    DateTime date,
  ) {

    availableSlots.value = [

      "09:00 AM",

      "11:00 AM",

      "01:00 PM",

      "03:00 PM",

      "05:00 PM",
    ];
  }

  // =========================================================
  // VALIDATION
  // =========================================================
  String? validateBooking() {

    if (serviceId.value <= 0) {
      return "Invalid service selected";
    }

    if (packageId.value <= 0) {
      return "Please select a package";
    }

    if (selectedAddress
        .value
        .trim()
        .isEmpty) {

      return "Please enter address";
    }

    if (selectedDate
        .value
        .isEmpty) {

      return "Please select booking date";
    }

    if (selectedTime
        .value
        .isEmpty) {

      return "Please select time slot";
    }

    return null;
  }

  // =========================================================
  // STATUS MAPPING
  // =========================================================
  String mapStatus(
    String status,
  ) {

    return status
        .trim()
        .toLowerCase();
  }

  // =========================================================
  // NORMALIZE TIME
  // =========================================================
  String normalizeTime(
    String slotLabel,
  ) {

    return slotLabel
        .trim()
        .toUpperCase();
  }

  // =========================================================
  // CREATE BOOKING
  // =========================================================
  Future<bool>
      createBooking() async {

    if (isCreatingBooking.value) {
      return false;
    }

    final validationError =
        validateBooking();

    if (validationError !=
        null) {

      Get.snackbar(
        "Validation Error",
        validationError,
      );

      return false;
    }

    try {

      isCreatingBooking.value =
          true;

      final body = {

        "service_id":
            serviceId.value,

        "package_id":
            packageId.value,

        "scheduled_date":
            selectedDate.value,

        "scheduled_time_slot":
            normalizeTime(
          selectedTime.value,
        ),

        "address_line":
            selectedAddress.value,

        "building_name":
            buildingName.value
                    .trim()
                    .isEmpty
                ? "-"
                : buildingName.value,

        "floor_number":
            floorNumber.value
                    .trim()
                    .isEmpty
                ? "-"
                : floorNumber.value,

        "apartment_number":
            apartmentNumber.value
                    .trim()
                    .isEmpty
                ? "-"
                : apartmentNumber.value,

        "latitude":
            selectedLat.value,

        "longitude":
            selectedLng.value,

        "customer_notes":
            specialInstructions
                    .value
                    .trim()
                    .isEmpty
                ? "-"
                : specialInstructions.value,
      };

      debugPrint(
        "BOOKING PAYLOAD => $body",
      );

      final res =
          await _api.post(
        "/bookings/",
        body,
      );

      debugPrint(
        "BOOKING RESPONSE => $res",
      );

      if (res == null ||
          res is! Map) {

        throw Exception(
          "Invalid booking response",
        );
      }

      final dynamic id =
          res["booking_id"] ??
              res["id"];

      if (id == null) {

        throw Exception(
          "Booking ID missing",
        );
      }

      bookingId.value =
          int.tryParse(
                id.toString(),
              ) ??
              0;

      debugPrint(
        "BOOKING ID SAVED => ${bookingId.value}",
      );

      if (bookingId.value <=
          0) {

        throw Exception(
          "Invalid booking ID",
        );
      }

      bookingStatus.value =
          "submitted";

      startPolling();

      return true;

    } catch (e) {

      debugPrint(
        "BOOKING ERROR → $e",
      );

      Get.snackbar(
        "Booking Failed",
        e.toString(),
      );

      return false;

    } finally {

      isCreatingBooking.value =
          false;
    }
  }

  // =========================================================
  // FETCH STATUS
  // =========================================================
  Future<void>
      fetchStatus() async {

    try {

      if (bookingId.value <=
          0) {

        debugPrint(
          "POLLING STOPPED: INVALID BOOKING ID",
        );

        return;
      }

      debugPrint(
        "POLLING BOOKING ID => ${bookingId.value}",
      );

      final res =
          await _api.get(
        "/bookings/${bookingId.value}",
      );

      debugPrint(
        "POLL RESPONSE => $res",
      );

      if (res == null ||
          res is! Map) {

        debugPrint(
          "INVALID POLL RESPONSE",
        );

        return;
      }

      final rawStatus =
          (res["status"] ?? "")
              .toString();

      debugPrint(
        "RAW STATUS => $rawStatus",
      );

      bookingStatus.value =
          mapStatus(
        rawStatus,
      );

      debugPrint(
        "UPDATED STATUS => ${bookingStatus.value}",
      );

    } catch (e) {

      debugPrint(
        "FETCH STATUS ERROR → $e",
      );
    }
  }

  // =========================================================
  // ARRIVAL APPROVAL
  // =========================================================
  Future<void>
  approveArrival() async {

    if (bookingId.value <= 0) {
      return;
    }

    try {

      await _api.post(
        "/bookings/${bookingId.value}/start",
        {},
      );

      bookingStatus.value =
          "in_progress";

    } catch (e) {

      debugPrint(
        "ARRIVAL APPROVAL ERROR → $e",
      );
    }
  }

  // =========================================================
  // APPROVE WORK
  // =========================================================
  Future<void>
  approveWork() async {

    if (bookingId.value <= 0) {
      return;
    }

    try {

      await _api.post(
        "/bookings/${bookingId.value}/approve",
        {},
      );

      bookingStatus.value =
          "completed";

    } catch (e) {

      debugPrint(
        "APPROVE WORK ERROR → $e",
      );
    }
  }

  // =========================================================
  // REQUEST REWORK
  // =========================================================
  Future<void>
  requestRework(
    String reason,
  ) async {

    if (bookingId.value <= 0) {
      return;
    }

    try {

      await _api.post(
        "/bookings/${bookingId.value}/rework",
        {
          "reason": reason,
        },
      );

      bookingStatus.value =
          "rework_requested";

    } catch (e) {

      debugPrint(
        "REWORK ERROR → $e",
      );
    }
  }

  // =========================================================
  // POLLING
  // =========================================================
  Timer? pollingTimer;

  void startPolling() {

    if (bookingId.value <=
        0) {

      debugPrint(
        "POLLING NOT STARTED: INVALID ID",
      );

      return;
    }

    if (isPolling.value) {

      debugPrint(
        "POLLING ALREADY RUNNING",
      );

      return;
    }

    debugPrint(
      "STARTING POLLING FOR BOOKING ${bookingId.value}",
    );

    isPolling.value = true;

    pollingTimer?.cancel();

    fetchStatus();

    pollingTimer = Timer.periodic(
      const Duration(
        seconds: 5,
      ),

      (_) async {

        await fetchStatus();
      },
    );
  }

  void stopPolling() {

    pollingTimer?.cancel();

    isPolling.value = false;
  }

  @override
  void onClose() {

    stopPolling();

    super.onClose();
  }
}