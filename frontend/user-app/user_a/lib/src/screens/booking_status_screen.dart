import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/screens/checklist_progress_screen.dart';
import 'package:user_a/src/screens/tracking_screen.dart';

class BookingStatusScreen extends GetView<BookingController> {
  const BookingStatusScreen({super.key});

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: const Text("Service Status"),
        elevation: 0,
      ),

      body: Obx(() {

        final status = controller.bookingStatus.value;

        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [

              /// Booking card
              _bookingCard(context),

              const SizedBox(height: 20),

              /// Status content
              Expanded(
                child: _statusContent(context, status),
              ),

              /// Action button
              _actionButton(context, status),
            ],
          ),
        );
      }),
    );
  }

  /// BOOKING CARD
  Widget _bookingCard(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: Theme.of(context).cardColor,
      ),
      child: Obx(() {
        return Text(
          "Booking #${controller.bookingId.value}",
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        );
      }),
    );
  }

  /// STATUS CONTENT
  Widget _statusContent(BuildContext context, String status) {

    switch (status) {

      case "requested":
        return _statusCard(
          "Finding Technician",
          "Searching nearby technicians...",
        );

      case "technician_assigned":
        return _statusCard(
          "Technician Assigned",
          "${controller.technicianName.value}\n⭐ ${controller.technicianRating.value}",
        );

      case "on_the_way":
        return _statusCard(
          "Technician On The Way",
          "You can track technician live on map",
        );

      case "arrival_approval_pending":
        return _statusCard(
          "Technician Arrived",
          "Please confirm technician arrival",
        );

      case "in_progress":
        return _statusCard(
          "Service In Progress",
          "Cleaning service currently ongoing",
        );

      case "completion_approval_pending":
        return _statusCard(
          "Service Completed",
          "Review checklist before approving completion",
        );

      case "payment_pending":
        return _statusCard(
          "Payment Pending",
          "Please complete payment",
        );

      case "completed":
        return _statusCard(
          "Service Completed",
          "Invoice generated successfully",
        );

      default:
        return const SizedBox();
    }
  }

  Widget _statusCard(String title, String subtitle) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Get.theme.cardColor,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 10),

          Text(subtitle),
        ],
      ),
    );
  }

  /// ACTION BUTTON
  Widget _actionButton(BuildContext context, String status) {

    if (status == "on_the_way") {
      return _button("Track Technician", () {
        Get.to(() => const TrackingScreen());
      });
    }

    if (status == "arrival_approval_pending") {
      return _button("Confirm Arrival", () {
        controller.approveArrival();
      });
    }

    if (status == "in_progress") {
      return _button("View Checklist", () {
        Get.to(() => const ChecklistProgressScreen());
      });
    }

    if (status == "completion_approval_pending") {
      return _button("Approve Completion", () {
        controller.completeBooking();
      });
    }

    if (status == "payment_pending") {
      return _button("Pay Now", () {
        controller.updateBookingStatus("completed");
      });
    }

    if (status == "completed") {
      return _button("Done", () {
        Get.back();
      });
    }

    return const SizedBox();
  }

  Widget _button(String text, VoidCallback onPressed) {

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: Text(text),
      ),
    );
  }
}