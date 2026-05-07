
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/booking_controller.dart';

class BookingScreen extends StatelessWidget {
  BookingScreen({super.key});

  final BookingController controller =
      Get.find<BookingController>();

  final TextEditingController addressCtrl =
      TextEditingController();

  final TextEditingController buildingCtrl =
      TextEditingController();

  final TextEditingController floorCtrl =
      TextEditingController();

  final TextEditingController apartmentCtrl =
      TextEditingController();

  final TextEditingController instructionCtrl =
      TextEditingController();

  final TextEditingController technicianCtrl =
      TextEditingController();

  final TextEditingController parkingCtrl =
      TextEditingController();

  final TextEditingController petCtrl =
      TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor:
          const Color(0xFFF5F7F9),

      appBar: AppBar(
        title: const Text(
          "Booking Details",
        ),

        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),

      body: SingleChildScrollView(
        padding:
            const EdgeInsets.all(16),

        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,

          children: [

            // =====================================================
            // ADDRESS
            // =====================================================
            const _SectionTitle(
              "Address Details",
            ),

            const SizedBox(height: 14),

            _InputField(
              controller: addressCtrl,
              label: "Address",
              onChanged: (v) =>
                  controller
                      .selectedAddress
                      .value = v,
            ),

            const SizedBox(height: 12),

            _InputField(
              controller: buildingCtrl,
              label: "Building Name",
              onChanged: (v) =>
                  controller
                      .buildingName
                      .value = v,
            ),

            const SizedBox(height: 12),

            Row(
              children: [

                Expanded(
                  child: _InputField(
                    controller:
                        floorCtrl,

                    label: "Floor",

                    onChanged: (v) =>
                        controller
                            .floorNumber
                            .value = v,
                  ),
                ),

                const SizedBox(width: 12),

                Expanded(
                  child: _InputField(
                    controller:
                        apartmentCtrl,

                    label:
                        "Apartment No",

                    onChanged: (v) =>
                        controller
                            .apartmentNumber
                            .value = v,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 28),

            // =====================================================
            // DATE
            // =====================================================
            const _SectionTitle(
              "Schedule",
            ),

            const SizedBox(height: 14),

            SizedBox(
              width: double.infinity,

              child: ElevatedButton(
                onPressed: () async {

                  final picked =
                      await showDatePicker(
                    context: context,

                    firstDate:
                        DateTime.now(),

                    lastDate:
                        DateTime.now()
                            .add(
                      const Duration(
                        days: 30,
                      ),
                    ),

                    initialDate:
                        DateTime.now(),
                  );

                  if (picked != null) {

                    controller
                        .selectedDate
                        .value = picked
                            .toString()
                            .split(" ")[0];

                    controller
                        .loadSlotsForDate(
                      picked,
                    );
                  }
                },

                style:
                    ElevatedButton
                        .styleFrom(
                  backgroundColor:
                      const Color(
                    0xFF0F9D8A,
                  ),

                  padding:
                      const EdgeInsets
                          .symmetric(
                    vertical: 14,
                  ),

                  shape:
                      RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius
                            .circular(
                      14,
                    ),
                  ),
                ),

                child: Obx(
                  () => Text(
                    controller
                            .selectedDate
                            .value
                            .isEmpty
                        ? "Select Date"
                        : controller
                            .selectedDate
                            .value,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // =====================================================
            // TIME SLOTS
            // =====================================================
            Obx(
              () => Wrap(
                spacing: 10,
                runSpacing: 10,

                children: controller
                    .availableSlots
                    .map(
                      (slot) {

                        final selected =
                            controller
                                    .selectedTime
                                    .value ==
                                slot;

                        return ChoiceChip(
                          label:
                              Text(slot),

                          selected:
                              selected,

                          selectedColor:
                              const Color(
                            0xFF0F9D8A,
                          ),

                          labelStyle:
                              TextStyle(
                            color:
                                selected
                                    ? Colors
                                        .white
                                    : Colors
                                        .black,
                          ),

                          onSelected:
                              (_) {

                            controller
                                .selectedTime
                                .value = slot;
                          },
                        );
                      },
                    )
                    .toList(),
              ),
            ),

            const SizedBox(height: 28),

            // =====================================================
            // ADDONS
            // =====================================================
            const _SectionTitle(
              "Add-On Services",
            ),

            const SizedBox(height: 14),

            Obx(
              () => Wrap(
                spacing: 10,
                runSpacing: 10,

                children: controller
                    .addOns
                    .map(
                      (addon) {

                        final selected =
                            controller
                                .selectedAddOns
                                .any(
                                  (a) =>
                                      a["name"] ==
                                      addon["name"],
                                );

                        return FilterChip(
                          label: Text(
                            "${addon["name"]} (+AED ${addon["price"]})",
                          ),

                          selected:
                              selected,

                          selectedColor:
                              const Color(
                            0xFF0F9D8A,
                          ),

                          labelStyle:
                              TextStyle(
                            color:
                                selected
                                    ? Colors
                                        .white
                                    : Colors
                                        .black,
                          ),

                          onSelected:
                              (_) {

                            controller
                                .toggleAddOn(
                              addon,
                            );
                          },
                        );
                      },
                    )
                    .toList(),
              ),
            ),

            const SizedBox(height: 28),

            // =====================================================
            // EXTRA DETAILS
            // =====================================================
            const _SectionTitle(
              "Additional Details",
            ),

            const SizedBox(height: 14),

            _InputField(
              controller:
                  instructionCtrl,

              label:
                  "Special Instructions",

              maxLines: 3,

              onChanged: (v) =>
                  controller
                      .specialInstructions
                      .value = v,
            ),

            const SizedBox(height: 12),

            _InputField(
              controller:
                  technicianCtrl,

              label:
                  "Preferred Technician (Optional)",

              onChanged: (v) =>
                  controller
                      .preferredTechnician
                      .value = v,
            ),

            const SizedBox(height: 12),

            _InputField(
              controller:
                  parkingCtrl,

              label:
                  "Parking Instructions",

              onChanged: (v) =>
                  controller
                      .parkingInstructions
                      .value = v,
            ),

            const SizedBox(height: 12),

            _InputField(
              controller: petCtrl,

              label:
                  "Pet Warning",

              onChanged: (v) =>
                  controller
                      .petWarning
                      .value = v,
            ),

            const SizedBox(height: 12),

            Obx(
              () => SwitchListTile(
                contentPadding:
                    EdgeInsets.zero,

                title: const Text(
                  "Call Before Arrival",
                ),

                value: controller
                    .callBeforeArrival
                    .value,

                onChanged: (v) {

                  controller
                      .callBeforeArrival
                      .value = v;
                },
              ),
            ),

            const SizedBox(height: 28),

            // =====================================================
            // TOTAL
            // =====================================================
            Obx(
              () => Container(
                padding:
                    const EdgeInsets
                        .all(18),

                decoration:
                    BoxDecoration(
                  color:
                      Colors.white,

                  borderRadius:
                      BorderRadius
                          .circular(
                    18,
                  ),
                ),

                child: Row(
                  mainAxisAlignment:
                      MainAxisAlignment
                          .spaceBetween,

                  children: [

                    const Text(
                      "Total Amount",

                      style:
                          TextStyle(
                        fontSize: 16,
                        fontWeight:
                            FontWeight
                                .w600,
                      ),
                    ),

                    Text(
                      "AED ${controller.price.value.toStringAsFixed(0)}",

                      style:
                          const TextStyle(
                        fontSize: 18,
                        fontWeight:
                            FontWeight
                                .bold,

                        color: Color(
                          0xFF0F9D8A,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 30),

            // =====================================================
            // CONTINUE
            // =====================================================
            SizedBox(
              width: double.infinity,

              child: ElevatedButton(
                onPressed: () {

                  Get.toNamed(
                    '/booking-summary',
                  );
                },

                style:
                    ElevatedButton
                        .styleFrom(
                  backgroundColor:
                      const Color(
                    0xFF0F9D8A,
                  ),

                  padding:
                      const EdgeInsets
                          .symmetric(
                    vertical: 16,
                  ),

                  shape:
                      RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius
                            .circular(
                      16,
                    ),
                  ),
                ),

                child: const Text(
                  "Continue",

                  style: TextStyle(
                    fontSize: 16,
                    fontWeight:
                        FontWeight.w600,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

// =========================================================
// SECTION TITLE
// =========================================================
class _SectionTitle
    extends StatelessWidget {

  final String title;

  const _SectionTitle(
    this.title,
  );

  @override
  Widget build(
    BuildContext context,
  ) {
    return Text(
      title,

      style: const TextStyle(
        fontSize: 18,
        fontWeight:
            FontWeight.w700,
      ),
    );
  }
}

// =========================================================
// INPUT FIELD
// =========================================================
class _InputField
    extends StatelessWidget {

  final TextEditingController
      controller;

  final String label;

  final int maxLines;

  final Function(String)?
      onChanged;

  const _InputField({
    required this.controller,
    required this.label,
    this.maxLines = 1,
    this.onChanged,
  });

  @override
  Widget build(
    BuildContext context,
  ) {
    return TextField(
      controller: controller,

      maxLines: maxLines,

      onChanged: onChanged,

      decoration: InputDecoration(
        labelText: label,

        filled: true,

        fillColor: Colors.white,

        border:
            OutlineInputBorder(
          borderRadius:
              BorderRadius.circular(
            14,
          ),

          borderSide:
              BorderSide.none,
        ),
      ),
    );
  }
}

