import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/themes/colors.dart';

class ChecklistProgressScreen extends GetView<BookingController> {
  const ChecklistProgressScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'service_progress'.tr,
          style: const TextStyle(
            color: AppColors.textDark,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: AppColors.background,
        elevation: 0,
      ),
      body: Obx(
        () => Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _progressCard(),
              const SizedBox(height: 20),
              Expanded(child: _taskList()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _progressCard() {
    final percentage = (controller.progress * 100).toInt();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'checklist_completion'.tr,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: controller.progress,
            color: AppColors.primary,
            backgroundColor: AppColors.border,
          ),
          const SizedBox(height: 8),
          Text(
            '$percentage% ${'completed'.tr}',
            style: const TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _taskList() {
    return ListView.separated(
      itemCount: controller.checklist.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final task = controller.checklist[index];

        return Obx(() {
          final isDone = controller.completedTasks.contains(task);

          return Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                Icon(
                  isDone
                      ? Icons.check_circle
                      : Icons.radio_button_unchecked,
                  color: isDone
                      ? AppColors.primary
                      : AppColors.textLight,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    task.tr,
                    style: TextStyle(
                      fontSize: 14,
                      decoration: isDone
                          ? TextDecoration.lineThrough
                          : null,
                      color: AppColors.textDark,
                    ),
                  ),
                ),
              ],
            ),
          );
        });
      },
    );
  }
}
