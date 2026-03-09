import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/screens/map_picker_screen.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:user_a/src/screens/upcoming_bookings_screen.dart';

class BookingDetailsScreen extends GetView<BookingController> {

  final String packageId;
  final String serviceId;
  final double price;

  BookingDetailsScreen({
    super.key,
    required this.packageId,
    required this.serviceId,
    required this.price,
  });

  final addons = <String, double>{
    "Carpet cleaning": 40,
    "Curtain cleaning": 30,
    "Sofa shampoo": 50,
    "Refrigerator deep cleaning": 25,
    "Oven deep cleaning": 25,
    "AC duct cleaning": 60,
    "Disinfection service": 35,
  };

  final selectedAddons = <String>[].obs;

  double getAddonsTotal() {
    double total = 0;
    for (var a in selectedAddons) {
      total += addons[a] ?? 0;
    }
    return total;
  }

  @override
  Widget build(BuildContext context) {

    controller.packageId.value = packageId;
    controller.serviceId.value = serviceId;
    controller.price.value = price;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'booking_details'.tr,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
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

                  final minDate =
                      DateTime.now().add(const Duration(hours: 24));

                  final pickedDate = await showDatePicker(
                    context: context,
                    initialDate: minDate,
                    firstDate: minDate,
                    lastDate: DateTime(2030),
                  );

                  if (pickedDate != null) {
                    controller.selectedDate.value =
                        "${pickedDate.day}/${pickedDate.month}/${pickedDate.year}";
                    controller.loadSlotsForDate(pickedDate);
                  }
                },
              ),

              const SizedBox(height: 20),

              _sectionTitle(context, 'select_time'.tr),
              const SizedBox(height: 8),

              if (controller.isLoadingSlots.value)
                const Center(child: CircularProgressIndicator())
              else if (controller.availableSlots.isEmpty)
                Text('no_slots'.tr)
              else
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children:
                      controller.availableSlots.map((slot) {

                    final selected =
                        slot == controller.selectedTime.value;

                    return ChoiceChip(
                      label: Text(slot),
                      selected: selected,
                      onSelected: (val) {
                        if (val) {
                          controller.selectedTime.value = slot;
                        }
                      },
                    );
                  }).toList(),
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

              /// ADD-ONS
              _sectionTitle(context, "Optional Add-ons"),

              const SizedBox(height: 10),

              Expanded(
                child: ListView(
                  children: addons.entries.map((entry) {

                    final selected =
                        selectedAddons.contains(entry.key);

                    return CheckboxListTile(
                      value: selected,
                      title: Text(entry.key),
                      subtitle: Text("\$${entry.value}"),
                      onChanged: (v) {
                        if (v == true) {
                          selectedAddons.add(entry.key);
                        } else {
                          selectedAddons.remove(entry.key);
                        }
                      },
                    );
                  }).toList(),
                ),
              ),

              /// PRICE SUMMARY
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: Theme.of(context).cardColor,
                ),
                child: Column(
                  children: [

                    Row(
                      mainAxisAlignment:
                          MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Package Price"),
                        Text("\$${price.toStringAsFixed(0)}"),
                      ],
                    ),

                    const SizedBox(height: 6),

                    Row(
                      mainAxisAlignment:
                          MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Add-ons"),
                        Text("\$${getAddonsTotal().toStringAsFixed(0)}"),
                      ],
                    ),

                    const Divider(),

                    Row(
                      mainAxisAlignment:
                          MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          "Total",
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          "\$${(price + getAddonsTotal()).toStringAsFixed(0)}",
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {

                    if (controller.selectedDate.value.isEmpty ||
                        controller.selectedTime.value.isEmpty ||
                        controller.selectedAddress.value.isEmpty) {

                      Get.snackbar(
                        "Incomplete",
                        "Please select all booking details",
                        snackPosition: SnackPosition.BOTTOM,
                      );
                      return;
                    }

                    await controller.createBooking();

                    Get.offAll(() =>
                        const UpcomingBookingsScreen());
                  },
                  style: ElevatedButton.styleFrom(
                    padding:
                        const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(16),
                    ),
                  ),
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
            Expanded(child: Text(text)),
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

            ...controller.addresses.map(
              (address) => ListTile(
                title: Text(address),
                onTap: () {
                  controller.selectedAddress.value = address;
                  Get.back();
                },
              ),
            ),

            const Divider(),

            ListTile(
              leading: const Icon(Icons.add),
              title: Text("add_new_address".tr),
              onTap: () async {

                Get.back();

                final latLng =
                    await Get.to(() => const MapPickerScreen());

                if (latLng is LatLng) {
                  controller.selectedLat.value =
                      latLng.latitude;
                  controller.selectedLng.value =
                      latLng.longitude;
                  controller.selectedAddress.value =
                      "Lat:${latLng.latitude}, Lng:${latLng.longitude}";
                  controller.addAddress(
                      controller.selectedAddress.value);
                }
              },
            ),
          ],
        ),
      ),
      isScrollControlled: true,
    );
  }
}