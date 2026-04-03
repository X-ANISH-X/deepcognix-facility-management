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
      appBar: AppBar(
        title: const Text("Our Services"),
        elevation: 0,
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

            /// Welcome
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(18),
              ),
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

            const SizedBox(height: 20),

            const Text(
              "Select Apartment Type",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),

            const SizedBox(height: 16),

            /// GRID
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

                      /// 🔥 CRITICAL FIX
                      _booking.serviceId.value = item["id"];

                      /// navigate
                      Get.toNamed('/booking');
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          item["title"],
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
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