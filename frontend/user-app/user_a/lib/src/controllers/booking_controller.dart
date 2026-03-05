import 'package:get/get.dart';

class BookingController extends GetxController {
  // ----------------------------
  // Booking Details
  // ----------------------------

  final selectedDate = ''.obs;
  final selectedTime = ''.obs;
  final selectedAddress = ''.obs;
  final paymentMethod = 'pay_now'.obs;
  final bookingStatus = 'submitted'.obs;

  // ----------------------------
  // Address List
  // ----------------------------

  final addresses = [
    'Home - 123 Main Street',
    'Office - Business Ave',
  ].obs;

  void addAddress(String address) {
    addresses.add(address);
  }

  // ----------------------------
  // Checklist Logic
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

  // ----------------------------
  // Reset Logic (optional)
  // ----------------------------

  void resetChecklist() {
    completedTasks.clear();
    bookingStatus.value = 'in_progress';
  }
}
