import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:user_a/src/services/api_client.dart';
import 'package:user_a/src/controllers/booking_controller.dart';

class UpcomingBookingsScreen extends StatefulWidget {
  const UpcomingBookingsScreen({super.key});

  @override
  State<UpcomingBookingsScreen> createState() =>
      _UpcomingBookingsScreenState();
}

class _UpcomingBookingsScreenState extends State<UpcomingBookingsScreen> {

  final ApiClient api = ApiClient();
  final BookingController bookingController = Get.find();

  final bookings = <Map<String, dynamic>>[].obs;
  final isLoading = true.obs;

  @override
  void initState() {
    super.initState();
    fetchBookings();
  }

  /// ---------------- FETCH BOOKINGS ----------------
  Future<void> fetchBookings() async {

    try {

      isLoading.value = true;

      final response = await api.get("/bookings");

      if (response is List) {
        bookings.value =
            List<Map<String, dynamic>>.from(response);
      }

    } catch (e) {

      debugPrint("Bookings fetch failed → $e");
      bookings.clear();

      Get.snackbar(
        "Error",
        "Failed to load bookings",
        snackPosition: SnackPosition.BOTTOM,
      );

    } finally {

      isLoading.value = false;
    }
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: Text('upcoming_bookings'.tr),
        elevation: 0,
      ),

      body: Obx(() {

        if (isLoading.value) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        if (bookings.isEmpty) {
          return Center(
            child: Text('no_bookings'.tr),
          );
        }

        return RefreshIndicator(

          onRefresh: fetchBookings,

          child: ListView.builder(

            padding: const EdgeInsets.all(16),

            itemCount: bookings.length,

            itemBuilder: (context, index) {

              final booking = bookings[index];

              final int bookingId =
                  booking["id"] ?? 0;

              final date = booking["date"] ?? "";
              final time = booking["time"] ?? "";
              final address = booking["address"] ?? "";
              final status = booking["status"] ?? "requested";

              return Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: ListTile(

                  contentPadding:
                      const EdgeInsets.all(16),

                  title: Text(
                    "$date • $time",
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                    ),
                  ),

                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(address),
                  ),

                  trailing: _statusBadge(status),

                  onTap: () {

                    bookingController.bookingId.value = bookingId;

                    Get.toNamed('/booking-status');
                  },
                ),
              );
            },
          ),
        );
      }),
    );
  }

  /// ---------------- STATUS BADGE ----------------
  Widget _statusBadge(String status) {

    Color color;

    switch (status) {
      case "completed":
        color = Colors.green;
        break;
      case "in_progress":
        color = Colors.orange;
        break;
      case "cancelled":
        color = Colors.red;
        break;
      default:
        color = Colors.blueGrey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.tr,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w500,
          fontSize: 12,
        ),
      ),
    );
  }
}