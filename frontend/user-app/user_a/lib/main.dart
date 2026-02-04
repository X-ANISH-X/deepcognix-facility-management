import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'src/screens/login_screen.dart';
import 'src/controllers/register_controller.dart';
import 'src/controllers/home_controller.dart';
import 'src/controllers/package_controller.dart';


void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'User App',

      theme: ThemeData(
        primaryColor: Colors.teal,
        scaffoldBackgroundColor: Colors.white,
      ),

      initialBinding: BindingsBuilder(() {
        Get.put(RegisterController());
        Get.put(HomeController());
        Get.put(PackageController());

      }),

      home: LoginScreen(),
    );
  }
}
