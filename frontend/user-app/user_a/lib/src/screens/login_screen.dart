import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'register_screen.dart';
import 'package:user_a/src/controllers/theme_controller.dart';
import 'package:user_a/src/controllers/language_controller.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeController = Get.find<ThemeController>();
    final langController = Get.find<LanguageController>();

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        actions: [

          // 🌙 Dark Mode Toggle
          Obx(
            () => IconButton(
              icon: Icon(
                themeController.isDark.value
                    ? Icons.dark_mode
                    : Icons.light_mode,
              ),
              onPressed: themeController.toggleTheme,
            ),
          ),

          // 🌐 Language Toggle
          Obx(
            () => TextButton(
              onPressed: () {
                if (langController.locale.value.languageCode == 'en') {
                  langController.changeLanguage('ar');
                } else {
                  langController.changeLanguage('en');
                }
              },
              child: Text(
                langController.locale.value.languageCode == 'en'
                    ? "AR"
                    : "EN",
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),

      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [

                const SizedBox(height: 60),

                Text(
                  "welcome_back".tr,
                  style: Theme.of(context)
                      .textTheme
                      .headlineMedium
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),

                const SizedBox(height: 10),

                Text(
                  "login_continue".tr,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),

                const SizedBox(height: 40),

                TextField(
                  decoration: InputDecoration(
                    labelText: "email".tr,
                    border: const OutlineInputBorder(),
                  ),
                ),

                const SizedBox(height: 15),

                TextField(
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: "password".tr,
                    border: const OutlineInputBorder(),
                  ),
                ),

                const SizedBox(height: 25),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Get.snackbar(
                        "login".tr,
                        "login_clicked".tr,
                        snackPosition: SnackPosition.BOTTOM,
                      );
                    },

                    // 🔥 THIS WAS THE PROBLEM
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      child: Text(
                        "login".tr,
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                Center(
                  child: TextButton(
                    onPressed: () {
                      Get.to(() => const RegisterScreen());
                    },
                    child: Text("no_account_register".tr),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
