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
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Enter the OTP sent to your email / mobile",
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 20),
            const TextField(
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: "OTP",
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 30),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  // fake OTP success
                  Get.offAll(() => const HomeScreen());
                },
                child: const Text("Verify OTP"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
