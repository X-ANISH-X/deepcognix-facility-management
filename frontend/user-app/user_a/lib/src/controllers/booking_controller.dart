import 'package:get/get.dart';
import 'package:user_a/src/services/api_client.dart';

class BookingController extends GetxController {
  final _api = ApiClient();

  // ----------------------------
  // Selection tracking (set before reaching BookingDetailsScreen)
  // ----------------------------

  int selectedServiceId = 0;
  int selectedPackageId = 0;

  // ----------------------------
  // Booking form values
  // ----------------------------

  /// Display string shown in the UI, e.g. "14/4/2026"
  final selectedDate = ''.obs;

  /// ISO date string sent to the API, e.g. "2026-04-14"
  String _isoDate = '';

  /// One of: 'morning' | 'afternoon' | 'evening'
  final selectedTimeSlot = ''.obs;

  final selectedAddress = ''.obs;
  final paymentMethod = 'pay_now'.obs;

  // ----------------------------
  // Current booking state
  // ----------------------------

  final currentBookingId = Rxn<int>();
  final bookingStatus = 'submitted'.obs;
  final isConfirming = false.obs;

  // ----------------------------
  // Address list
  // ----------------------------

  final addresses = [
    'Home - 123 Main Street',
    'Office - Business Ave',
  ].obs;

  void addAddress(String address) {
    addresses.add(address);
  }

  // ----------------------------
  // Date helpers
  // ----------------------------

  void setDate(DateTime date) {
    selectedDate.value = '${date.day}/${date.month}/${date.year}';
    _isoDate =
        '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  // ----------------------------
  // Booking API calls
  // ----------------------------

  Future<bool> confirmBooking() async {
    try {
      isConfirming.value = true;
      final response = await _api.post('/bookings', {
        'service_id': selectedServiceId,
        'package_id': selectedPackageId,
        'scheduled_date': _isoDate,
        'scheduled_time_slot': selectedTimeSlot.value,
        'address_line': selectedAddress.value,
      });
      currentBookingId.value = response['booking_id'] as int;
      bookingStatus.value = 'submitted';
      return true;
    } catch (e) {
      Get.snackbar(
        'Booking Error',
        e.toString().replaceFirst('Exception: ', ''),
        snackPosition: SnackPosition.BOTTOM,
      );
      return false;
    } finally {
      isConfirming.value = false;
    }
  }

  Future<void> fetchBookingStatus() async {
    if (currentBookingId.value == null) return;
    try {
      final data = await _api.get('/bookings/${currentBookingId.value}');
      bookingStatus.value = data['status'] as String;
    } catch (_) {}
  }

  // ----------------------------
  // Checklist logic (for checklist progress screen)
  // ----------------------------

  final checklist = <String>[
    'Dusting',
    'Vacuuming',
    'Mopping',
    'Restroom cleaning',
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

  void markServiceCompleted() {
    if (progress == 1.0) {
      bookingStatus.value = 'completed';
    }
  }

  void resetChecklist() {
    completedTasks.clear();
    bookingStatus.value = 'in_progress';
  }
}
