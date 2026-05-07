
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/controllers/package_controller.dart';

class ChecklistPreviewScreen extends StatelessWidget {
  const ChecklistPreviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final bookingController =
        Get.find<BookingController>();

    final packageController =
        Get.find<PackageController>();

    final package =
        packageController.selectedPackage.value;

    final apartmentType =
        (Get.arguments?['apartmentType']
                as String?) ??
            "1 BHK";

    // =====================================================
    // SAFETY
    // =====================================================
    if (package == null) {
      return Scaffold(
        body: Center(
          child: Text(
            "No package selected",
            style: Theme.of(context)
                .textTheme
                .titleMedium,
          ),
        ),
      );
    }

    final checklist = package.checklist;

    final duration =
        package.durationByApartment[
                apartmentType] ??
            "N/A";

    return Scaffold(
      backgroundColor:
          const Color(0xFFF7F9FB),

      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,

        title: const Text(
          "Package Checklist",
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: Colors.black,
          ),
        ),

        iconTheme:
            const IconThemeData(
          color: Colors.black,
        ),
      ),

      body: Padding(
        padding: const EdgeInsets.all(16),

        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,

          children: [

            // =================================================
            // PACKAGE SUMMARY CARD
            // =================================================
            Container(
              padding:
                  const EdgeInsets.all(20),

              decoration: BoxDecoration(
                color: Colors.white,

                borderRadius:
                    BorderRadius.circular(
                  22,
                ),

                boxShadow: [
                  BoxShadow(
                    color: Colors.black
                        .withOpacity(0.04),

                    blurRadius: 12,

                    offset:
                        const Offset(0, 4),
                  ),
                ],
              ),

              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment
                        .start,

                children: [

                  // =============================================
                  // TITLE + PRICE
                  // =============================================
                  Row(
                    mainAxisAlignment:
                        MainAxisAlignment
                            .spaceBetween,

                    children: [

                      Expanded(
                        child: Text(
                          package.name,

                          style:
                              const TextStyle(
                            fontSize: 18,
                            fontWeight:
                                FontWeight
                                    .w700,
                          ),
                        ),
                      ),

                      Text(
                        "AED ${package.price.toInt()}",

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

                  const SizedBox(
                      height: 10),

                  // =============================================
                  // DESCRIPTION
                  // =============================================
                  Text(
                    package.description,

                    style:
                        const TextStyle(
                      color:
                          Colors.black54,
                      fontSize: 14,
                    ),
                  ),

                  const SizedBox(
                      height: 18),

                  // =============================================
                  // APARTMENT TYPE
                  // =============================================
                  Row(
                    children: [

                      const Icon(
                        Icons.home_work_outlined,
                        size: 18,
                        color: Color(
                          0xFF0F9D8A,
                        ),
                      ),

                      const SizedBox(
                          width: 8),

                      Text(
                        apartmentType,

                        style:
                            const TextStyle(
                          fontWeight:
                              FontWeight
                                  .w600,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(
                      height: 10),

                  // =============================================
                  // DURATION
                  // =============================================
                  Row(
                    children: [

                      const Icon(
                        Icons.access_time,
                        size: 18,
                        color: Color(
                          0xFF0F9D8A,
                        ),
                      ),

                      const SizedBox(
                          width: 8),

                      Text(
                        "Estimated Duration: $duration",

                        style:
                            const TextStyle(
                          fontWeight:
                              FontWeight
                                  .w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 26),

            // =================================================
            // TITLE
            // =================================================
            const Text(
              "Services Included",

              style: TextStyle(
                fontSize: 18,
                fontWeight:
                    FontWeight.w700,
              ),
            ),

            const SizedBox(height: 16),

            // =================================================
            // CHECKLIST
            // =================================================
            Expanded(
              child: checklist.isEmpty
                  ? const Center(
                      child: Text(
                        "No checklist items available",
                      ),
                    )
                  : ListView.separated(
                      itemCount:
                          checklist.length,

                      separatorBuilder:
                          (_, __) =>
                              const SizedBox(
                        height: 12,
                      ),

                      itemBuilder:
                          (context, index) {
                        final task =
                            checklist[index];

                        return Container(
                          padding:
                              const EdgeInsets
                                  .symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),

                          decoration:
                              BoxDecoration(
                            color:
                                Colors.white,

                            borderRadius:
                                BorderRadius
                                    .circular(
                              18,
                            ),

                            border:
                                Border.all(
                              color: Colors
                                  .grey
                                  .shade200,
                            ),
                          ),

                          child: Row(
                            crossAxisAlignment:
                                CrossAxisAlignment
                                    .start,

                            children: [

                              const Icon(
                                Icons
                                    .check_circle,
                                size: 20,
                                color: Color(
                                  0xFF0F9D8A,
                                ),
                              ),

                              const SizedBox(
                                  width: 12),

                              Expanded(
                                child: Text(
                                  task,

                                  style:
                                      const TextStyle(
                                    fontSize:
                                        14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),

            const SizedBox(height: 20),

            // =================================================
            // CONTINUE BUTTON
            // =================================================
            SizedBox(
              width: double.infinity,

              child: ElevatedButton(
                onPressed: () {

                  bookingController
                          .checklist.value =
                      List<String>.from(
                    checklist,
                  );

                  Get.toNamed(
                    '/booking',
                  );
                },

                style:
                    ElevatedButton.styleFrom(
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
                            .circular(16),
                  ),
                ),

                child: const Text(
                  "Continue Booking",

                  style: TextStyle(
                    fontSize: 16,
                    fontWeight:
                        FontWeight.w600,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }
}

