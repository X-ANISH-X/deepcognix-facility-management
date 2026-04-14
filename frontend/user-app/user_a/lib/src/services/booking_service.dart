import 'package:user_a/src/services/api_client.dart';

class BookingService {

  final ApiClient _api = ApiClient();

  Future<List<String>> fetchTimeSlots(DateTime date) async {

    try {

      final resp = await _api.get(
        '/timeslots?date=${date.toIso8601String()}'
      );

      if (resp is List) {
        return List<String>.from(
          resp.map((e) => e.toString())
        );
      }

    } catch (_) {}

    // fallback demo slots
    return [
      '09:00 AM',
      '11:00 AM',
      '01:00 PM',
      '03:00 PM',
      '05:00 PM',
    ];
  }

  // 🔥 THIS WAS MISSING
  Future<void> createBooking(
    Map<String, dynamic> bookingData
  ) async {

    try {

      final resp = await _api.post(
        '/bookings',
        bookingData,
      );

      if (resp == null) {
        throw Exception("Booking failed");
      }

    } catch (e) {
      throw Exception("Booking creation failed");
    }
  }
}