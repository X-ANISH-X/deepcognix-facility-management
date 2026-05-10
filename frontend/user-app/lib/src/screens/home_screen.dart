import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/controllers/theme_controller.dart';
import 'package:user_a/src/services/auth_service.dart';

class HomeScreen extends StatelessWidget {
  HomeScreen({super.key});

  static const int _apartmentCleaningServiceId = 1;

  final ThemeController _theme = Get.find<ThemeController>();
  final BookingController _booking = Get.find<BookingController>();
  final AuthService _auth = Get.find<AuthService>();

  final List<Map<String, String>> apartmentTypes = const [
    {"title": "Studio"},
    {"title": "1 BHK"},
    {"title": "2 BHK"},
    {"title": "3 BHK"},
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
          Obx(
            () => IconButton(
              icon: Icon(
                _theme.isDark.value ? Icons.dark_mode : Icons.light_mode,
              ),
              onPressed: _theme.toggleTheme,
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: colorScheme.surface,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(
                    theme.brightness == Brightness.dark ? 0.2 : 0.05,
                  ),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  height: 52,
                  width: 52,
                  decoration: BoxDecoration(
                    color: colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    Icons.cleaning_services,
                    color: colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Welcome back, ${_auth.fullName ?? ""}",
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Professional apartment cleaning services across Dubai.",
                        style: TextStyle(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          const Text(
            "Book Apartment Cleaning",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Select your apartment type to continue.",
            style: TextStyle(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 18),
          GridView.builder(
            itemCount: apartmentTypes.length,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 1.1,
            ),
            itemBuilder: (context, index) {
              final item = apartmentTypes[index];
              final title = item["title"]!;

              return InkWell(
                borderRadius: BorderRadius.circular(18),
                onTap: () {
                  _booking.serviceId.value = _apartmentCleaningServiceId;
                  Get.toNamed(
                    '/package-selection',
                    arguments: {
                      "apartmentType": title,
                      "serviceId": _apartmentCleaningServiceId,
                    },
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: colorScheme.surface,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(
                          theme.brightness == Brightness.dark ? 0.2 : 0.05,
                        ),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        height: 54,
                        width: 54,
                        decoration: BoxDecoration(
                          color: colorScheme.primaryContainer,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(
                          _getIcon(title),
                          color: colorScheme.primary,
                          size: 28,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 32),
          const Text(
            "Need Assistance?",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "For commercial cleaning or special requests, contact support directly.",
            style: TextStyle(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: _supportCard(
                  context,
                  title: "Commercial",
                  subtitle: "Offices, shops & warehouses",
                  icon: Icons.business,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: _supportCard(
                  context,
                  title: "Others",
                  subtitle: "Custom support requests",
                  icon: Icons.support_agent,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _supportCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
  }) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () {
        Get.toNamed(
          '/support-contact',
          arguments: title,
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(
                theme.brightness == Brightness.dark ? 0.2 : 0.05,
              ),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 46,
              width: 46,
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: colorScheme.primary),
            ),
            const SizedBox(height: 14),
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              style: TextStyle(
                color: colorScheme.onSurfaceVariant,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getIcon(String title) {
    final value = title.toLowerCase();

    if (value.contains("studio")) {
      return Icons.apartment;
    }
    if (value.contains("1")) {
      return Icons.home;
    }
    if (value.contains("2")) {
      return Icons.meeting_room;
    }
    if (value.contains("3")) {
      return Icons.villa;
    }
    return Icons.home_work;
  }
}
