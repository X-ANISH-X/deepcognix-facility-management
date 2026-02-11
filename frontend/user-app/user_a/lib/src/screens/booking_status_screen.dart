import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/screens/checklist_progress_screen.dart';

class BookingStatusScreen extends GetView<BookingController> {
  const BookingStatusScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Service Status',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        centerTitle: false,
        elevation: 0,
      ),
      body: Obx(
        () => Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _statusCard(context),
              const SizedBox(height: 24),
              _progressTimeline(context),
              const Spacer(),
              _bottomButton(context),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------- STATUS CARD ----------------

  Widget _statusCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(
                Theme.of(context).brightness == Brightness.dark
                    ? 0.2
                    : 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Booking #CLN-2026-001',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 10),
          Text(
            controller.bookingStatus.value
                .replaceAll('_', ' ')
                .toUpperCase(),
            style: Theme.of(context)
                .textTheme
                .titleSmall
                ?.copyWith(
                  color: Theme.of(context).primaryColor,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }

  // ---------------- TIMELINE ----------------

  Widget _progressTimeline(BuildContext context) {
    final steps = [
      'submitted',
      'approved',
      'in_progress',
      'completed',
    ];

    return Column(
      children: steps.map((step) {
        final isActive =
            steps.indexOf(controller.bookingStatus.value) >=
                steps.indexOf(step);

        return ListTile(
          contentPadding: EdgeInsets.zero,
          leading: Icon(
            isActive
                ? Icons.check_circle
                : Icons.radio_button_unchecked,
            color: isActive
                ? Theme.of(context).primaryColor
                : Theme.of(context).dividerColor,
          ),
          title: Text(
            step.replaceAll('_', ' ').toUpperCase(),
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
          ),
        );
      }).toList(),
    );
  }

  // ---------------- BOTTOM ACTION ----------------

  Widget _bottomButton(BuildContext context) {
    final status = controller.bookingStatus.value;

    if (status == 'completed') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            padding:
                const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius:
                  BorderRadius.circular(16),
            ),
          ),
          onPressed: () {
            Get.snackbar(
              'Service Approved',
              'Completion has been approved.',
              snackPosition: SnackPosition.BOTTOM,
            );
          },
          child: const Text(
            'Approve Completion',
            style: TextStyle(fontSize: 16),
          ),
        ),
      );
    }

    if (status == 'in_progress') {
      return Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                    vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius:
                      BorderRadius.circular(16),
                ),
              ),
              onPressed: () {
                Get.to(() =>
                    const ChecklistProgressScreen());
              },
              child: const Text(
                'View Checklist Progress',
                style: TextStyle(fontSize: 16),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: _simulateNextStatus,
              child: const Text(
                'Simulate Next Status',
              ),
            ),
          ),
        ],
      );
    }

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          padding:
              const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius:
                BorderRadius.circular(16),
          ),
        ),
        onPressed: _simulateNextStatus,
        child: const Text(
          'Simulate Next Status',
          style: TextStyle(fontSize: 16),
        ),
      ),
    );
  }

  void _simulateNextStatus() {
    switch (controller.bookingStatus.value) {
      case 'submitted':
        controller.bookingStatus.value = 'approved';
        break;
      case 'approved':
        controller.bookingStatus.value = 'in_progress';
        break;
      case 'in_progress':
        controller.bookingStatus.value = 'completed';
        break;
    }
  }
}
