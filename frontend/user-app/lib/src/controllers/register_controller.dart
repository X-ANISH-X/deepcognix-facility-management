import 'package:get/get.dart';
import 'package:flutter/material.dart';
import '../services/api_client.dart';

class RegisterController extends GetxController {

  final ApiClient _api = ApiClient();

  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final phoneController = TextEditingController();
  final passwordController = TextEditingController();

  var isLoading = false.obs;

  Future<void> onRegisterPressed() async {

    final name = nameController.text.trim();
    final email = emailController.text.trim();
    final phone = phoneController.text.trim();

    /// 🔥 RAW PASSWORD
    final rawPassword = passwordController.text;

    /// 🔥 CLEAN PASSWORD (THIS IS THE FIX)
    final password = rawPassword
        .trim()
        .replaceAll(RegExp(r'[^\x20-\x7E]'), '') // remove invisible unicode
        .replaceAll(RegExp(r'\s+'), ''); // remove spaces, tabs, newlines

    /// 🔍 DEBUG (you'll finally see truth)
    debugPrint("RAW LENGTH: ${rawPassword.length}");
    debugPrint("CLEAN LENGTH: ${password.length}");
    debugPrint("PASSWORD: [$password]");

    /// VALIDATIONS
    if (name.isEmpty || email.isEmpty || phone.isEmpty || password.isEmpty) {
      Get.snackbar("Error", "All fields are required");
      return;
    }

    if (!email.contains("@")) {
      Get.snackbar("Error", "Enter a valid email");
      return;
    }

    if (phone.length < 8) {
      Get.snackbar("Error", "Enter valid phone number");
      return;
    }

    /// 🔥 FINAL PASSWORD CHECK (REAL ONE)
    if (password.length > 72) {
      Get.snackbar("Error", "Password too long (max 72 characters)");
      return;
    }

    if (password.length < 6) {
      Get.snackbar("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      isLoading.value = true;

      await _api.post("/auth/register", {
        "full_name": name,
        "email": email,
        "password": password,
        "phone_number": phone,
      });

      Get.snackbar(
        "Success",
        "Account created successfully",
        snackPosition: SnackPosition.BOTTOM,
      );

      /// 🔥 CLEAR AFTER SUCCESS (prevents ghost values)
      passwordController.clear();

      Get.offAllNamed('/login');

    } catch (e) {

      String message = e.toString();

      if (message.contains("72 bytes")) {
        message = "Password too long (max 72 characters)";
      }

      Get.snackbar(
        "Error",
        message.replaceFirst("Exception: ", ""),
        snackPosition: SnackPosition.BOTTOM,
      );

    } finally {
      isLoading.value = false;
    }
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