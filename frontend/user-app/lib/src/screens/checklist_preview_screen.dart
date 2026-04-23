import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/controllers/package_controller.dart';

class ChecklistPreviewScreen extends StatelessWidget {
  const ChecklistPreviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final bookingController = Get.find<BookingController>();
    final packageController = Get.find<PackageController>();

    final package = packageController.selectedPackage.value;

    /// SAFETY CHECK (in case user lands here incorrectly)
    if (package == null) {
      return Scaffold(
        body: Center(
          child: Text(
            'No package selected',
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
      );
    }

    final checklist = package.checklist;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'service_checklist'.tr,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        elevation: 0,
      ),

      body: Padding(
        padding: const EdgeInsets.all(16),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            /// PACKAGE CARD
            Container(
              padding: const EdgeInsets.all(20),

              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(20),

                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(
                      Theme.of(context).brightness == Brightness.dark
                          ? 0.2
                          : 0.05,
                    ),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),

              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  /// NAME + PRICE
                  Row(
                    mainAxisAlignment:
                        MainAxisAlignment.spaceBetween,

                    children: [

                      Text(
                        package.name,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),

                      Text(
                        'AED ${package.price.toInt()}',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).primaryColor,
                            ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  /// CLEANING DURATION
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children:
                        package.durationByApartment.entries.map((e) {

                      return Padding(
                        padding:
                            const EdgeInsets.only(bottom: 4),

                        child: Text(
                          "${e.key}: ${e.value}",
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall,
                        ),
                      );

                    }).toList(),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            /// TASK TITLE
            Text(
              'tasks_included'.tr,
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),

            const SizedBox(height: 16),

            /// CHECKLIST
            Expanded(
              child: checklist.isEmpty
                  ? Center(
                      child: Text(
                        'No tasks available',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    )
                  : ListView.separated(

                      itemCount: checklist.length,

                      separatorBuilder: (_, __) =>
                          const SizedBox(height: 12),

                      itemBuilder: (context, index) {

                        final task = checklist[index];

                        return Container(
                          padding: const EdgeInsets.symmetric(
                              vertical: 14, horizontal: 16),

                          decoration: BoxDecoration(
                            color: Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: Theme.of(context).dividerColor,
                            ),
                          ),

                          child: Row(
                            children: [

                              Icon(
                                Icons.check_circle_outline,
                                size: 22,
                                color:
                                    Theme.of(context).primaryColor,
                              ),

                              const SizedBox(width: 12),

                              Expanded(
                                child: Text(
                                  task,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium,
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),

            const SizedBox(height: 20),

            /// CONTINUE BUTTON
            SizedBox(
              width: double.infinity,

              child: ElevatedButton(

                onPressed: () {
                  Get.toNamed('/booking');
                },

                style: ElevatedButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(vertical: 16),

                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),

                child: Text(
                  'continue'.tr,
                  style: const TextStyle(fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}