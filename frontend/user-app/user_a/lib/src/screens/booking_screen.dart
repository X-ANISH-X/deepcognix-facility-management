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
      appBar: AppBar(title: const Text("Select Package")),

      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            /// PACKAGES
            ...packages.map((p) => Obx(() => Card(
              child: ListTile(
                title: Text(p["title"] as String),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("₹${p["price"]}"),
                    ...((p["desc"] as List<String>)
                        .map((e) => Text("• $e")))
                  ],
                ),
                trailing: controller.packageId.value == p["id"]
                    ? const Icon(Icons.check, color: Colors.green)
                    : null,
                onTap: () {
                  controller.packageId.value = p["id"] as int;
                  controller.price.value =
                      (p["price"] as int).toDouble();
                },
              ),
            ))),

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
            TextField(
              decoration: const InputDecoration(
                labelText: "Enter Address",
                border: OutlineInputBorder(),
              ),
              onChanged: (val) {
                controller.selectedAddress.value = val;
              },
            ),

            const SizedBox(height: 20),

            /// DATE
            ElevatedButton(
              onPressed: () async {
                final picked = await showDatePicker(
                  context: context,
                  firstDate: DateTime.now().add(const Duration(days: 1)),
                  lastDate: DateTime.now().add(const Duration(days: 30)),
                  initialDate: DateTime.now().add(const Duration(days: 1)),
                );

                if (picked != null) {
                  controller.selectedDate.value =
                      picked.toString().split(" ")[0];
                  controller.loadSlotsForDate(picked);
                }
              },
              child: const Text("Select Date"),
            ),

            const SizedBox(height: 10),

            /// TIME
            Obx(() => Wrap(
              spacing: 10,
              children: controller.availableSlots.map((slot) {
                return ChoiceChip(
                  label: Text(slot),
                  selected: controller.selectedTime.value == slot,
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