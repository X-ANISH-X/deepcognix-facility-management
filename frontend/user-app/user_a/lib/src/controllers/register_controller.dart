import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:user_a/src/services/api_client.dart';

class RegisterController extends GetxController {
  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  final _api = ApiClient();
  final isLoading = false.obs;

  Future<void> onRegisterPressed() async {
    final name = nameController.text.trim();
    final email = emailController.text.trim();
    final password = passwordController.text;

    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      Get.snackbar(
        'Error',
        'Please fill in all fields',
        snackPosition: SnackPosition.BOTTOM,
      );
      return;
    }

    try {
      isLoading.value = true;
      await _api.post('/auth/register', {
        'full_name': name,
        'email': email,
        'password': password,
        'role': 'customer',
      });
      Get.snackbar(
        'Account Created',
        'You can now log in.',
        snackPosition: SnackPosition.BOTTOM,
      );
      Get.back(); // return to login screen
    } catch (e) {
      Get.snackbar(
        'Registration Failed',
        e.toString().replaceFirst('Exception: ', ''),
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
    passwordController.dispose();
    super.onClose();
  }
}
