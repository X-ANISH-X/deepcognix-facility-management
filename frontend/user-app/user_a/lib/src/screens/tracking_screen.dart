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

        final status = controller.bookingStatus.value; // ✅ FIX

        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [

              const Icon(Icons.cleaning_services, size: 70),

              const SizedBox(height: 20),

              Text(
                status.isEmpty
                    ? "Waiting for technician..."
                    : status,
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
            ],
          ),
        );
      }),
    );
  }
}