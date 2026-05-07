
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/booking_controller.dart';

class LiveTrackingScreen
    extends StatelessWidget {

  const LiveTrackingScreen({
    super.key,
  });

  @override
  Widget build(
    BuildContext context,
  ) {

    final controller =
        Get.find<BookingController>();

    return Scaffold(
      backgroundColor:
          const Color(
        0xFFF7F9FB,
      ),

      appBar: AppBar(
        title: const Text(
          "Live Tracking",
        ),

        backgroundColor:
            Colors.white,

        foregroundColor:
            Colors.black,

        elevation: 0,
      ),

      body: Obx(() {

        final status =
            controller
                .bookingStatus
                .value;

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
              // ETA STATUS CARD
              // ==========================================
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

                    Text(
                      _statusTitle(
                        status,
                      ),

                      style:
                          const TextStyle(
                        fontSize: 20,
                        fontWeight:
                            FontWeight
                                .bold,
                      ),
                    ),

                    const SizedBox(
                      height: 8,
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
                      ),
                    ),

                    const SizedBox(
                      height: 14,
                    ),

                    if (status ==
                        "on_the_way")

                      Obx(
                        () => Text(
                          "Estimated arrival in ${controller.estimatedArrivalMinutes.value} mins",
                        ),
                      ),

                    if (status ==
                        "in_progress")

                      Obx(
                        () => Text(
                          "Estimated completion in ${controller.estimatedCompletionMinutes.value} mins",
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(
                height: 24,
              ),

              // ==========================================
              // TIMELINE
              // ==========================================
              Expanded(
                child: Container(
                  width:
                      double.infinity,

                  padding:
                      const EdgeInsets
                          .all(20),

                  decoration:
                      BoxDecoration(
                    color:
                        Colors.white,

                    borderRadius:
                        BorderRadius
                            .circular(
                      24,
                    ),
                  ),

                  child: Column(
                    crossAxisAlignment:
                        CrossAxisAlignment
                            .start,

                    children: [

                      const Text(
                        "Service Progress",

                        style:
                            TextStyle(
                          fontSize: 18,
                          fontWeight:
                              FontWeight
                                  .bold,
                        ),
                      ),

                      const SizedBox(
                        height: 24,
                      ),

                      Expanded(
                        child: ListView(
                          children: [

                            _timelineTile(
                              "Booking Submitted",
                              true,
                            ),

                            _timelineTile(
                              "Technician Assigned",
                              status !=
                                  "submitted",
                            ),

                            _timelineTile(
                              "Technician On The Way",
                              status ==
                                      "on_the_way" ||
                                  status ==
                                      "arrival_approval_pending" ||
                                  status ==
                                      "in_progress" ||
                                  status ==
                                      "customer_review_pending" ||
                                  status ==
                                      "admin_review_pending" ||
                                  status ==
                                      "completed",
                            ),

                            _timelineTile(
                              "Arrival Confirmed",
                              status ==
                                      "arrival_approval_pending" ||
                                  status ==
                                      "in_progress" ||
                                  status ==
                                      "customer_review_pending" ||
                                  status ==
                                      "admin_review_pending" ||
                                  status ==
                                      "completed",
                            ),

                            _timelineTile(
                              "Cleaning In Progress",
                              status ==
                                      "in_progress" ||
                                  status ==
                                      "customer_review_pending" ||
                                  status ==
                                      "admin_review_pending" ||
                                  status ==
                                      "completed",
                            ),

                            _timelineTile(
                              "Customer Approval",
                              status ==
                                      "admin_review_pending" ||
                                  status ==
                                      "completed",
                            ),

                            _timelineTile(
                              "Completed",
                              status ==
                                  "completed",
                            ),
                          ],
                        ),
                      ),

                      // ======================================
                      // CHECKLIST PROGRESS
                      // ======================================
                      if (status ==
                              "in_progress" ||
                          status ==
                              "customer_review_pending")

                        Column(
                          crossAxisAlignment:
                              CrossAxisAlignment
                                  .start,

                          children: [

                            const SizedBox(
                              height: 10,
                            ),

                            const Text(
                              "Checklist Progress",

                              style:
                                  TextStyle(
                                fontWeight:
                                    FontWeight
                                        .bold,
                              ),
                            ),

                            const SizedBox(
                              height: 10,
                            ),

                            Obx(
                              () => LinearProgressIndicator(
                                value:
                                    controller.progress,
                              ),
                            ),

                            const SizedBox(
                              height: 8,
                            ),

                            Obx(
                              () => Text(
                                "${controller.completedTasks.length}/${controller.checklist.length} tasks completed",
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              ),

              const SizedBox(
                height: 20,
              ),

              // ==========================================
              // TECHNICIAN CARD
              // ==========================================
              if (controller
                  .technicianName
                  .value
                  .isNotEmpty)

                Container(
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
                  ),

                  child: Row(
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
                ),

              const SizedBox(
                height: 20,
              ),

              // ==========================================
              // ACTION BUTTONS
              // ==========================================
              _actionButtons(
                controller,
                status,
              ),
            ],
          ),
        );
      }),
    );
  }

  // =====================================================
  // TIMELINE TILE
  // =====================================================
  Widget _timelineTile(
    String title,
    bool completed,
  ) {
    return Padding(
      padding:
          const EdgeInsets.only(
        bottom: 18,
      ),

      child: Row(
        children: [

          Icon(
            completed
                ? Icons
                    .check_circle
                : Icons
                    .radio_button_unchecked,

            color: completed
                ? const Color(
                    0xFF0F9D8A,
                  )
                : Colors.grey,
          ),

          const SizedBox(
            width: 14,
          ),

          Text(
            title,

            style: TextStyle(
              fontWeight:
                  completed
                      ? FontWeight
                          .w600
                      : FontWeight
                          .w400,
            ),
          ),
        ],
      ),
    );
  }

  // =====================================================
  // ACTION BUTTONS
  // =====================================================
  Widget _actionButtons(
    BookingController controller,
    String status,
  ) {

    if (status ==
        "arrival_approval_pending") {

      return SizedBox(
        width:
            double.infinity,

        child: ElevatedButton(
          onPressed: () async {

            await controller
                .approveArrival();
          },

          style:
              ElevatedButton
                  .styleFrom(
            backgroundColor:
                const Color(
              0xFF0F9D8A,
            ),
          ),

          child: const Text(
            "Confirm Arrival",
          ),
        ),
      );
    }

    if (status ==
        "customer_review_pending") {

      return Column(
        children: [

          SizedBox(
            width:
                double.infinity,

            child:
                ElevatedButton(
              onPressed:
                  () async {

                await controller
                    .approveWork();
              },

              style:
                  ElevatedButton
                      .styleFrom(
                backgroundColor:
                    const Color(
                  0xFF0F9D8A,
                ),
              ),

              child: const Text(
                "Approve Work",
              ),
            ),
          ),

          const SizedBox(
            height: 12,
          ),

          SizedBox(
            width:
                double.infinity,

            child:
                OutlinedButton(
              onPressed: () {

                _showReworkDialog(
                  controller,
                );
              },

              child: const Text(
                "Request Rework",
              ),
            ),
          ),
        ],
      );
    }

    if (status ==
        "completed") {

      return SizedBox(
        width:
            double.infinity,

        child:
            ElevatedButton(
          onPressed: () {

            Get.offAllNamed(
              '/home',
            );
          },

          style:
              ElevatedButton
                  .styleFrom(
            backgroundColor:
                const Color(
              0xFF0F9D8A,
            ),
          ),

          child: const Text(
            "Done",
          ),
        ),
      );
    }

    return const SizedBox();
  }

  // =====================================================
  // REWORK DIALOG
  // =====================================================
  void _showReworkDialog(
    BookingController controller,
  ) {

    final reasonCtrl =
        TextEditingController();

    Get.dialog(
      AlertDialog(
        title: const Text(
          "Request Rework",
        ),

        content: TextField(
          controller:
              reasonCtrl,

          maxLines: 4,

          decoration:
              const InputDecoration(
            hintText:
                "Describe the issue...",
          ),
        ),

        actions: [

          TextButton(
            onPressed: () {

              Get.back();
            },

            child: const Text(
              "Cancel",
            ),
          ),

          ElevatedButton(
            onPressed:
                () async {

              await controller
                  .requestRework(
                reasonCtrl.text,
              );

              Get.back();
            },

            child: const Text(
              "Submit",
            ),
          ),
        ],
      ),
    );
  }

  // =====================================================
  // STATUS TITLE
  // =====================================================
  String _statusTitle(
    String status,
  ) {
    switch (status) {

      case "submitted":
        return "Booking Submitted";

      case "assigned":
        return "Technician Assigned";

      case "on_the_way":
        return "Technician On The Way";

      case "arrival_approval_pending":
        return "Technician Arrived";

      case "in_progress":
        return "Cleaning In Progress";

      case "customer_review_pending":
        return "Awaiting Customer Approval";

      case "admin_review_pending":
        return "Awaiting Final Verification";

      case "completed":
        return "Service Completed";

      case "rework_requested":
        return "Rework Requested";

      default:
        return "Service Tracking";
    }
  }

  // =====================================================
  // STATUS DESCRIPTION
  // =====================================================
  String _statusDescription(
    String status,
  ) {
    switch (status) {

      case "submitted":
        return "Your booking request has been submitted successfully.";

      case "assigned":
        return "A technician has been assigned to your service.";

      case "on_the_way":
        return "Your technician is currently on the way to your location.";

      case "arrival_approval_pending":
        return "Technician has arrived. Please confirm arrival to begin service.";

      case "in_progress":
        return "Cleaning professionals are currently working on your apartment.";

      case "customer_review_pending":
        return "Please verify the cleaning work before final approval.";

      case "admin_review_pending":
        return "Awaiting final verification from admin team.";

      case "completed":
        return "Your service has been completed successfully.";

      case "rework_requested":
        return "Your rework request has been submitted.";

      default:
        return "Tracking cleaning service progress.";
    }
  }
}

