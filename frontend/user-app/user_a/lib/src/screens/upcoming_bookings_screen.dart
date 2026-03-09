import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/screens/booking_status_screen.dart';

class UpcomingBookingsScreen extends StatelessWidget {
  const UpcomingBookingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<BookingController>();

    return Scaffold(
      appBar: AppBar(
        title: Text('upcoming_bookings'.tr),
        elevation: 0,
      ),
      body: Obx(() {
        if (controller.selectedDate.value.isEmpty) {
          return Center(child: Text('no_bookings'.tr));
        }

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: ListTile(
                title: Text('Booking: ${controller.selectedDate.value} at ${controller.selectedTime.value}'),
                subtitle: Text(controller.selectedAddress.value),
                trailing: Text(controller.bookingStatus.value.tr),
                onTap: () {
                  Get.to(() => const BookingStatusScreen());
                },
              ),
            ),
          ],
        );
      }),
    );
  }
}
