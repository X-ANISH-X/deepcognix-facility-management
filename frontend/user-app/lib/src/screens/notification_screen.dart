
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/booking_controller.dart';

class NotificationScreen extends StatelessWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context) {

    final notifications = [

      {
        "title":
            "Booking Confirmed",
        "subtitle":
            "Your apartment cleaning booking has been confirmed.",
        "time":
            "2 min ago",
        "icon":
            Icons.check_circle,
      },

      {
        "title":
            "Technician Assigned",
        "subtitle":
            "A cleaning team has been assigned to your booking.",
        "time":
            "15 min ago",
        "icon":
            Icons.engineering,
      },

      {
        "title":
            "Technician On The Way",
        "subtitle":
            "The cleaning team is on the way to your location.",
        "time":
            "30 min ago",
        "icon":
            Icons.local_shipping,
      },

      {
        "title":
            "Service Started",
        "subtitle":
            "Your apartment cleaning service is now in progress.",
        "time":
            "1 hr ago",
        "icon":
            Icons.cleaning_services,
      },

      {
        "title":
            "Support Request Received",
        "subtitle":
            "Our support team has received your message.",
        "time":
            "Yesterday",
        "icon":
            Icons.support_agent,
      },
    ];

    return Scaffold(
      backgroundColor:
          const Color(
        0xFFF7F9FB,
      ),

      appBar: AppBar(
        title: const Text(
          'Notifications',

          style: TextStyle(
            fontWeight:
                FontWeight.w600,
          ),
        ),

        elevation: 0,

        backgroundColor:
            Colors.white,

        foregroundColor:
            Colors.black,
      ),

      body: notifications.isEmpty

          // =========================================
          // EMPTY STATE
          // =========================================
          ? Center(
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
                          .notifications_off,

                      size: 70,

                      color: Colors
                          .grey
                          .shade400,
                    ),

                    const SizedBox(
                      height: 18,
                    ),

                    const Text(
                      "No notifications yet",

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
                      "Booking updates and support messages will appear here.",

                      textAlign:
                          TextAlign
                              .center,
                    ),
                  ],
                ),
              ),
            )

          // =========================================
          // NOTIFICATION LIST
          // =========================================
          : ListView.separated(
              padding:
                  const EdgeInsets
                      .all(16),

              itemCount:
                  notifications.length,

              separatorBuilder:
                  (_, __) =>
                      const SizedBox(
                height: 12,
              ),

              itemBuilder:
                  (context, index) {

                final item =
                    notifications[
                        index];

                return InkWell(
                  borderRadius:
                      BorderRadius
                          .circular(
                    18,
                  ),

                  onTap: () {

                    if (item[
                            "title"] ==
                        "Technician On The Way") {
                      final bookingController =
                          Get.find<
                              BookingController>();

                      if (bookingController
                              .bookingId
                              .value <=
                          0) {
                        Get.snackbar(
                          "Tracking unavailable",
                          "Open the booking from Upcoming Bookings to start tracking.",
                        );
                        return;
                      }

                      Get.toNamed(
                        '/tracking',
                        arguments: {
                          'bookingId':
                              bookingController
                                  .bookingId
                                  .value,
                        },
                      );
                    }
                  },

                  child: Container(
                    padding:
                        const EdgeInsets
                            .all(16),

                    decoration:
                        BoxDecoration(
                      color:
                          Colors.white,

                      borderRadius:
                          BorderRadius
                              .circular(
                        18,
                      ),

                      boxShadow: [

                        BoxShadow(
                          color: Colors
                              .black
                              .withOpacity(
                            0.04,
                          ),

                          blurRadius:
                              10,

                          offset:
                              const Offset(
                            0,
                            4,
                          ),
                        ),
                      ],
                    ),

                    child: Row(
                      crossAxisAlignment:
                          CrossAxisAlignment
                              .start,

                      children: [

                        Container(
                          height: 48,
                          width: 48,

                          decoration:
                              BoxDecoration(
                            color:
                                const Color(
                              0xFFE6F4F1,
                            ),

                            borderRadius:
                                BorderRadius
                                    .circular(
                              14,
                            ),
                          ),

                          child: Icon(
                            item["icon"]
                                as IconData,

                            color:
                                const Color(
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
                                item["title"]
                                    as String,

                                style:
                                    const TextStyle(
                                  fontWeight:
                                      FontWeight
                                          .bold,

                                  fontSize:
                                      15,
                                ),
                              ),

                              const SizedBox(
                                height: 6,
                              ),

                              Text(
                                item["subtitle"]
                                    as String,

                                style:
                                    const TextStyle(
                                  color: Colors
                                      .black54,
                                ),
                              ),

                              const SizedBox(
                                height: 10,
                              ),

                              Text(
                                item["time"]
                                    as String,

                                style:
                                    const TextStyle(
                                  fontSize:
                                      12,

                                  color: Colors
                                      .grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}

