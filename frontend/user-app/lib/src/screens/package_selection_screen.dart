import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/package_controller.dart';
import '../controllers/booking_controller.dart';
import '../models/package_model.dart';

class PackageSelectionScreen
    extends StatefulWidget {

  const PackageSelectionScreen({
    super.key,
  });

  @override
  State<PackageSelectionScreen>
      createState() =>
          _PackageSelectionScreenState();
}

class _PackageSelectionScreenState
    extends State<
        PackageSelectionScreen> {

  final PackageController
      packageController =
          Get.find<
              PackageController>();

  final selectedApartment =
      'Studio'.obs;

  late final int serviceId;

  @override
  void initState() {

    super.initState();

    final args =
        Get.arguments ??
            {};

    serviceId =
        args['serviceId'] ?? 1;

    packageController
        .loadPackages(
      serviceId,
    );
  }

  @override
  Widget build(
    BuildContext context,
  ) {

    return Scaffold(

      backgroundColor:
          const Color(
        0xFFF5F7F9,
      ),

      appBar: AppBar(

        title: const Text(
          "Apartment Cleaning",
        ),

        backgroundColor:
            Colors.white,

        foregroundColor:
            Colors.black,

        elevation: 0,
      ),

      body: Obx(() {

        if (packageController
            .isLoading
            .value) {

          return const Center(
            child:
                CircularProgressIndicator(),
          );
        }

        if (packageController
                .packages
                .isEmpty &&
            packageController
                .hasError
                .value) {

          return Center(
            child: Padding(
              padding:
                  const EdgeInsets
                      .all(24),

              child: Column(
                mainAxisAlignment:
                    MainAxisAlignment
                        .center,

                children: [

                  const Icon(
                    Icons.error_outline,
                    size: 60,
                    color:
                        Colors.grey,
                  ),

                  const SizedBox(
                    height: 16,
                  ),

                  Text(
                    packageController
                        .errorMessage
                        .value,
                    textAlign:
                        TextAlign
                            .center,
                  ),

                  const SizedBox(
                    height: 20,
                  ),

                  ElevatedButton(
                    onPressed: () {

                      packageController
                          .retryLoad(
                        serviceId,
                      );
                    },

                    child:
                        const Text(
                      "Retry",
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        return Column(

          crossAxisAlignment:
              CrossAxisAlignment
                  .start,

          children: [

            // =================================================
            // APARTMENT TYPE
            // =================================================
            Padding(
              padding:
                  const EdgeInsets
                      .fromLTRB(
                16,
                16,
                16,
                8,
              ),

              child: Obx(
                () => Wrap(

                  spacing: 10,

                  children: [

                    _apartmentChip(
                      "Studio",
                    ),

                    _apartmentChip(
                      "1 BHK",
                    ),

                    _apartmentChip(
                      "2 BHK",
                    ),

                    _apartmentChip(
                      "3 BHK",
                    ),
                  ],
                ),
              ),
            ),

            // =================================================
            // TITLE
            // =================================================
            const Padding(
              padding:
                  EdgeInsets.all(
                16,
              ),

              child: Text(
                "Choose a Package",

                style: TextStyle(
                  fontSize: 20,
                  fontWeight:
                      FontWeight
                          .bold,
                ),
              ),
            ),

            // =================================================
            // PACKAGE LIST
            // =================================================
            Expanded(
              child: ListView.builder(

                padding:
                    const EdgeInsets
                        .only(
                  left: 16,
                  right: 16,
                  bottom: 20,
                ),

                itemCount:
                    packageController
                        .packages
                        .length,

                itemBuilder:
                    (context, index) {

                  final package =
                      packageController
                          .packages[index];

                  return _packageCard(
                    package,
                  );
                },
              ),
            ),
          ],
        );
      }),
    );
  }

  // =======================================================
  // APARTMENT CHIP
  // =======================================================
  Widget _apartmentChip(
    String label,
  ) {

    final selected =
        selectedApartment
                .value ==
            label;

    return ChoiceChip(

      label: Text(
        label,
      ),

      selected:
          selected,

      selectedColor:
          const Color(
        0xFFDDF3EF,
      ),

      checkmarkColor:
          const Color(
        0xFF0F9D8A,
      ),

      labelStyle: TextStyle(

        color: selected
            ? const Color(
                0xFF0F9D8A,
              )
            : Colors.black,

        fontWeight:
            FontWeight.w600,
      ),

      onSelected: (_) {

        selectedApartment
            .value = label;
      },
    );
  }

  // =======================================================
  // PACKAGE CARD
  // =======================================================
  Widget _packageCard(
    PackageModel package,
  ) {

    final duration =
        package.durationByApartment[
                selectedApartment
                    .value] ??
            "N/A";

    return Container(

      margin:
          const EdgeInsets.only(
        bottom: 18,
      ),

      padding:
          const EdgeInsets.all(
        18,
      ),

      decoration:
          BoxDecoration(

        color: Colors.white,

        borderRadius:
            BorderRadius.circular(
          24,
        ),

        boxShadow: [

          BoxShadow(
            color: Colors.black
                .withOpacity(
              0.03,
            ),

            blurRadius: 10,

            offset:
                const Offset(
              0,
              4,
            ),
          ),
        ],
      ),

      child: Column(

        crossAxisAlignment:
            CrossAxisAlignment
                .start,

        children: [

          Row(

            crossAxisAlignment:
                CrossAxisAlignment
                    .start,

            children: [

              Expanded(
                child: Column(

                  crossAxisAlignment:
                      CrossAxisAlignment
                          .start,

                  children: [

                    Text(
                      package.name,

                      style:
                          const TextStyle(
                        fontSize: 18,
                        fontWeight:
                            FontWeight
                                .bold,
                      ),
                    ),

                    const SizedBox(
                      height: 10,
                    ),

                    Text(
                      package
                          .description,

                      style:
                          const TextStyle(
                        fontSize: 15,
                        color:
                            Colors
                                .grey,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(
                width: 16,
              ),

              Text(
                "AED ${package.price.toStringAsFixed(0)}",

                style:
                    const TextStyle(
                  fontSize: 16,
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
            height: 16,
          ),

          Row(
            children: [

              const Icon(
                Icons.access_time,
                size: 20,
              ),

              const SizedBox(
                width: 8,
              ),

              Text(
                "Est. time: $duration",
              ),
            ],
          ),

          const SizedBox(
            height: 20,
          ),

          // =================================================
          // CHECKLIST PREVIEW
          // =================================================
          ...package.checklist
              .take(4)
              .map(
                (task) => Padding(
                  padding:
                      const EdgeInsets
                          .only(
                    bottom: 8,
                  ),

                  child: Row(

                    crossAxisAlignment:
                        CrossAxisAlignment
                            .start,

                    children: [

                      const Padding(
                        padding:
                            EdgeInsets.only(
                          top: 4,
                        ),

                        child: Icon(
                          Icons.check_circle,
                          size: 16,
                          color: Color(
                            0xFF0F9D8A,
                          ),
                        ),
                      ),

                      const SizedBox(
                        width: 10,
                      ),

                      Expanded(
                        child: Text(
                          task,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

          if (package
                  .checklist
                  .length >
              4)
            Padding(
              padding:
                  const EdgeInsets
                      .only(
                top: 4,
              ),

              child: Text(
                "+ ${package.checklist.length - 4} more tasks",

                style:
                    const TextStyle(
                  color:
                      Color(
                    0xFF0F9D8A,
                  ),

                  fontWeight:
                      FontWeight
                          .w600,
                ),
              ),
            ),

          const SizedBox(
            height: 24,
          ),

          // =================================================
          // CONTINUE
          // =================================================
          SizedBox(
            width:
                double.infinity,

            child: ElevatedButton(

              onPressed: () {

                packageController
                    .selectPackage(
                  package,
                );

                final bookingController =
                    Get.find<
                        BookingController>();

                bookingController
                    .serviceId
                    .value = serviceId;

                bookingController
                    .packageId
                    .value = package.id;

                Get.toNamed(
                  '/booking',

                  arguments: {

                    'apartmentType':
                        selectedApartment
                            .value,

                    'serviceId':
                        serviceId,

                    'packageId':
                        package.id,
                  },
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
                      FontWeight
                          .w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}