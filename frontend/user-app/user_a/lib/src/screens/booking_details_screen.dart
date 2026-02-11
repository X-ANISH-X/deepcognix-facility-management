import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/screens/booking_status_screen.dart';

class BookingDetailsScreen extends GetView<BookingController> {
  const BookingDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Booking Details',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        centerTitle: false,
        elevation: 0,
      ),
      body: Obx(
        () => Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              _sectionTitle(context, 'Select Date'),
              const SizedBox(height: 8),
              _inputTile(
                context,
                text: controller.selectedDate.value.isEmpty
                    ? 'Choose date'
                    : controller.selectedDate.value,
                onTap: () async {
                  final pickedDate = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now(),
                    firstDate: DateTime.now(),
                    lastDate: DateTime(2030),
                  );

                  if (pickedDate != null) {
                    controller.selectedDate.value =
                        "${pickedDate.day}/${pickedDate.month}/${pickedDate.year}";
                  }
                },
              ),

              const SizedBox(height: 20),

              _sectionTitle(context, 'Select Time'),
              const SizedBox(height: 8),
              _inputTile(
                context,
                text: controller.selectedTime.value.isEmpty
                    ? 'Choose time'
                    : controller.selectedTime.value,
                onTap: () async {
                  final pickedTime = await showTimePicker(
                    context: context,
                    initialTime: TimeOfDay.now(),
                  );

                  if (pickedTime != null) {
                    controller.selectedTime.value =
                        pickedTime.format(context);
                  }
                },
              ),

              const SizedBox(height: 20),

              _sectionTitle(context, 'Service Location'),
              const SizedBox(height: 8),
              _inputTile(
                context,
                text: controller.selectedAddress.value.isEmpty
                    ? 'Select address'
                    : controller.selectedAddress.value,
                onTap: () {
                  _showAddressBottomSheet(context);
                },
              ),

              const SizedBox(height: 20),

              _sectionTitle(context, 'Payment Method'),
              const SizedBox(height: 8),

              RadioListTile<String>(
                value: 'pay_now',
                groupValue: controller.paymentMethod.value,
                onChanged: (val) {
                  controller.paymentMethod.value = val!;
                },
                title: const Text('Pay Now'),
              ),

              RadioListTile<String>(
                value: 'pay_later',
                groupValue: controller.paymentMethod.value,
                onChanged: (val) {
                  controller.paymentMethod.value = val!;
                },
                title: const Text('Pay on Completion'),
              ),

              const Spacer(),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    padding:
                        const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: () {
                    if (controller.selectedDate.value.isEmpty ||
                        controller.selectedTime.value.isEmpty ||
                        controller.selectedAddress.value.isEmpty) {

                      Get.snackbar(
                        "Incomplete Details",
                        "Please select date, time and address",
                        snackPosition: SnackPosition.BOTTOM,
                      );
                      return;
                    }

                    Get.to(() => const BookingStatusScreen());
                  },
                  child: const Text(
                    'Confirm Booking',
                    style: TextStyle(fontSize: 16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------- SECTION TITLE ----------------

  Widget _sectionTitle(BuildContext context, String text) {
    return Text(
      text,
      style: Theme.of(context)
          .textTheme
          .titleSmall
          ?.copyWith(fontWeight: FontWeight.w600),
    );
  }

  // ---------------- INPUT TILE ----------------

  Widget _inputTile(
    BuildContext context, {
    required String text,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Theme.of(context).dividerColor,
          ),
        ),
        child: Row(
          mainAxisAlignment:
              MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                text,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium,
              ),
            ),
            const Icon(Icons.chevron_right),
          ],
        ),
      ),
    );
  }

  // ---------------- ADDRESS BOTTOM SHEET ----------------

  void _showAddressBottomSheet(BuildContext context) {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(24),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              "Select Address",
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 20),

            ...controller.addresses.map(
              (address) => ListTile(
                title: Text(address),
                trailing:
                    const Icon(Icons.chevron_right),
                onTap: () {
                  controller.selectedAddress.value =
                      address;
                  Get.back();
                },
              ),
            ),

            const Divider(),

            ListTile(
              leading: const Icon(Icons.add),
              title: const Text("Add New Address"),
              onTap: () {
                Get.back();
                _showAddAddressDialog(context);
              },
            ),
          ],
        ),
      ),
      isScrollControlled: true,
    );
  }

  // ---------------- ADD ADDRESS DIALOG ----------------

  void _showAddAddressDialog(BuildContext context) {
    final TextEditingController addressController =
        TextEditingController();

    Get.defaultDialog(
      title: "New Address",
      content: TextField(
        controller: addressController,
        decoration: const InputDecoration(
          hintText: "Enter address",
        ),
      ),
      textConfirm: "Add",
      textCancel: "Cancel",
      onConfirm: () {
        if (addressController.text.trim().isNotEmpty) {
          controller.addAddress(
              addressController.text.trim());
          controller.selectedAddress.value =
              addressController.text.trim();
          Get.back();
        }
      },
    );
  }
}
