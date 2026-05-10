import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:get/get.dart';

import '../services/api_client.dart';

class BookingController extends GetxController {
  final ApiClient _api = ApiClient();

  final bookingId = 0.obs;
  final serviceId = 0.obs;
  final packageId = 0.obs;
  final price = 0.0.obs;

  final isCreatingBooking = false.obs;

  final selectedDate = "".obs;
  final selectedTime = "".obs;

  final selectedAddress = "".obs;
  final buildingName = "".obs;
  final floorNumber = "".obs;
  final apartmentNumber = "".obs;
  final selectedLat = 0.0.obs;
  final selectedLng = 0.0.obs;

  final specialInstructions = "".obs;
  final preferredTechnician = "".obs;
  final parkingInstructions = "".obs;
  final petWarning = "".obs;
  final callBeforeArrival = false.obs;

  final bookingStatus = "submitted".obs;
  final isPolling = false.obs;
  final activePollingBookingId = 0.obs;

  final estimatedArrivalMinutes = 45.obs;
  final estimatedCompletionMinutes = 180.obs;

  final technicianName = "".obs;
  final technicianPhone = "".obs;
  final technicianRating = "".obs;

  final checklist = <String>[].obs;
  final completedTasks = <String>[].obs;

  final addOns = [
    {
      "name": "Carpet Shampoo Cleaning",
      "price": 200.0,
    },
    {
      "name": "Curtain Cleaning",
      "price": 250.0,
    },
    {
      "name": "Sofa Shampoo Cleaning",
      "price": 300.0,
    },
    {
      "name": "Refrigerator Deep Cleaning",
      "price": 180.0,
    },
    {
      "name": "Oven Deep Cleaning",
      "price": 220.0,
    },
    {
      "name": "AC Duct Cleaning Coordination",
      "price": 400.0,
    },
    {
      "name": "Disinfection & Sanitization",
      "price": 350.0,
    },
  ].obs;

  final selectedAddOns = <Map<String, dynamic>>[].obs;

  Timer? pollingTimer;

  int bookingIdFromArgs(dynamic args) {
    if (args is Map) {
      final dynamic candidate = args['bookingId'] ?? args['booking_id'] ?? args['id'];
      return int.tryParse(candidate?.toString() ?? '') ?? 0;
    }
    return int.tryParse(args?.toString() ?? '') ?? 0;
  }

  bool prepareTrackingBooking(dynamic args) {
    final resolvedId = bookingIdFromArgs(args);
    if (resolvedId <= 0) {
      return bookingId.value > 0;
    }

    if (bookingId.value != resolvedId) {
      stopPolling();
      checklist.clear();
      completedTasks.clear();
    }

    bookingId.value = resolvedId;
    return true;
  }

  double get progress {
    if (checklist.isEmpty) {
      return 0;
    }
    return completedTasks.length / checklist.length;
  }

  void toggleAddOn(Map<String, dynamic> addon) {
    final exists = selectedAddOns.any((a) => a["name"] == addon["name"]);
    final addonPrice = (addon["price"] ?? 0).toDouble();

    if (exists) {
      selectedAddOns.removeWhere((a) => a["name"] == addon["name"]);
      price.value -= addonPrice;
    } else {
      selectedAddOns.add(addon);
      price.value += addonPrice;
    }
  }

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

  String? validateBooking() {
    if (serviceId.value <= 0) {
      return "Invalid service selected";
    }
    if (packageId.value <= 0) {
      return "Please select a package";
    }
    if (selectedAddress.value.trim().isEmpty) {
      return "Please enter address";
    }
    if (selectedDate.value.isEmpty) {
      return "Please select booking date";
    }
    if (selectedTime.value.isEmpty) {
      return "Please select time slot";
    }
    return null;
  }

  String mapStatus(String status) {
    final normalized = status.trim().toLowerCase();
    switch (normalized) {
      case 'completion_requested':
        return 'customer_review_pending';
      case 'admin_review_pending':
      case 'customer_review_pending':
      case 'rework_requested':
      case 'submitted':
      case 'approved':
      case 'assigned':
      case 'in_progress':
      case 'completed':
      case 'rejected':
        return normalized;
      default:
        return normalized;
    }
  }

  String normalizeTime(String slotLabel) {
    return slotLabel.trim().toUpperCase();
  }

  bool _isTaskCompleted(dynamic value) {
    if (value is bool) {
      return value;
    }
    if (value is num) {
      return value != 0;
    }
    final normalized = value?.toString().trim().toLowerCase() ?? '';
    return normalized == 'true' || normalized == '1';
  }

