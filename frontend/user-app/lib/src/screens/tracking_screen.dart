
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/booking_controller.dart';

class TrackingScreen extends StatelessWidget {
  const TrackingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller =
        Get.find<BookingController>();
    final hasBookingContext =
        controller.prepareTrackingBooking(
      Get.arguments,
    );

    WidgetsBinding.instance
        .addPostFrameCallback(
      (_) {
        if (!hasBookingContext) {
          return;
        }

        if (controller
                .activePollingBookingId
                .value !=
            controller
                .bookingId
                .value) {
          controller
              .startPolling();
        }
      },
    );

    return Scaffold(
      backgroundColor:
          const Color(0xFFF7F9FB),

      appBar: AppBar(
        title: const Text(
          "Booking Status",
        ),

        backgroundColor:
            Colors.white,

        foregroundColor:
            Colors.black,

        elevation: 0,
      ),

      body: Obx(() {
        if (!hasBookingContext) {
          return const Center(
            child: Text(
              "Unable to load tracking for this booking.",
            ),
          );
        }

        final status =
            controller.mapStatus(
          controller
              .bookingStatus
              .value,
        );

        return Padding(
          padding:
              const EdgeInsets.all(
            20,
          ),

          child: Column(
            crossAxisAlignment:
                CrossAxisAlignment
                    .start,

            children: [

              // ==========================================
              // STATUS CARD
              // ==========================================
              Container(
                width:
                    double.infinity,

                padding:
                    const EdgeInsets
                        .all(22),

                decoration:
                    BoxDecoration(
                  color:
                      Colors.white,

                  borderRadius:
                      BorderRadius
                          .circular(
                    24,
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
                  children: [

                    const Icon(
                      Icons
                          .cleaning_services,

                      size: 70,

                      color: Color(
                        0xFF0F9D8A,
                      ),
                    ),

                    const SizedBox(
                      height: 18,
                    ),

                    Text(
                      _formatStatus(
                        status,
                      ),

                      style:
                          const TextStyle(
                        fontSize: 20,
                        fontWeight:
                            FontWeight
                                .w700,
                      ),

                      textAlign:
                          TextAlign
                              .center,
                    ),

                    const SizedBox(
                      height: 10,
                    ),

                    Text(
                      _statusDescription(
                        status,
                      ),

                      style:
                          const TextStyle(
                        color:
                            Colors
                                .black54,

                        fontSize: 14,
                      ),

                      textAlign:
                          TextAlign
                              .center,
                    ),
                  ],
                ),
              ),

              const SizedBox(
                height: 24,
              ),

              // ==========================================
              // ETA CARD
              // ==========================================
              if (status ==
                  "on_the_way")

                Container(
                  width:
                      double.infinity,

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
                  ),

                  child: Row(
                    children: [

                      const Icon(
                        Icons
                            .access_time,

                        color: Color(
                          0xFF0F9D8A,
                        ),
                      ),

                      const SizedBox(
                        width: 12,
                      ),

                      Expanded(
                        child: Column(
                          crossAxisAlignment:
                              CrossAxisAlignment
                                  .start,

                          children: [

                            const Text(
                              "Technician On The Way",

                              style:
                                  TextStyle(
                                fontWeight:
                                    FontWeight
                                        .w700,
                              ),
                            ),

                            const SizedBox(
                              height: 4,
                            ),

                            Obx(
                              () => Text(
                                "Estimated arrival in ${controller.estimatedArrivalMinutes.value} mins",
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

              if (status ==
                  "on_the_way")

                const SizedBox(
                  height: 24,
                ),

              // ==========================================
              // TECHNICIAN CARD
              // ==========================================
              if (controller
                  .technicianName
                  .value
                  .isNotEmpty)

                Container(
                  width:
                      double.infinity,

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
                  ),

                  child: Column(
                    crossAxisAlignment:
                        CrossAxisAlignment
                            .start,

                    children: [

                      const Text(
                        "Assigned Technician",

                        style:
                            TextStyle(
                          fontWeight:
                              FontWeight
                                  .w700,

                          fontSize: 16,
                        ),
                      ),

                      const SizedBox(
                        height: 14,
                      ),

                      Row(
                        children: [

                          const CircleAvatar(
                            radius: 24,

                            backgroundColor:
                                Color(
                              0xFFE6F4F1,
                            ),

                            child: Icon(
                              Icons.person,

                              color: Color(
                                0xFF0F9D8A,
                              ),
                            ),
                          ),

                          const SizedBox(
                            width: 14,
                          ),

                          Expanded(
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment
                                      .start,

                              children: [

                                Text(
                                  controller
                                      .technicianName
                                      .value,

                                  style:
                                      const TextStyle(
                                    fontWeight:
                                        FontWeight
                                            .w600,
                                  ),
                                ),

                                const SizedBox(
                                  height: 4,
                                ),

                                Text(
                                  controller
                                      .technicianPhone
                                      .value,

                                  style:
                                      const TextStyle(
                                    color:
                                        Colors
                                            .grey,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

              const Spacer(),

              // ==========================================
              // BUTTON
              // ==========================================
              SizedBox(
                width:
                    double.infinity,

                child:
                    ElevatedButton(
                  onPressed: () {

                    Get.toNamed(
                      '/live-tracking',
                      arguments: {
                        'bookingId':
                            controller
                                .bookingId
                                .value,
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
                      vertical:
                          16,
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
                    "View Detailed Tracking",

                    style:
                        TextStyle(
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
      }),
    );
  }

  // =====================================================
  // STATUS TITLE
  // =====================================================
  String _formatStatus(
    String status,
  ) {
    switch (status) {

      case 'submitted':
        return 'Booking Submitted';

      case 'assigned':
        return 'Technician Assigned';

      case 'on_the_way':
        return 'Technician On The Way';

      case 'arrival_approval_pending':
        return 'Technician Arrived';

      case 'in_progress':
        return 'Cleaning In Progress';

      case 'customer_review_pending':
        return 'Awaiting Customer Approval';

      case 'admin_review_pending':
        return 'Awaiting Final Verification';

      case 'rework_requested':
        return 'Rework Requested';

      case 'completed':
        return 'Service Completed';

      default:
        return status;
    }
  }

  // =====================================================
  // STATUS DESCRIPTION
  // =====================================================
  String _statusDescription(
    String status,
  ) {
    switch (status) {

      case 'submitted':
        return 'Your booking has been received successfully.';

      case 'assigned':
        return 'A cleaning team has been assigned to your service.';

      case 'on_the_way':
        return 'Your technician is currently on the way to your location.';

      case 'arrival_approval_pending':
        return 'Technician has arrived. Please confirm arrival to begin service.';

      case 'in_progress':
        return 'Cleaning professionals are currently working on your service.';

      case 'customer_review_pending':
        return 'Please review the checklist progress and approve the completed cleaning service.';

      case 'admin_review_pending':
        return 'Your booking is awaiting final admin verification.';

      case 'rework_requested':
        return 'Your rework request has been submitted successfully.';

      case 'completed':
        return 'Your cleaning service has been completed successfully.';

      default:
        return 'Tracking service status.';
    }
  }
}

