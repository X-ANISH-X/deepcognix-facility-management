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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FB), // ✅ soft background

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
                  _theme.isDark.value
                      ? Icons.dark_mode
                      : Icons.light_mode,
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
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
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
                      color: const Color(0xFFE6F4F1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.cleaning_services,
                      color: Color(0xFF0F9D8A),
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
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text("What would you like cleaned today?"),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            const Text(
              "Select Apartment Type",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),

            const SizedBox(height: 16),

            /// 🔹 GRID WITH ICONS (MAIN UPGRADE)
            Expanded(
              child: GridView.builder(
                itemCount: apartmentTypes.length,
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
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
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: Colors.grey.shade200),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
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
                              color: const Color(0xFFE6F4F1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              _getIcon(item["title"]),
                              color: const Color(0xFF0F9D8A),
                              size: 26,
                            ),
                          ),

                          const SizedBox(height: 12),

                          /// TEXT (UNCHANGED)
                          Text(
                            item["title"],
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