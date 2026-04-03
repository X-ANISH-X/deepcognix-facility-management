import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/booking_controller.dart';

class MapPickerScreen extends StatelessWidget {
  MapPickerScreen({super.key});

  final BookingController controller = Get.find<BookingController>();
  final TextEditingController addressController = TextEditingController();

  @override
  Widget build(BuildContext context) {

    /// Pre-fill if already selected
    addressController.text = controller.selectedAddress.value;

    return Scaffold(
      appBar: AppBar(
        title: Text('select_location'.tr),
        elevation: 0,
      ),

      body: Padding(
        padding: const EdgeInsets.all(20),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            const Text(
              "Enter your address",
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),

            const SizedBox(height: 20),

            TextField(
              controller: addressController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: "Flat / Building / Area / Landmark",
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {

                  final address = addressController.text.trim();

                  if (address.isEmpty) {
                    Get.snackbar(
                      "Error",
                      "Please enter address",
                      snackPosition: SnackPosition.BOTTOM,
                    );
                    return;
                  }

                  /// 🔥 SAVE ADDRESS
                  controller.selectedAddress.value = address;

                  if (!controller.addresses.contains(address)) {
                    controller.addresses.add(address);
                  }

                  Get.back();
                },
                child: Text('confirm_location'.tr),
              ),
            ),
          ],
        ),
      ),
    );
  }
}