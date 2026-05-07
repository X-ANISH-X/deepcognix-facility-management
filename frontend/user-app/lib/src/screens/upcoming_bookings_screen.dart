
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:user_a/src/services/api_client.dart';
import 'package:user_a/src/controllers/booking_controller.dart';

class UpcomingBookingsScreen
    extends StatefulWidget {

  const UpcomingBookingsScreen({
    super.key,
  });

  @override
  State<UpcomingBookingsScreen>
      createState() =>
          _UpcomingBookingsScreenState();
}

class _UpcomingBookingsScreenState
    extends State<
        UpcomingBookingsScreen> {

  final ApiClient api =
      ApiClient();

  final BookingController
      bookingController =
          Get.find();

  final bookings =
      <Map<String, dynamic>>[]
          .obs;

  final isLoading =
      true.obs;

  final hasError =
      false.obs;

  @override
  void initState() {
    super.initState();

    fetchBookings();
  }

  // =====================================================
  // FETCH BOOKINGS
  // =====================================================
  Future<void>
      fetchBookings() async {

    try {

      isLoading.value = true;

      hasError.value = false;

      final response =
          await api.get(
        "/bookings",
      );

      if (response is List) {

        bookings.value =
            List<Map<String,
                dynamic>>.from(
          response,
        );

      } else {

        bookings.clear();
      }

    } catch (_) {

      hasError.value = true;

      bookings.clear();

    } finally {

      isLoading.value =
          false;
    }
  }

  @override
  Widget build(
    BuildContext context,
  ) {

    return Scaffold(
      backgroundColor:
          const Color(
        0xFFF7F9FB,
      ),

      appBar: AppBar(
        title: Text(
          'upcoming_bookings'
              .tr,
        ),

        elevation: 0,

        backgroundColor:
            Colors.white,

        foregroundColor:
            Colors.black,
      ),

      body: Obx(() {

        // ===========================================
        // LOADING
        // ===========================================
        if (isLoading.value) {

          return const Center(
            child:
                CircularProgressIndicator(),
          );
        }

        // ===========================================
        // ERROR
        // ===========================================
        if (hasError.value) {

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
                    Icons
                        .cloud_off,

                    size: 60,

                    color:
                        Colors.grey,
                  ),

                  const SizedBox(
                    height: 16,
                  ),

                  const Text(
                    "Unable to load bookings.",
                  ),

                  const SizedBox(
                    height: 20,
                  ),

                  ElevatedButton(
                    onPressed:
                        fetchBookings,

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

        // ===========================================
        // EMPTY
        // ===========================================
        if (bookings.isEmpty) {

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

                  Icon(
                    Icons
                        .event_busy,

                    size: 70,

                    color: Colors
                        .grey
                        .shade400,
                  ),

                  const SizedBox(
                    height: 18,
                  ),

                  const Text(
                    "No bookings yet",

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
                    "Your upcoming cleaning services will appear here.",

                    textAlign:
                        TextAlign
                            .center,
                  ),

                  const SizedBox(
                    height: 22,
                  ),

                  ElevatedButton(
                    onPressed:
                        () {

                      Get.offAllNamed(
                        '/home',
                      );
                    },

                    child:
                        const Text(
                      "Book Cleaning",
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        // ===========================================
        // BOOKING LIST
        // ===========================================
        return RefreshIndicator(
          onRefresh:
              fetchBookings,

          child: ListView.separated(
            padding:
                const EdgeInsets
                    .all(16),

            itemCount:
                bookings.length,

            separatorBuilder:
                (_, __) =>
                    const SizedBox(
              height: 14,
            ),

            itemBuilder:
                (context, index) {

              final booking =
                  bookings[index];

              final bookingId =
                  booking["id"] ??
                      0;

              final date =
                  booking[
                          "scheduled_date"] ??
                      "--";

              final time =
                  booking[
                          "scheduled_time_slot"] ??
                      "--";

              final address =
                  booking[
                          "address_line"] ??
                      "No address";

              final package =
                  booking[
                          "package_name"] ??
                      "Cleaning Package";

              final status =
                  booking[
                          "status"] ??
                      "submitted";

              return InkWell(
                borderRadius:
                    BorderRadius
                        .circular(
                  20,
                ),

                onTap: () {

                  bookingController
                          .bookingId
                          .value =
                      bookingId;

                  Get.toNamed(
                    '/tracking',
                  );
                },

                child: Container(
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
                      20,
                    ),

                    boxShadow: [

                      BoxShadow(
                        color: Colors
                            .black
                            .withOpacity(
                          0.04,
                        ),

                        blurRadius: 12,

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
                        mainAxisAlignment:
                            MainAxisAlignment
                                .spaceBetween,

                        children: [

                          Expanded(
                            child: Text(
                              package,

                              style:
                                  const TextStyle(
                                fontSize:
                                    16,

                                fontWeight:
                                    FontWeight
                                        .bold,
                              ),
                            ),
                          ),

                          _statusBadge(
                            status,
                          ),
                        ],
                      ),

                      const SizedBox(
                        height: 14,
                      ),

                      Row(
                        children: [

                          const Icon(
                            Icons
                                .calendar_today,

                            size: 16,

                            color:
                                Colors
                                    .grey,
                          ),

                          const SizedBox(
                            width: 8,
                          ),

                          Text(
                            "$date • $time",
                          ),
                        ],
                      ),

                      const SizedBox(
                        height: 10,
                      ),

                      Row(
                        crossAxisAlignment:
                            CrossAxisAlignment
                                .start,

                        children: [

                          const Icon(
                            Icons
                                .location_on,

                            size: 16,

                            color:
                                Colors
                                    .grey,
                          ),

                          const SizedBox(
                            width: 8,
                          ),

                          Expanded(
                            child: Text(
                              address,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      }),
    );
  }

  // =====================================================
  // STATUS BADGE
  // =====================================================
  Widget _statusBadge(
    String status,
  ) {

    final normalized =
        status
            .toLowerCase();

    Color color;

    String label;

    switch (normalized) {

      case "completed":
        color = Colors.green;
        label = "Completed";
        break;

      case "in_progress":
        color = Colors.orange;
        label = "In Progress";
        break;

      case "on_the_way":
        color = Colors.blue;
        label = "On The Way";
        break;

      case "cancelled":
        color = Colors.red;
        label = "Cancelled";
        break;

      default:
        color =
            Colors.blueGrey;
        label =
            "Submitted";
    }

    return Container(
      padding:
          const EdgeInsets
              .symmetric(
        horizontal: 12,
        vertical: 7,
      ),

      decoration:
          BoxDecoration(
        color:
            color.withOpacity(
          0.1,
        ),

        borderRadius:
            BorderRadius
                .circular(
          14,
        ),
      ),

      child: Text(
        label,

        style: TextStyle(
          color: color,

          fontWeight:
              FontWeight.w600,

          fontSize: 12,
        ),
      ),
    );
  }
}

