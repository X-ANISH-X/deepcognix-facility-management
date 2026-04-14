import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/booking_controller.dart';

class BookingScreen extends StatelessWidget {
  BookingScreen({super.key});

  final controller = Get.find<BookingController>();

  final packages = [
    {
      "id": 1,
      "title": "Silver Package",
      "price": 499,
      "desc": [
        "Dusting & mopping",
        "Kitchen cleaning",
        "Bathroom cleaning",
        "Balcony cleaning"
      ]
    },
    {
      "id": 2,
      "title": "Gold Package",
      "price": 799,
      "desc": [
        "Includes Silver",
        "Deep tile cleaning",
        "Appliance cleaning",
        "Sofa vacuum"
      ]
    },
    {
      "id": 3,
      "title": "Platinum Package",
      "price": 1199,
      "desc": [
        "Includes Gold",
        "Steam sanitization",
        "Mattress cleaning",
        "AC vent cleaning"
      ]
    },
  ];

  final addOns = [
    {"name": "Carpet Cleaning", "price": 200},
    {"name": "Sofa Shampoo", "price": 300},
    {"name": "AC Cleaning", "price": 400},
  ];

  final selectedAddOns = <String>[].obs;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7F9),
      appBar: AppBar(
        title: const Text("Select Package"),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),

      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            /// PACKAGES
            ...packages.map((p) => Obx(() {
              final selected = controller.packageId.value == p["id"];

              return GestureDetector(
                onTap: () {
                  controller.packageId.value = p["id"] as int;
                  controller.price.value =
                      (p["price"] as int).toDouble();
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: selected
                        ? const Color(0xFFE6F7F5)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: selected
                          ? const Color(0xFF0E8F83)
                          : Colors.grey.shade300,
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      )
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment:
                            MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            p["title"] as String,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            "₹${p["price"]}",
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0E8F83),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ...((p["desc"] as List<String>)
                          .map((e) => Padding(
                                padding:
                                    const EdgeInsets.only(bottom: 4),
                                child: Text("• $e"),
                              ))),
                    ],
                  ),
                ),
              );
            })),

            const SizedBox(height: 20),

            /// ADD-ONS
            const Text("Add-on Services",
                style: TextStyle(fontWeight: FontWeight.bold)),

            const SizedBox(height: 10),

            Wrap(
              spacing: 10,
              children: addOns.map((a) {
                return Obx(() => FilterChip(
                  label: Text("${a["name"]} (+₹${a["price"]})"),
                  selected: selectedAddOns.contains(a["name"]),
                  selectedColor: const Color(0xFF0E8F83),
                  labelStyle: TextStyle(
                    color: selectedAddOns.contains(a["name"])
                        ? Colors.white
                        : Colors.black,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  onSelected: (val) {
                    if (val) {
                      selectedAddOns.add(a["name"] as String);
                      controller.price.value += a["price"] as int;
                    } else {
                      selectedAddOns.remove(a["name"]);
                      controller.price.value -= a["price"] as int;
                    }
                  },
                ));
              }).toList(),
            ),

            const SizedBox(height: 20),

            /// ADDRESS
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border:
                    Border.all(color: Colors.grey.shade300),
              ),
              child: TextField(
                decoration: const InputDecoration(
                  labelText: "Enter Address",
                  border: InputBorder.none,
                ),
                onChanged: (val) {
                  controller.selectedAddress.value = val;
                },
              ),
            ),

            const SizedBox(height: 20),

            /// DATE
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0E8F83),
                  padding:
                      const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: () async {
                  final picked = await showDatePicker(
                    context: context,
                    firstDate:
                        DateTime.now().add(const Duration(days: 1)),
                    lastDate:
                        DateTime.now().add(const Duration(days: 30)),
                    initialDate:
                        DateTime.now().add(const Duration(days: 1)),
                  );

                  if (picked != null) {
                    controller.selectedDate.value =
                        picked.toString().split(" ")[0];
                    controller.loadSlotsForDate(picked);
                  }
                },
                child: const Text("Select Date"),
              ),
            ),

            const SizedBox(height: 10),

            /// TIME
            Obx(() => Wrap(
              spacing: 10,
              children: controller.availableSlots.map((slot) {
                final selected =
                    controller.selectedTime.value == slot;

                return ChoiceChip(
                  label: Text(slot),
                  selected: selected,
                  selectedColor: const Color(0xFF0E8F83),
                  labelStyle: TextStyle(
                    color: selected
                        ? Colors.white
                        : Colors.black,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  onSelected: (_) {
                    controller.selectedTime.value = slot;
                  },
                );
              }).toList(),
            )),

            const SizedBox(height: 30),

            /// BOOK BUTTON
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0E8F83),
                  padding:
                      const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                onPressed: () async {
                  await controller.createBooking();
                  Get.toNamed('/tracking');
                },
                child: const Text("Confirm Booking"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}