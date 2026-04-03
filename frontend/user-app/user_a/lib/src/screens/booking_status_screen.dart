import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:user_a/src/controllers/booking_controller.dart';

class BookingStatusScreen extends GetView<BookingController> {
  const BookingStatusScreen({super.key});

  @override
  Widget build(BuildContext context) {

    /// ✅ SAFE POLLING (RUNS ONCE)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!controller.isPolling.value) {
        controller.startPolling();
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text("Service Status"),
        elevation: 0,
      ),

      body: Obx(() {

        final status = controller.bookingStatus.value;

        if (status.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [

              /// BOOKING CARD
              _bookingCard(context),

              const SizedBox(height: 20),

              /// STATUS CONTENT
              Expanded(
                child: _statusContent(status),
              ),

              /// ACTION BUTTON
              _actionButton(status),
            ],
          ),
        );
      }),
    );
  }

  /// ---------------- BOOKING CARD ----------------
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

  /// ---------------- STATUS CONTENT ----------------
  Widget _statusContent(String status) {

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
          "You can track technician live",
        );

      case "arrival_approval_pending":
        return _statusCard(
          "Technician Arrived",
          "Please confirm arrival",
        );

      case "in_progress":
        return _statusCard(
          "Service In Progress",
          "Cleaning is ongoing",
        );

      case "completion_approval_pending":
        return _statusCard(
          "Service Completed",
          "Review checklist before approval",
        );

      case "payment_pending":
        return _statusCard(
          "Payment Pending",
          "Pay technician directly (Cash)",
        );

      case "completed":
        return _statusCard(
          "Completed",
          "Thank you! Service finished.",
        );

      default:
        return const Center(child: Text("Updating status..."));
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

  /// ---------------- ACTION BUTTONS ----------------
  Widget _actionButton(String status) {

    if (status == "on_the_way") {
      return Column(
        children: [
          _button("Track Technician", () {
            Get.toNamed('/tracking');
          }),
          const SizedBox(height: 10),
          _button("Call Technician", _callTechnician),
        ],
      );
    }

    if (status == "technician_assigned") {
      return _button("Call Technician", _callTechnician);
    }

    if (status == "arrival_approval_pending") {
      return _button("Confirm Arrival", () async {
        await controller.approveArrival();
      });
    }

    if (status == "in_progress") {
      return _button("View Checklist", () {
        Get.toNamed('/checklist-progress');
      });
    }

    if (status == "completion_approval_pending") {
      return _button("Approve Completion", () async {
        await controller.completeBooking();
      });
    }

    if (status == "payment_pending") {
      return _button("Payment Pending", () {});
    }

    if (status == "completed") {
      return _button("Done", () {
        Get.offAllNamed('/home');
      });
    }

    return const SizedBox();
  }

  /// ---------------- CALL ----------------
  Future<void> _callTechnician() async {

    final phone = controller.technicianPhone.value;

    if (phone.isEmpty) {
      Get.snackbar("Unavailable", "No phone number");
      return;
    }

    final uri = Uri.parse("tel:$phone");

    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      Get.snackbar("Error", "Cannot open dialer");
    }
  }

  Widget _button(String text, VoidCallback onPressed) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onPressed,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Text(text),
        ),
      ),
    );
  }
}