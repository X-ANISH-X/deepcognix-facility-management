import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/screens/live_tracking_screen.dart';

class BookingDetailsScreen extends GetView<BookingController> {
  const BookingDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'booking_details'.tr,
          style: const TextStyle(fontWeight: FontWeight.w600),
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

              _sectionTitle(context, 'select_date'.tr),
              const SizedBox(height: 8),
              _inputTile(
                context,
                text: controller.selectedDate.value.isEmpty
                    ? 'choose_date'.tr
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

              _sectionTitle(context, 'select_time'.tr),
              const SizedBox(height: 8),
              _inputTile(
                context,
                text: controller.selectedTime.value.isEmpty
                    ? 'choose_time'.tr
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

              _sectionTitle(context, 'service_location'.tr),
              const SizedBox(height: 8),
              _inputTile(
                context,
                text: controller.selectedAddress.value.isEmpty
                    ? 'select_address'.tr
                    : controller.selectedAddress.value,
                onTap: () {
                  _showAddressBottomSheet(context);
                },
              ),

              const SizedBox(height: 20),

              _sectionTitle(context, 'payment_method'.tr),
              const SizedBox(height: 8),

              RadioListTile<String>(
                value: 'pay_now',
                groupValue: controller.paymentMethod.value,
                onChanged: (val) {
                  controller.paymentMethod.value = val!;
                },
                title: Text('pay_now'.tr),
              ),

              RadioListTile<String>(
                value: 'pay_later',
                groupValue: controller.paymentMethod.value,
                onChanged: (val) {
                  controller.paymentMethod.value = val!;
                },
                title: Text('pay_later'.tr),
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
                        "incomplete_details".tr,
                        "select_all_details".tr,
                        snackPosition: SnackPosition.BOTTOM,
                      );
                      return;
                    }

                    // 🔥 GO TO LIVE TRACKING NOW
                    Get.to(() => LiveTrackingScreen());
                  },
                  child: Text(
                    'confirm_booking'.tr,
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionTitle(BuildContext context, String text) {
    return Text(
      text,
      style: Theme.of(context)
          .textTheme
          .titleSmall
          ?.copyWith(fontWeight: FontWeight.w600),
    );
  }

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
              "select_address".tr,
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
              title: Text("add_new_address".tr),
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

  void _showAddAddressDialog(BuildContext context) {
    final TextEditingController addressController =
        TextEditingController();

    Get.defaultDialog(
      title: "new_address".tr,
      content: TextField(
        controller: addressController,
        decoration: InputDecoration(
          hintText: "enter_address".tr,
        ),
      ),
      textConfirm: "add".tr,
      textCancel: "cancel".tr,
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