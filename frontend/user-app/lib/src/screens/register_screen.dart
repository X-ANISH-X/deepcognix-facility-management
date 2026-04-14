import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/register_controller.dart';
import 'package:user_a/src/controllers/theme_controller.dart';

class RegisterScreen extends GetView<RegisterController> {
  RegisterScreen({super.key});

  final themeController = Get.find<ThemeController>();

  final formKey = GlobalKey<FormState>();
  final confirmPasswordController = TextEditingController();

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: Text("register".tr),
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
        child: Padding(
          padding: const EdgeInsets.all(20),

          child: Form(
            key: formKey,

            child: SingleChildScrollView(
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

                  /// NAME
                  TextFormField(
                    controller: controller.nameController,
                    decoration: InputDecoration(
                      labelText: "name".tr,
                      border: const OutlineInputBorder(),
                    ),
                  ),

                  const SizedBox(height: 15),

                  /// EMAIL
                  TextFormField(
                    controller: controller.emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: "email".tr,
                      border: const OutlineInputBorder(),
                    ),
                  ),

                  const SizedBox(height: 15),

                  /// PHONE
                  TextFormField(
                    controller: controller.phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: "phone_number".tr,
                      border: const OutlineInputBorder(),
                    ),
                  ),

                  const SizedBox(height: 15),

                  /// PASSWORD (🔥 FIXED)
                  TextFormField(
                    controller: controller.passwordController,
                    obscureText: true,
                    maxLength: 72,
                    enableSuggestions: false,
                    autocorrect: false,
                    autofillHints: null, // 🔥 KILLS hidden junk
                    decoration: const InputDecoration(
                      labelText: "Password",
                      border: OutlineInputBorder(),
                      counterText: "", // hides 72 counter UI
                    ),
                  ),

                  const SizedBox(height: 15),

                  /// CONFIRM PASSWORD
                  TextFormField(
                    controller: confirmPasswordController,
                    obscureText: true,
                    maxLength: 72,
                    enableSuggestions: false,
                    autocorrect: false,
                    autofillHints: null,
                    decoration: const InputDecoration(
                      labelText: "Confirm Password",
                      border: OutlineInputBorder(),
                      counterText: "",
                    ),
                  ),

                  const SizedBox(height: 30),

                  /// REGISTER BUTTON
                  SizedBox(
                    width: double.infinity,
                    child: Obx(() => ElevatedButton(
                          onPressed: controller.isLoading.value
                              ? null
                              : () {

                                  final pass =
                                      controller.passwordController.text.trim();
                                  final confirm =
                                      confirmPasswordController.text.trim();

                                  if (pass != confirm) {
                                    Get.snackbar(
                                        "Error", "Passwords do not match");
                                    return;
                                  }

                                  controller.onRegisterPressed();
                                },
                          child: Padding(
                            padding:
                                const EdgeInsets.symmetric(vertical: 14),
                            child: controller.isLoading.value
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
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
        ),
      ),
    );
  }
}