
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/booking_controller.dart';
import '../controllers/package_controller.dart';

class BookingSummaryScreen extends StatelessWidget {
  BookingSummaryScreen({super.key});

  final BookingController bookingController =
      Get.find<BookingController>();

  final PackageController packageController =
      Get.find<PackageController>();

  @override
  Widget build(BuildContext context) {

    final package =
        packageController.selectedPackage.value;

    final apartmentType =
        (Get.arguments?['apartmentType']
                as String?) ??
            "1 BHK";

    final duration =
        package?.durationByApartment[
                apartmentType] ??
            "N/A";

    return Scaffold(
      backgroundColor:
          const Color(0xFFF5F7F9),

      appBar: AppBar(
        title: const Text(
          "Booking Summary",
        ),

        backgroundColor:
            Colors.white,

        foregroundColor:
            Colors.black,

        elevation: 0,
      ),

      body: Obx(() {

        return Padding(
          padding:
              const EdgeInsets.all(16),

          child: Column(
            children: [

              Expanded(
                child: ListView(
                  children: [

                    _summaryCard(
                      title:
                          "Selected Package",

                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment
                                .start,

                        children: [

                          Text(
                            package?.name ??
                                "No Package",

                            style:
                                const TextStyle(
                              fontSize: 18,
                              fontWeight:
                                  FontWeight
                                      .bold,
                            ),
                          ),

                          const SizedBox(
                              height: 8),

                          Text(
                            package
                                    ?.description ??
                                "",
                          ),

                          const SizedBox(
                              height: 16),

                          _infoRow(
                            "Apartment Type",
                            apartmentType,
                          ),

                          _infoRow(
                            "Estimated Duration",
                            duration,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(
                        height: 18),

                    _summaryCard(
                      title:
                          "Selected Add-Ons",

                      child: bookingController
                              .selectedAddOns
                              .isEmpty
                          ? const Text(
                              "No add-ons selected",
                            )
                          : Column(
                              children:
                                  bookingController
                                      .selectedAddOns
                                      .map(
                                        (addon) =>
                                            Padding(
                                          padding:
                                              const EdgeInsets
                                                  .only(
                                            bottom:
                                                12,
                                          ),

                                          child:
                                              Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment
                                                    .spaceBetween,

                                            children: [

                                              Expanded(
                                                child:
                                                    Text(
                                                  addon[
                                                      "name"],
                                                ),
                                              ),

                                              Text(
                                                "AED ${addon["price"]}",
                                              ),
                                            ],
                                          ),
                                        ),
                                      )
                                      .toList(),
                            ),
                    ),

                    const SizedBox(
                        height: 18),

                    _summaryCard(
                      title:
                          "Booking Schedule",

                      child: Column(
                        children: [

                          _infoRow(
                            "Date",
                            bookingController
                                .selectedDate
                                .value,
                          ),

                          _infoRow(
                            "Time Slot",
                            bookingController
                                .selectedTime
                                .value,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(
                        height: 18),

                    _summaryCard(
                      title:
                          "Address Details",

                      child: Column(
                        children: [

                          _infoRow(
                            "Address",
                            bookingController
                                .selectedAddress
                                .value,
                          ),

                          _infoRow(
                            "Building",
                            bookingController
                                .buildingName
                                .value,
                          ),

                          _infoRow(
                            "Floor",
                            bookingController
                                .floorNumber
                                .value,
                          ),

                          _infoRow(
                            "Apartment",
                            bookingController
                                .apartmentNumber
                                .value,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(
                        height: 18),

                    _summaryCard(
                      title:
                          "Additional Notes",

                      child: Column(
                        children: [

                          _infoRow(
                            "Instructions",
                            bookingController
                                .specialInstructions
                                .value,
                          ),

                          _infoRow(
                            "Preferred Technician",
                            bookingController
                                .preferredTechnician
                                .value,
                          ),

                          _infoRow(
                            "Parking",
                            bookingController
                                .parkingInstructions
                                .value,
                          ),

                          _infoRow(
                            "Pet Warning",
                            bookingController
                                .petWarning
                                .value,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              Container(
                padding:
                    const EdgeInsets.all(18),

                decoration: BoxDecoration(
                  color: Colors.white,

                  borderRadius:
                      BorderRadius.circular(
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

                      style: TextStyle(
                        fontSize: 16,
                        fontWeight:
                            FontWeight.w600,
                      ),
                    ),

                    Text(
                      "AED ${bookingController.price.value.toStringAsFixed(0)}",

                      style:
                          const TextStyle(
                        fontSize: 20,
                        fontWeight:
                            FontWeight.bold,

                        color: Color(
                          0xFF0F9D8A,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              Row(
                children: [

                  Expanded(
                    child: OutlinedButton(
                      onPressed:
                          bookingController
                                  .isCreatingBooking
                                  .value
                              ? null
                              : () {
                                  Get.back();
                                },

                      child: const Text(
                        "Modify",
                      ),
                    ),
                  ),

                  const SizedBox(width: 14),

                  Expanded(
                    child: ElevatedButton(
                      onPressed:
                          bookingController
                                  .isCreatingBooking
                                  .value
                              ? null
                              : () async {

                                  final success =
                                      await bookingController
                                          .createBooking();

                                  if (success) {

                                    Get.offAllNamed(
                                      '/tracking',
                                      arguments: {
                                        'bookingId': bookingController.bookingId.value,
                                      },
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
                      ),

                      child:
                          bookingController
                                  .isCreatingBooking
                                  .value
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,

                                  child:
                                      CircularProgressIndicator(
                                    strokeWidth:
                                        2,

                                    color:
                                        Colors.white,
                                  ),
                                )
                              : const Text(
                                  "Confirm",
                                ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),
            ],
          ),
        );
      }),
    );
  }

  Widget _summaryCard({
    required String title,
    required Widget child,
  }) {
    return Container(
      padding:
          const EdgeInsets.all(18),

      decoration: BoxDecoration(
        color: Colors.white,

        borderRadius:
            BorderRadius.circular(20),
      ),

      child: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,

        children: [

          Text(
            title,

            style: const TextStyle(
              fontSize: 16,
              fontWeight:
                  FontWeight.bold,
            ),
          ),

          const SizedBox(height: 16),

          child,
        ],
      ),
    );
  }

  Widget _infoRow(
    String label,
    String value,
  ) {
    return Padding(
      padding:
          const EdgeInsets.only(
        bottom: 12,
      ),

      child: Row(
        crossAxisAlignment:
            CrossAxisAlignment.start,

        children: [

          SizedBox(
            width: 130,

            child: Text(
              label,

              style: const TextStyle(
                color: Colors.grey,
              ),
            ),
          ),

          Expanded(
            child: Text(
              value.isEmpty
                  ? "-"
                  : value,
            ),
          ),
        ],
      ),
    );
  }
}

