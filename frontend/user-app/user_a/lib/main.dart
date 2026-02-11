import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

import 'src/screens/login_screen.dart';
import 'src/controllers/register_controller.dart';
import 'src/controllers/home_controller.dart';
import 'src/controllers/package_controller.dart';
import 'src/controllers/booking_controller.dart';
import 'src/controllers/theme_controller.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await GetStorage.init();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeController = Get.put(ThemeController());

    return Obx(
      () => GetMaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'User App',

        // LIGHT THEME
        theme: ThemeData.light().copyWith(
          primaryColor: Colors.teal,
          scaffoldBackgroundColor: Colors.white,
        ),

        // DARK THEME
        darkTheme: ThemeData.dark().copyWith(
          primaryColor: Colors.teal,
        ),

        // 🔥 Reactive theme mode
        themeMode:
            themeController.isDark.value ? ThemeMode.dark : ThemeMode.light,

        initialBinding: BindingsBuilder(() {
          Get.put(RegisterController());
          Get.put(HomeController());
          Get.put(PackageController());
          Get.put(BookingController());
        }),

        home: LoginScreen(),
      ),
    );
  }
}
