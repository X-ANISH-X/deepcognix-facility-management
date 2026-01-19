import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:user_a/src/screens/otp_screen.dart';


class RegisterController extends GetxController {
  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

void onRegisterPressed() {
  print(nameController.text);
  print(emailController.text);
  print(passwordController.text);

  Get.to(() => const OtpScreen());
}


  @override
  void onClose() {
    nameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    super.onClose();
  }
}
