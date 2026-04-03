import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/booking_controller.dart';

class TrackingScreen extends StatelessWidget {
  const TrackingScreen({super.key});

  @override
  Widget build(BuildContext context) {

    final controller = Get.find<BookingController>();

    return Scaffold(
      appBar: AppBar(
        title: const Text("Service Status"),
      ),

      body: Obx(() {

        final rawStatus = controller.bookingStatus.value;
        final normalizedStatus = rawStatus.trim().toLowerCase();
        final mappedStatus = controller.mapStatus(normalizedStatus);

        debugPrint("TRACKING SCREEN STATUS → raw='$rawStatus', normalized='$normalizedStatus', mapped='$mappedStatus'");

        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [

              const Icon(Icons.cleaning_services, size: 70),

              const SizedBox(height: 20),

              Text(
                mappedStatus.isEmpty
                    ? "Waiting for technician..."
                    : mappedStatus.tr,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 10),

              const Text(
                "Tracking will be available soon",
                style: TextStyle(color: Colors.grey),
              ),

              const SizedBox(height: 40),

              /// ✅ BUTTON TO VIEW FULL STATUS SCREEN
              ElevatedButton.icon(
                onPressed: () {
                  Get.toNamed('/booking-status');
                },
                icon: const Icon(Icons.arrow_forward),
                label: const Text('View Full Status'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}