  Future<bool> createBooking() async {
    if (isCreatingBooking.value) {
      return false;
    }

    final validationError = validateBooking();
    if (validationError != null) {
      Get.snackbar("Validation Error", validationError);
      return false;
    }

    try {
      isCreatingBooking.value = true;

      final body = <String, dynamic>{
        "service_id": serviceId.value,
        "package_id": packageId.value,
        "scheduled_date": selectedDate.value,
        "scheduled_time_slot": normalizeTime(selectedTime.value),
        "address_line": selectedAddress.value,
        "building_name":
            buildingName.value.trim().isEmpty ? "-" : buildingName.value,
        "floor_number":
            floorNumber.value.trim().isEmpty ? "-" : floorNumber.value,
        "apartment_number": apartmentNumber.value.trim().isEmpty
            ? "-"
            : apartmentNumber.value,
        "latitude": selectedLat.value,
        "longitude": selectedLng.value,
        "customer_notes": specialInstructions.value.trim().isEmpty
            ? "-"
            : specialInstructions.value,
        "preferred_technician": preferredTechnician.value.trim().isEmpty
            ? null
            : preferredTechnician.value.trim(),
        "parking_instructions": parkingInstructions.value.trim().isEmpty
            ? null
            : parkingInstructions.value.trim(),
        "pet_warning": petWarning.value.trim().isEmpty
            ? null
            : petWarning.value.trim(),
        "call_before_arrival": callBeforeArrival.value,
      };

      debugPrint("BOOKING PAYLOAD => $body");

      final res = await _api.post("/bookings/", body);
      debugPrint("BOOKING RESPONSE => $res");

      if (res == null || res is! Map) {
        throw Exception("Invalid booking response");
      }

      final dynamic id = res["booking_id"] ?? res["id"];
      if (id == null) {
        throw Exception("Booking ID missing");
      }

      bookingId.value = int.tryParse(id.toString()) ?? 0;
      debugPrint("BOOKING ID SAVED => ${bookingId.value}");

      if (bookingId.value <= 0) {
        throw Exception("Invalid booking ID");
      }

      bookingStatus.value = "submitted";
      startPolling();
      return true;
    } catch (e) {
      debugPrint("BOOKING ERROR -> $e");
      Get.snackbar("Booking Failed", e.toString());
      return false;
    } finally {
      isCreatingBooking.value = false;
    }
  }

  Future<void> fetchStatus() async {
    try {
      if (bookingId.value <= 0) {
        debugPrint("POLLING STOPPED: INVALID BOOKING ID");
        return;
      }

      debugPrint("POLLING BOOKING ID => ${bookingId.value}");
      final res = await _api.get("/bookings/${bookingId.value}");
      debugPrint("POLL RESPONSE => $res");

      if (res == null || res is! Map) {
        debugPrint("INVALID POLL RESPONSE");
        return;
      }

      final rawStatus = (res["status"] ?? "").toString();
      bookingStatus.value = mapStatus(rawStatus);
      technicianName.value = (res["technician_name"] ?? "").toString();
      technicianPhone.value = (res["technician_phone"] ?? "").toString();
      technicianRating.value = (res["technician_rating"] ?? "").toString();

      final tasksResponse = await _api.get("/bookings/${bookingId.value}/tasks");
      if (tasksResponse is List) {
        final orderedTasks = [...tasksResponse]
          ..sort((a, b) {
            final left = int.tryParse((a["order_index"] ?? 9999).toString()) ?? 9999;
            final right = int.tryParse((b["order_index"] ?? 9999).toString()) ?? 9999;
            return left.compareTo(right);
          });

        checklist.value = orderedTasks
            .map((task) => (task["task_name"] ?? "").toString())
            .where((task) => task.trim().isNotEmpty)
            .toList();

        completedTasks.value = orderedTasks
            .where((task) => _isTaskCompleted(task["is_completed"]))
            .map((task) => (task["task_name"] ?? "").toString())
            .where((task) => task.trim().isNotEmpty)
            .toList();
      }
      debugPrint("UPDATED STATUS => ${bookingStatus.value}");
    } catch (e) {
      debugPrint("FETCH STATUS ERROR -> $e");
    }
  }

  Future<void> approveArrival() async {
    if (bookingId.value <= 0) {
      return;
    }

    try {
      await _api.post("/bookings/${bookingId.value}/start", {});
      bookingStatus.value = "in_progress";
    } catch (e) {
      debugPrint("ARRIVAL APPROVAL ERROR -> $e");
    }
  }

  Future<void> approveWork() async {
    if (bookingId.value <= 0) {
      return;
    }

    try {
      await _api.post("/bookings/${bookingId.value}/customer-approve", {});
      bookingStatus.value = "admin_review_pending";
    } catch (e) {
      debugPrint("APPROVE WORK ERROR -> $e");
    }
  }

  Future<void> requestRework(String reason) async {
    if (bookingId.value <= 0) {
      return;
    }

    try {
      await _api.post(
        "/bookings/${bookingId.value}/rework",
        {"reason": reason},
      );
      bookingStatus.value = "rework_requested";
    } catch (e) {
      debugPrint("REWORK ERROR -> $e");
    }
  }

  void startPolling() {
    if (bookingId.value <= 0) {
      debugPrint("POLLING NOT STARTED: INVALID ID");
      return;
    }

    debugPrint("STARTING POLLING FOR BOOKING ${bookingId.value}");
    activePollingBookingId.value = bookingId.value;
    isPolling.value = true;
    pollingTimer?.cancel();
    fetchStatus();

    pollingTimer = Timer.periodic(
      const Duration(seconds: 5),
      (_) async => fetchStatus(),
    );
  }

  void stopPolling() {
    pollingTimer?.cancel();
    pollingTimer = null;
    isPolling.value = false;
    activePollingBookingId.value = 0;
  }

  @override
  void onClose() {
    stopPolling();
    super.onClose();
  }
}
