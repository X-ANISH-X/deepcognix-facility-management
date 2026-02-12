import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/package_controller.dart';
import 'package:user_a/src/screens/checklist_preview_screen.dart';

class PackageSelectionScreen extends GetView<PackageController> {
  const PackageSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'select_package'.tr,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        centerTitle: false,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Obx(
          () => ListView.separated(
            itemCount: controller.packages.length,
            separatorBuilder: (_, __) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final pkg = controller.packages[index];

              return InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: () {
                  Get.to(() => ChecklistPreviewScreen(package: pkg));
                },
                child: Container(
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
                      // HEADER
                      Row(
                        mainAxisAlignment:
                            MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            pkg.name.tr,   // 🔥 FIX
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          Text(
                            '\$${pkg.price.toInt()}',
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

                      const SizedBox(height: 6),

                      Text(
                        pkg.description.tr,   // 🔥 FIX
                        style: Theme.of(context).textTheme.bodySmall,
                      ),

                      const SizedBox(height: 14),

                      // CHECKLIST PREVIEW
                      ...pkg.checklist.take(3).map(
                        (item) => Padding(
                          padding:
                              const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              Icon(
                                Icons.check_circle,
                                size: 18,
                                color:
                                    Theme.of(context).primaryColor,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  item.tr,   // 🔥 FIX
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // CONTINUE BUTTON
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            shape: RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(14),
                            ),
                            padding:
                                const EdgeInsets.symmetric(
                                    vertical: 14),
                          ),
                          onPressed: () {
                            Get.to(() =>
                                ChecklistPreviewScreen(package: pkg));
                          },
                          child: Text(
                            'continue'.tr,
                            style: const TextStyle(fontSize: 15),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
