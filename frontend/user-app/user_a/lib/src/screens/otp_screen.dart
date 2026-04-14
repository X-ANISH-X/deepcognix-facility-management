import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:user_a/src/controllers/theme_controller.dart';
import 'package:user_a/src/controllers/auth_controller.dart';

class OtpScreen extends StatefulWidget {
  OtpScreen({super.key});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {

  final ThemeController themeController = Get.find<ThemeController>();
  final AuthController authController = Get.find<AuthController>();
  final TextEditingController otpController = TextEditingController();

  @override
  void dispose() {
    otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("otp_verification".tr),
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              const SizedBox(height: 20),

              Text(
                "verification".tr,
                style: Theme.of(context)
                    .textTheme
                    .headlineMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 8),

              Text(
                "otp_instruction".tr,
                style: Theme.of(context).textTheme.bodyMedium,
              ),

              const SizedBox(height: 30),

              TextField(
                controller: otpController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                decoration: InputDecoration(
                  labelText: "enter_otp".tr,
                  border: const OutlineInputBorder(),
                  counterText: "",
                ),
              ),

              const SizedBox(height: 30),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    // OTP not implemented server-side; navigate to login
                    Get.offAllNamed('/login');
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    child: Text(
                      "verify_otp".tr,
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 20),

              Center(
                child: TextButton(
                  onPressed: () async {

                    Get.snackbar(
                      "OTP Sent",
                      "A new OTP has been generated",
                      snackPosition: SnackPosition.BOTTOM,
                    );

                    await Future.delayed(
                      const Duration(seconds: 1),
                    );

                  },
                  child: Text("resend_code".tr),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}