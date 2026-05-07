
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/controllers/user_controller.dart';

class MapPickerScreen extends StatelessWidget {

  MapPickerScreen({
    super.key,
  });

  final BookingController
      bookingController =
          Get.find<BookingController>();

  final UserController
      userController =
          Get.find<UserController>();

  final TextEditingController
      addressController =
          TextEditingController();

  @override
  Widget build(
    BuildContext context,
  ) {

    // ===========================================
    // PREFILL EXISTING ADDRESS
    // ===========================================
    addressController.text =
        bookingController
            .selectedAddress
            .value;

    return Scaffold(
      backgroundColor:
          const Color(
        0xFFF7F9FB,
      ),

      appBar: AppBar(
        title: Text(
          'select_location'
              .tr,
        ),

        elevation: 0,

        backgroundColor:
            Colors.white,

        foregroundColor:
            Colors.black,
      ),

      body: Padding(
        padding:
            const EdgeInsets
                .all(20),

        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment
                  .start,

          children: [

            const Text(
              "Enter your address",

              style: TextStyle(
                fontSize: 18,

                fontWeight:
                    FontWeight
                        .bold,
              ),
            ),

            const SizedBox(
              height: 8,
            ),

            const Text(
              "Provide complete apartment/building details for accurate service location.",
            ),

            const SizedBox(
              height: 24,
            ),

            TextField(
              controller:
                  addressController,

              maxLines: 4,

              decoration:
                  InputDecoration(
                hintText:
                    "Flat / Building / Area / Landmark",

                filled: true,

                fillColor:
                    Colors.white,

                border:
                    OutlineInputBorder(
                  borderRadius:
                      BorderRadius.circular(
                    16,
                  ),

                  borderSide:
                      BorderSide(
                    color: Colors
                        .grey
                        .shade300,
                  ),
                ),

                enabledBorder:
                    OutlineInputBorder(
                  borderRadius:
                      BorderRadius
                          .circular(
                    16,
                  ),

                  borderSide:
                      BorderSide(
                    color: Colors
                        .grey
                        .shade300,
                  ),
                ),

                focusedBorder:
                    OutlineInputBorder(
                  borderRadius:
                      BorderRadius
                          .circular(
                    16,
                  ),

                  borderSide:
                      const BorderSide(
                    color: Color(
                      0xFF0F9D8A,
                    ),

                    width: 1.4,
                  ),
                ),

                contentPadding:
                    const EdgeInsets
                        .all(18),
              ),
            ),

            const SizedBox(
              height: 24,
            ),

            SizedBox(
              width:
                  double.infinity,

              child:
                  ElevatedButton(
                onPressed: () {

                  final address =
                      addressController
                          .text
                          .trim();

                  if (address
                      .isEmpty) {

                    Get.snackbar(
                      "Address Required",
                      "Please enter your service location.",
                    );

                    return;
                  }

                  // ===================================
                  // SAVE BOOKING ADDRESS
                  // ===================================
                  bookingController
                          .selectedAddress
                          .value =
                      address;

                  // ===================================
                  // SAVE TO USER ADDRESSES
                  // ===================================
                  userController
                      .addAddress(
                    address,
                  );

                  Get.back();
                },

                style:
                    ElevatedButton
                        .styleFrom(
                  minimumSize:
                      const Size
                          .fromHeight(
                    54,
                  ),

                  backgroundColor:
                      const Color(
                    0xFF0F9D8A,
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

                child: Text(
                  'confirm_location'
                      .tr,

                  style:
                      const TextStyle(
                    fontWeight:
                        FontWeight
                            .w600,

                    fontSize: 15,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

