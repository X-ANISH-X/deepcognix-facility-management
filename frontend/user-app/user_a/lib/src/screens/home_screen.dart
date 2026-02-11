import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/home_controller.dart';
import 'package:user_a/src/controllers/theme_controller.dart';
import 'package:user_a/src/screens/package_selection_screen.dart';

class HomeScreen extends GetView<HomeController> {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeController = Get.find<ThemeController>();

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Choose Service",
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        centerTitle: false,
        elevation: 0,
        actions: [
          Obx(
            () => IconButton(
              icon: Icon(
                themeController.isDark.value
                    ? Icons.dark_mode
                    : Icons.light_mode,
              ),
              onPressed: () {
                themeController.toggleTheme();
              },
            ),
          ),
        ],
      ),

      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Obx(
          () => GridView.builder(
            itemCount: controller.services.length,
            gridDelegate:
                const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 0.85,
            ),
            itemBuilder: (context, index) {
              final service = controller.services[index];

              return InkWell(
                borderRadius: BorderRadius.circular(18),
                onTap: () {
                  Get.to(() => const PackageSelectionScreen());
                },
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(
                            themeController.isDark.value ? 0.2 : 0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Theme.of(context)
                              .primaryColor
                              .withOpacity(0.12),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          service.icon,
                          size: 28,
                          color: Theme.of(context).primaryColor,
                        ),
                      ),

                      const SizedBox(height: 20),

                      Text(
                        service.title,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),

                      const SizedBox(height: 6),

                      Text(
                        service.subtitle,
                        style:
                            Theme.of(context).textTheme.bodySmall,
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
