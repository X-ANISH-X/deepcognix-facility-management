import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/models/package_model.dart';
import 'package:user_a/src/screens/booking_details_screen.dart';

class ChecklistPreviewScreen extends StatelessWidget {
  final PackageModel package;

  const ChecklistPreviewScreen({
    super.key,
    required this.package,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Service Checklist',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        centerTitle: false,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 🔹 Package Summary Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(
                        Theme.of(context).brightness ==
                                Brightness.dark
                            ? 0.2
                            : 0.05),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment:
                    MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    package.name,
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  Text(
                    '\$${package.price.toInt()}',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(
                          fontWeight: FontWeight.bold,
                          color:
                              Theme.of(context).primaryColor,
                        ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            Text(
              'Tasks included in this package',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),

            const SizedBox(height: 16),

            // 🔹 Checklist List
            Expanded(
              child: ListView.separated(
                itemCount: package.checklist.length,
                separatorBuilder: (_, __) =>
                    const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final task = package.checklist[index];

                  return Container(
                    padding:
                        const EdgeInsets.symmetric(
                            vertical: 14, horizontal: 16),
                    decoration: BoxDecoration(
                      color:
                          Theme.of(context).cardColor,
                      borderRadius:
                          BorderRadius.circular(16),
                      border: Border.all(
                        color: Theme.of(context)
                            .dividerColor,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.check_circle_outline,
                          size: 22,
                          color: Theme.of(context)
                              .primaryColor,
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

            // 🔹 Continue Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(
                          vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(16),
                  ),
                ),
                onPressed: () {
                  Get.to(() =>
                      const BookingDetailsScreen());
                },
                child: const Text(
                  'Continue',
                  style: TextStyle(fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
