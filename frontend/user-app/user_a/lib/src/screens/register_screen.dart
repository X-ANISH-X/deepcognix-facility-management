import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:user_a/src/controllers/register_controller.dart';

class RegisterScreen extends GetView<RegisterController> {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Register"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            TextField(
              controller: controller.nameController,
              decoration: const InputDecoration(labelText: "Name"),
            ),
            const SizedBox(height: 15),
            TextField(
              controller: controller.emailController,
              decoration: const InputDecoration(labelText: "Email"),
            ),
            const SizedBox(height: 15),
            TextField(
              controller: controller.passwordController,
              obscureText: true,
              decoration: const InputDecoration(labelText: "Password"),
            ),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: controller.onRegisterPressed,
              child: const Text("Create Account"),
            ),
          ],
        ),
      ),
    );
  }
}
