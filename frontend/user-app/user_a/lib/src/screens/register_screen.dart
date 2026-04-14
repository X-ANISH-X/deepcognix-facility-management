import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/register_controller.dart';
import 'package:user_a/src/controllers/theme_controller.dart';

class RegisterScreen extends GetView<RegisterController> {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeController = Get.find<ThemeController>();

    return Scaffold(
      appBar: AppBar(
        title: Text("register".tr),
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
              onPressed: themeController.toggleTheme,
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              const SizedBox(height: 20),

              Text(
                "create_account".tr,
                style: Theme.of(context)
                    .textTheme
                    .headlineMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 8),

              Text(
                "register_subtitle".tr,
                style: Theme.of(context).textTheme.bodyMedium,
              ),

              const SizedBox(height: 30),

              TextField(
                controller: controller.nameController,
                decoration: InputDecoration(
                  labelText: "name".tr,
                  border: const OutlineInputBorder(),
                ),
              ),

              const SizedBox(height: 15),

              TextField(
                controller: controller.emailController,
                decoration: InputDecoration(
                  labelText: "email".tr,
                  border: const OutlineInputBorder(),
                ),
              ),

              const SizedBox(height: 15),

              TextField(
                controller: controller.passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: "password".tr,
                  border: const OutlineInputBorder(),
                ),
              ),

              const SizedBox(height: 30),

              SizedBox(
                width: double.infinity,
                child: Obx(() => ElevatedButton(
                  onPressed: controller.isLoading.value
                      ? null
                      : () => controller.onRegisterPressed(),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    child: controller.isLoading.value
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            "create_account".tr,
                            style: const TextStyle(fontSize: 16),
                          ),
                  ),
                )),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
