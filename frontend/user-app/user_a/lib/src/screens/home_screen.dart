import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/theme_controller.dart';
import 'package:user_a/src/screens/package_selection_screen.dart';
import 'package:user_a/src/screens/profile_screen.dart';
import 'package:user_a/src/screens/notification_screen.dart';

class HomeScreen extends StatelessWidget {
  HomeScreen({super.key});

  final ThemeController themeController = Get.find<ThemeController>();

  final List<Map<String, dynamic>> apartments = [
    {
      "type": "Studio",
      "subtitle": "Compact living space",
      "icon": Icons.home,
    },
    {
      "type": "1 BHK",
      "subtitle": "1 Bedroom apartment",
      "icon": Icons.apartment,
    },
    {
      "type": "2 BHK",
      "subtitle": "2 Bedroom apartment",
      "icon": Icons.apartment_outlined,
    },
    {
      "type": "3 BHK",
      "subtitle": "Large family apartment",
      "icon": Icons.domain,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          "Choose Apartment",
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        elevation: 0,
        actions: [

          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () {
              Get.to(() => NotificationScreen());
            },
          ),

          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              Get.to(() => ProfileScreen());
            },
          ),

          Obx(() {
            return IconButton(
              icon: Icon(
                themeController.isDark.value
                    ? Icons.dark_mode
                    : Icons.light_mode,
              ),
              onPressed: themeController.toggleTheme,
            );
          }),
        ],
      ),

      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            /// Welcome card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Theme.of(context)
                    .primaryColor
                    .withOpacity(0.12),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Welcome Back",
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text("Choose Apartment Type"),
                ],
              ),
            ),

            const SizedBox(height: 20),

            /// Apartment grid
            Expanded(
              child: GridView.builder(
                itemCount: apartments.length,
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.85,
                ),
                itemBuilder: (context, index) {

                  final apartment = apartments[index];

                  return InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: () {

                      Get.to(() => PackageSelectionScreen(
                            apartmentType: apartment["type"],
                          ));
                    },
                    child: Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(
                              Theme.of(context)
                                          .brightness ==
                                      Brightness.dark
                                  ? 0.2
                                  : 0.05,
                            ),
                            blurRadius: 10,
                            offset:
                                const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [

                          Container(
                            padding:
                                const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Theme.of(context)
                                  .primaryColor
                                  .withOpacity(0.12),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              apartment["icon"],
                              size: 28,
                              color: Theme.of(context)
                                  .primaryColor,
                            ),
                          ),

                          const SizedBox(height: 20),

                          Text(
                            apartment["type"],
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                    fontWeight:
                                        FontWeight.w600),
                          ),

                          const SizedBox(height: 6),

                          Text(
                            apartment["subtitle"],
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}