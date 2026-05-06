import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/theme_controller.dart';
import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/services/auth_service.dart';

class HomeScreen extends StatelessWidget {
  HomeScreen({super.key});

  final ThemeController _theme = Get.find<ThemeController>();
  final BookingController _booking = Get.find<BookingController>();
  final AuthService _auth = Get.find<AuthService>();

  final List<Map<String, dynamic>> apartmentTypes = [
    {"title": "Studio", "id": 1},
    {"title": "1 BHK", "id": 2},
    {"title": "2 BHK", "id": 3},
    {"title": "3 BHK", "id": 4},
  ];

  final List<Map<String, dynamic>> supportOptions = [
    {
      "title": "Commercial",
      "subtitle": "For offices, shops, and business spaces"
    },
    {"title": "Others", "subtitle": "For custom help or special requests"},
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text("Our Services"),
        elevation: 0,
        backgroundColor: Colors.transparent,
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () => Get.toNamed('/upcoming'),
          ),
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () => Get.toNamed('/profile'),
          ),
          Obx(() => IconButton(
                icon: Icon(
                  _theme.isDark.value ? Icons.dark_mode : Icons.light_mode,
                ),
                onPressed: _theme.toggleTheme,
              )),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            /// 🔹 WELCOME CARD (UPGRADED LOOK)
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: colorScheme.surface,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                    color: colorScheme.outlineVariant.withOpacity(0.6)),
                boxShadow: [
                  BoxShadow(
                    color: theme.shadowColor.withOpacity(
                        theme.brightness == Brightness.dark ? 0.28 : 0.06),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  /// ICON (NEW)
                  Container(
                    height: 45,
                    width: 45,
                    decoration: BoxDecoration(
                      color: colorScheme.primaryContainer.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.cleaning_services,
                      color: colorScheme.primary,
                    ),
                  ),

                  const SizedBox(width: 12),

                  /// TEXT (UNCHANGED)
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Welcome back, ${_auth.fullName ?? ""} 👋",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: colorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "What would you like cleaned today?",
                          style: TextStyle(color: colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            Text(
              "Select Apartment Type",
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurface,
              ),
            ),

            const SizedBox(height: 16),

            Row(
              children: supportOptions.map((option) {
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(18),
                      onTap: () {
                        Get.toNamed('/support-contact',
                            arguments: option['title']);
                      },
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: colorScheme.surface,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                              color:
                                  colorScheme.outlineVariant.withOpacity(0.6)),
                          boxShadow: [
                            BoxShadow(
                              color: theme.shadowColor.withOpacity(
                                  theme.brightness == Brightness.dark
                                      ? 0.28
                                      : 0.06),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              height: 44,
                              width: 44,
                              decoration: BoxDecoration(
                                color: colorScheme.primaryContainer
                                    .withOpacity(0.5),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                option['title'] == 'Commercial'
                                    ? Icons.business
                                    : Icons.support_agent,
                                color: colorScheme.primary,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              option['title'],
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: colorScheme.onSurface,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              option['subtitle'],
                              style: TextStyle(
                                fontSize: 12,
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            const SizedBox(height: 16),

            /// 🔹 GRID WITH ICONS (MAIN UPGRADE)
            Expanded(
              child: GridView.builder(
                itemCount: apartmentTypes.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemBuilder: (context, index) {
                  final item = apartmentTypes[index];

                  return InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: () {
                      /// 🔥 SAME LOGIC (UNTOUCHED)
                      _booking.serviceId.value = item["id"];

                      Get.toNamed('/booking');
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: colorScheme.surface,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                            color: colorScheme.outlineVariant.withOpacity(0.6)),
                        boxShadow: [
                          BoxShadow(
                            color: theme.shadowColor.withOpacity(
                                theme.brightness == Brightness.dark
                                    ? 0.28
                                    : 0.06),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          /// ICON (NEW)
                          Container(
                            height: 50,
                            width: 50,
                            decoration: BoxDecoration(
                              color:
                                  colorScheme.primaryContainer.withOpacity(0.5),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              _getIcon(item["title"]),
                              color: colorScheme.primary,
                              size: 26,
                            ),
                          ),

                          const SizedBox(height: 12),

                          /// TEXT (UNCHANGED)
                          Text(
                            item["title"],
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: colorScheme.onSurface,
                            ),
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

  /// 🔹 ICON MAPPING (UI ONLY)
  IconData _getIcon(String title) {
    final t = title.toLowerCase();

    if (t.contains("studio")) return Icons.apartment;
    if (t.contains("1")) return Icons.home;
    if (t.contains("2")) return Icons.meeting_room;
    if (t.contains("3")) return Icons.villa;

    return Icons.home_work;
  }
}
