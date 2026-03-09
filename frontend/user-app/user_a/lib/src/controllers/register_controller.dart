import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:user_a/src/controllers/auth_controller.dart';

class RegisterController extends GetxController {

  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final phoneController = TextEditingController();
  final passwordController = TextEditingController();

  final authController = Get.find<AuthController>();

  void onRegisterPressed() {

    final name = nameController.text.trim();
    final email = emailController.text.trim();
    final phone = phoneController.text.trim();
    final password = passwordController.text.trim();

    if (name.isEmpty ||
        email.isEmpty ||
        phone.isEmpty ||
        password.isEmpty) {

      Get.snackbar('Error', 'please_fill_all_fields'.tr);
      return;
    }

    authController.register(
      name,
      email,
      phone,
      password,
    );
  }

  @override
  void onClose() {
    nameController.dispose();
    emailController.dispose();
    phoneController.dispose();
    passwordController.dispose();
    super.onClose();
  }
}