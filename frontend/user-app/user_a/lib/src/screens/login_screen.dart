import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/themes/colors.dart';
import 'register_screen.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Welcome Back",
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              "Login to continue",
              style: TextStyle(
                fontSize: 16,
                color: AppColors.textLight,
              ),
            ),
            const SizedBox(height: 40),

            TextField(
              decoration: const InputDecoration(
                labelText: "Email",
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 15),

            TextField(
              obscureText: true,
              decoration: const InputDecoration(
                labelText: "Password",
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 25),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {
                  // fake login for now
                  Get.snackbar(
                    "Login",
                    "Login clicked (no backend yet)",
                    snackPosition: SnackPosition.BOTTOM,
                  );
                },
                child: const Text(
                  "LOGIN",
                  style: TextStyle(fontSize: 16),
                ),
              ),
            ),

            const SizedBox(height: 20),

            Center(
              child: TextButton(
                onPressed: () {
                  Get.to(() => const RegisterScreen());
                },
                child: const Text(
                  "Don't have an account? Register",
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
