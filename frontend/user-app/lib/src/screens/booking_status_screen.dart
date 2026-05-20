
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:user_a/src/controllers/booking_controller.dart';

class BookingStatusScreen
    extends GetView<
        BookingController> {

  const BookingStatusScreen({
    super.key,
  });

  @override
  Widget build(
    BuildContext context,
  ) {
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

        if (!controller
            .isPolling
            .value) {

          controller
              .startPolling();
        }
      },
    );

    return Scaffold(
      backgroundColor:
          const Color(
        0xFFF7F9FB,
      ),

      appBar: AppBar(
        title:
            const Text(
          "Service Status",
        ),

        elevation: 0,

        backgroundColor:
            Colors.white,

        foregroundColor:
            Colors.black,
      ),

      body: Obx(() {
        if (!hasBookingContext) {
          return const Center(
            child: Text(
              "Unable to load this booking status.",
            ),
          );
        }

        final status =
            controller
                .mapStatus(
          controller
              .bookingStatus
              .value,
        );

        return Padding(
          padding:
              const EdgeInsets
                  .all(16),

          child: Column(
            children: [

              _bookingCard(),

              const SizedBox(
                height: 20,
              ),

              Expanded(
                child:
                    _statusContent(
                  status,
                ),
              ),

              _actionSection(
                status,
              ),
            ],
          ),
        );
      }),
    );
  }

  // =====================================================
  // BOOKING CARD
  // =====================================================
  Widget _bookingCard() {

    return Container(
      width:
          double.infinity,

      padding:
          const EdgeInsets
              .all(18),

      decoration:
          BoxDecoration(
        color: Colors.white,

        borderRadius:
            BorderRadius
                .circular(
          20,
        ),

        boxShadow: [

          BoxShadow(
            color: Colors.black
                .withOpacity(
              0.04,
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

          Text(
            "Booking #${controller.bookingId.value}",

            style:
                const TextStyle(
              fontSize: 18,

              fontWeight:
                  FontWeight
                      .bold,
            ),
          ),

          const SizedBox(
            height: 12,
          ),

          if (controller
              .technicianName
              .value
              .isNotEmpty)

            Row(
              children: [

                const Icon(
                  Icons
                      .engineering,

                  size: 18,
                ),

                const SizedBox(
                  width: 8,
                ),

                Expanded(
                  child: Text(
                    controller
                        .technicianName
                        .value,
                  ),
                ),
              ],
            ),

          if (controller
              .technicianPhone
              .value
              .isNotEmpty)

            Padding(
              padding:
                  const EdgeInsets
                      .only(
                top: 10,
              ),

              child: Row(
                children: [

                  const Icon(
                    Icons.phone,

                    size: 18,
                  ),

                  const SizedBox(
                    width: 8,
                  ),

                  Text(
                    controller
                        .technicianPhone
                        .value,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // =====================================================
  // STATUS CONTENT
  // =====================================================
  Widget _statusContent(
    String status,
  ) {

    switch (status) {

      case "submitted":
        return _statusCard(
          title:
              "Booking Submitted",

          subtitle:
              "We are assigning a cleaning team for your booking.",

          icon:
              Icons.assignment_turned_in,
        );

      case "assigned":
        return _statusCard(
          title:
              "Technician Assigned",

          subtitle:
              "Your cleaning team has been assigned.",

          icon:
              Icons.engineering,
        );

      case "on_the_way":
        return _statusCard(
          title:
              "Technician On The Way",

          subtitle:
              "The technician is heading to your location.",

          icon:
              Icons.local_shipping,
        );

      case "arrival_approval_pending":
        return _statusCard(
          title:
              "Technician Arrived",

          subtitle:
              "Your technician has reached the location and is preparing to start the service.",

          icon:
              Icons.location_on,
        );

      case "in_progress":
        return _statusCard(
          title:
              "Cleaning In Progress",

          subtitle:
              "The cleaning service is currently ongoing.",

          icon:
              Icons.cleaning_services,
        );

      case "customer_review_pending":
        return _statusCard(
          title:
              "Review Service Completion",

          subtitle:
              "Please verify the completed cleaning work.",

          icon:
              Icons.fact_check,
        );

      case "admin_review_pending":
        return _statusCard(
          title:
              "Final Verification Pending",

          subtitle:
              "The service is awaiting final admin approval.",

          icon:
              Icons.verified,
        );

      case "completed":
        return _statusCard(
          title:
              "Service Completed",

          subtitle:
              "Thank you for choosing Cartel Star Cleaning Services.",

          icon:
              Icons.check_circle,
        );

      case "rework_requested":
        return _statusCard(
          title:
              "Rework Requested",

          subtitle:
              "Your request has been forwarded to the cleaning team.",

          icon:
              Icons.refresh,
        );

      case "cancelled":
        return _statusCard(
          title:
              "Booking Cancelled",

          subtitle:
              "This booking has been cancelled.",

          icon:
              Icons.cancel,
        );

      default:
        return _statusCard(
          title:
              "Updating Status",

          subtitle:
              "Please wait while we fetch the latest booking information.",

          icon:
              Icons.sync,
        );
    }
  }

  // =====================================================
  // STATUS CARD
  // =====================================================
  Widget _statusCard({
    required String title,
    required String subtitle,
    required IconData icon,
  }) {

    return Container(
      width:
          double.infinity,

      padding:
          const EdgeInsets
              .all(24),

      decoration:
          BoxDecoration(
        color: Colors.white,

        borderRadius:
            BorderRadius
                .circular(
          22,
        ),

        boxShadow: [

          BoxShadow(
            color: Colors.black
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
        mainAxisAlignment:
            MainAxisAlignment
                .center,

        children: [

          Container(
            height: 74,
            width: 74,

            decoration:
                BoxDecoration(
              color:
                  const Color(
                0xFFE6F4F1,
              ),

              borderRadius:
                  BorderRadius
                      .circular(
                22,
              ),
            ),

            child: Icon(
              icon,

              size: 36,

              color:
                  const Color(
                0xFF0F9D8A,
              ),
            ),
          ),

          const SizedBox(
            height: 22,
          ),

          Text(
            title,

            textAlign:
                TextAlign.center,

            style:
                const TextStyle(
              fontSize: 20,

              fontWeight:
                  FontWeight
                      .bold,
            ),
          ),

          const SizedBox(
            height: 12,
          ),

          Text(
            subtitle,

            textAlign:
                TextAlign.center,

            style:
                const TextStyle(
              color:
                  Colors.black54,

              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  // =====================================================
  // ACTIONS
  // =====================================================
  Widget _actionSection(
    String status,
  ) {

    if (status ==
        "on_the_way") {

      return Column(
        children: [

          _button(
            "Track Technician",

            () {

              Get.toNamed(
                '/tracking',
                arguments: {
                  'bookingId':
                      controller
                          .bookingId
                          .value,
                },
              );
            },
          ),

          const SizedBox(
            height: 12,
          ),

          _button(
            "Call Technician",

            _callTechnician,
          ),
        ],
      );
    }

    if (status ==
        "assigned") {

      return _button(
        "Call Technician",

        _callTechnician,
      );
    }

    if (status ==
        "in_progress") {

      return _button(
        "View Checklist Progress",

        () {

          Get.toNamed(
            '/checklist-progress',
          );
        },
      );
    }

    if (status ==
        "customer_review_pending") {

      return Column(
        children: [

          _button(
            "Approve Completion",

            () async {

              await controller
                  .approveWork();
            },
          ),

          const SizedBox(
            height: 12,
          ),

          OutlinedButton(
            onPressed:
                () async {

              await controller
                  .requestRework(
                "Customer requested rework",
              );
            },

            style:
                OutlinedButton
                    .styleFrom(
              minimumSize:
                  const Size
                      .fromHeight(
                52,
              ),
            ),

            child: const Text(
              "Request Rework",
            ),
          ),
        ],
      );
    }

    if (status ==
        "completed") {

      return _button(
        "Done",

        () {

          Get.offAllNamed(
            '/home',
          );
        },
      );
    }

    return const SizedBox();
  }

  // =====================================================
  // CALL TECHNICIAN
  // =====================================================
  Future<void>
      _callTechnician() async {

    final phone =
        controller
            .technicianPhone
            .value;

    if (phone.isEmpty) {

      Get.snackbar(
        "Unavailable",
        "Technician phone number is not available.",
      );

      return;
    }

    final uri =
        Uri.parse(
      "tel:$phone",
    );

    if (await canLaunchUrl(
      uri,
    )) {

      await launchUrl(
        uri,
      );

    } else {

      Get.snackbar(
        "Error",
        "Unable to open dialer.",
      );
    }
  }

  // =====================================================
  // BUTTON
  // =====================================================
  Widget _button(
    String text,
    VoidCallback onPressed,
  ) {

    return SizedBox(
      width:
          double.infinity,

      child:
          ElevatedButton(
        onPressed:
            onPressed,

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
          text,

          style:
              const TextStyle(
            fontWeight:
                FontWeight
                    .w600,
          ),
        ),
      ),
    );
  }
}

