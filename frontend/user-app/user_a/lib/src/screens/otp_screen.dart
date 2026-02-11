import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'home_screen.dart';

class OtpScreen extends StatelessWidget {
  const OtpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("OTP Verification"),
        centerTitle: false,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              const SizedBox(height: 20),

              Text(
                "Verification",
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),

              const SizedBox(height: 8),

              Text(
                "Enter the code sent to your email and phone",
                style: Theme.of(context).textTheme.bodyMedium,
              ),

              const SizedBox(height: 30),

              TextField(
                keyboardType: TextInputType.number,
                maxLength: 6,
                decoration: const InputDecoration(
                  labelText: "Enter OTP",
                  border: OutlineInputBorder(),
                  counterText: "",
                ),
              ),

              const SizedBox(height: 30),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    // Fake OTP success
                    Get.offAll(() => const HomeScreen());
                  },
                  child: const Padding(
                    padding: EdgeInsets.symmetric(vertical: 14),
                    child: Text(
                      "Verify OTP",
                      style: TextStyle(fontSize: 16),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 20),

              Center(
                child: TextButton(
                  onPressed: () {
                    Get.snackbar(
                      "OTP Sent",
                      "A new OTP has been sent",
                      snackPosition: SnackPosition.BOTTOM,
                    );
                  },
                  child: const Text("Resend Code"),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
