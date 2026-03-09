import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:user_a/src/controllers/package_controller.dart';
import 'package:user_a/src/screens/checklist_preview_screen.dart';

class PackageSelectionScreen extends GetView<PackageController> {

  final String apartmentType;

  PackageSelectionScreen({
    super.key,
    required this.apartmentType,
  });

  @override
  Widget build(BuildContext context) {

    controller.loadPackages(apartmentType);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'select_package'.tr,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        elevation: 0,
      ),

      body: Padding(
        padding: const EdgeInsets.all(16),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            /// Selected apartment display
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: Colors.grey.shade300,
                ),
              ),
              child: Row(
                children: [

                  const Icon(Icons.home),

                  const SizedBox(width: 10),

                  Text(
                    apartmentType,
                    style: Theme.of(context)
                        .textTheme
                        .titleSmall
                        ?.copyWith(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            /// packages list
            Expanded(
              child: Obx(() {

                if (controller.packages.isEmpty) {
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                }

                return ListView.separated(

                  itemCount: controller.packages.length,

                  separatorBuilder: (_, __) =>
                      const SizedBox(height: 16),

                  itemBuilder: (context, index) {

                    final pkg = controller.packages[index];

                    final duration =
                        pkg.durationByApartment[apartmentType] ?? '';

                    final checklist = pkg.checklist;

                    return Container(
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
                                  : 0.05,
                            ),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),

                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,

                        children: [

                          /// title + price
                          Row(
                            mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,

                            children: [

                              Text(
                                pkg.name,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight:
                                          FontWeight.w600,
                                    ),
                              ),

                              Text(
                                '\$${pkg.price.toInt()}',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight:
                                          FontWeight.bold,
                                      color: Theme.of(context)
                                          .primaryColor,
                                    ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 6),

                          /// description
                          Text(
                            pkg.description,
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall,
                          ),

                          const SizedBox(height: 10),

                          /// cleaning duration
                          Row(
                            children: [

                              const Icon(
                                Icons.access_time,
                                size: 18,
                              ),

                              const SizedBox(width: 6),

                              Text(
                                "Cleaning Time: $duration",
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall,
                              ),
                            ],
                          ),

                          const SizedBox(height: 14),

                          /// checklist preview
                          ...checklist.take(3).map(

                            (item) => Padding(

                              padding:
                                  const EdgeInsets.only(
                                      bottom: 8),

                              child: Row(
                                children: [

                                  Icon(
                                    Icons.check_circle,
                                    size: 18,
                                    color: Theme.of(context)
                                        .primaryColor,
                                  ),

                                  const SizedBox(width: 8),

                                  Expanded(
                                    child: Text(
                                      item,
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

                          /// continue button
                          SizedBox(
                            width: double.infinity,

                            child: ElevatedButton(

                              onPressed: () {

                                controller.selectPackage(pkg);

                                Get.to(() =>
                                    ChecklistPreviewScreen(
                                      package: pkg,
                                      serviceId: apartmentType,
                                    ));
                              },

                              style: ElevatedButton.styleFrom(
                                shape:
                                    RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius.circular(
                                          14),
                                ),

                                padding:
                                    const EdgeInsets.symmetric(
                                        vertical: 14),
                              ),

                              child: const Text(
                                "Continue",
                                style: TextStyle(
                                  fontSize: 15,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              }),
            ),
          ],
        ),
      ),
    );
  }
}