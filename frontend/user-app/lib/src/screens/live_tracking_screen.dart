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

        if (!hasBookingContext) {

          return const Center(
            child: Text(
              "Unable to load live tracking for this booking.",
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

          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment
                      .start,

              mainAxisSize: MainAxisSize.min,

              children: [

              // ==========================================
              // STATUS CARD
              // ==========================================
              AnimatedContainer(
                duration: const Duration(
                  milliseconds: 400,
                ),
                curve: Curves.easeInOut,
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
                  boxShadow: status == "on_the_way"
                      ? [
                          BoxShadow(
                            color:
                                Colors.black12,
                            blurRadius: 14,
                            offset: const Offset(
                              0,
                              8,
                            ),
                          ),
                        ]
                      : null,
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

                    if (status == "on_the_way") ...[
                      const SizedBox(
                        height: 18,
                      ),

                      Row(
                        crossAxisAlignment:
                            CrossAxisAlignment
                                .start,

                        children: [
                          Container(
                            padding:
                                const EdgeInsets
                                    .all(12),
                            decoration:
                                BoxDecoration(
                              color:
                                  const Color(
                                0xFFE6F4F1,
                              ),
                              borderRadius:
                                  BorderRadius
                                      .circular(
                                16,
                              ),
                            ),
                            child: const Icon(
                              Icons.local_shipping,
                              color:
                                  Color(
                                0xFF0F9D8A,
                              ),
                              size: 28,
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

                              children: const [
                                Text(
                                  "Technician On The Way",
                                  style:
                                      TextStyle(
                                    fontWeight:
                                        FontWeight
                                            .bold,
                                  ),
                                ),

                                SizedBox(
                                  height: 8,
                                ),

                                Text(
                                  "Our technician is currently travelling to your location.",
                                ),

                                SizedBox(
                                  height: 6,
                                ),

                                Text(
                                  "You can confirm arrival once the technician reaches your location.",
                                  style:
                                      TextStyle(
                                    color:
                                        Colors.black54,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(
                height: 24,
              ),

              // ==========================================
              // TIMELINE
              // ==========================================
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Service Progress",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 24),
                    _timelineTile(
                      "Booking Submitted",
                      true,
                    ),
                    _timelineTile(
                      "Technician Assigned",
                      status != "submitted",
                    ),
                    _timelineTile(
                      "Technician On The Way",
                      status == "on_the_way" ||
                          status == "arrival_confirmed" ||
                          status == "cleaning_in_progress" ||
                          status == "customer_review_pending" ||
                          status == "admin_review_pending" ||
                          status == "completed",
                    ),
                    _timelineTile(
                      "Arrival Confirmed",
                      status == "arrival_confirmed" ||
                          status == "cleaning_in_progress" ||
                          status == "customer_review_pending" ||
                          status == "admin_review_pending" ||
                          status == "completed",
                    ),
                    _timelineTile(
                      "Cleaning In Progress",
                      status == "cleaning_in_progress" ||
                          status == "customer_review_pending" ||
                          status == "admin_review_pending" ||
                          status == "completed",
                    ),
                    _timelineTile(
                      "Customer Approval",
                      status == "admin_review_pending" || status == "completed",
                    ),
                    _timelineTile(
                      "Completed",
                      status == "completed",
                    ),
                    if (status == "cleaning_in_progress")
                      Padding(
                        padding: const EdgeInsets.only(top: 10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "Checklist Progress",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Obx(
                              () => LinearProgressIndicator(
                                value: controller.progress,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Obx(
                              () => Text(
                                "${controller.completedTasks.length}/${controller.checklist.length} tasks completed",
                              ),
                            ),
                            const SizedBox(height: 10),
                            Obx(
                              () {
                                final items = controller.checklist;
                                return Column(
                                  children: items.map((task) {
                                    final completed = controller.completedTasks.contains(task);
                                    return CheckboxListTile(
                                      value: completed,
                                      onChanged: (val) {
                                        if (val == true) {
                                          if (!controller.completedTasks.contains(task)) {
                                            controller.completedTasks.add(task);
                                          }
                                        } else {
                                          controller.completedTasks.removeWhere((t) => t == task);
                                        }
                                        controller.update();
                                      },
                                      title: Text(task),
                                      controlAffinity: ListTileControlAffinity.leading,
                                    );
                                  }).toList(),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(
                height: 16,
              ),

              // ==========================================
              // UPGRADE BUTTON
              // ==========================================
              SizedBox(
                width:
                    double.infinity,

                child:
                    OutlinedButton.icon(

                  onPressed: () {

                    _showUpgradeDialog(
                      context,
                    );
                  },

                  icon: const Icon(
                    Icons.upgrade,
                  ),

                  label: const Text(
                    "Request Upgrade / Add-On",
                  ),

                  style:
                      OutlinedButton
                          .styleFrom(
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

              _actionButtons(
                controller,
                status,
              ),
            ],
          ),
        ),
      );
      }),
    );
  }

  // ==========================================
  // UPGRADE DIALOG
  // ==========================================
  Future<void> _showUpgradeDialog(
    BuildContext context,
  ) async {

    await showDialog(
      context: context,

      builder: (_) {

        return AlertDialog(

          shape:
              RoundedRectangleBorder(
            borderRadius:
                BorderRadius.circular(
              20,
            ),
          ),

          title: const Text(
            "Request Upgrade / Add-On",
          ),

          content: const Column(
            mainAxisSize:
                MainAxisSize.min,

            crossAxisAlignment:
                CrossAxisAlignment
                    .start,

            children: [

              Text(
                "Need additional services or package upgrades during your booking?",
              ),

              SizedBox(
                height: 18,
              ),

              Text(
                "Available Options:",
                style: TextStyle(
                  fontWeight:
                      FontWeight.bold,
                ),
              ),

              SizedBox(
                height: 10,
              ),

              Text(
                "• Upgrade to Gold Package",
              ),

              Text(
                "• Upgrade to Platinum Package",
              ),

              Text(
                "• Carpet Shampoo Cleaning",
              ),

              Text(
                "• Sofa Cleaning",
              ),

              Text(
                "• Kitchen Deep Cleaning",
              ),

              Text(
                "• Sanitization",
              ),

              SizedBox(
                height: 18,
              ),

              Text(
                "Please contact admin/support directly for modifications during active service.",
              ),

              SizedBox(
                height: 18,
              ),

              Text(
                "Admin Contact:",
                style: TextStyle(
                  fontWeight:
                      FontWeight.bold,
                ),
              ),

              SizedBox(
                height: 8,
              ),

              Text(
                "+971 50 123 4567",
              ),

              Text(
                "support@deepcognix.com",
              ),
            ],
          ),

          actions: [

            TextButton(
              onPressed: () {

                Navigator.pop(
                  context,
                );
              },

              child: const Text(
                "Close",
              ),
            ),
          ],
        );
      },
    );
  }

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

  Widget _actionButtons(
    BookingController controller,
    String status,
  ) {

    if (status == "on_the_way") {

  return SizedBox(
    width: double.infinity,

    child: ElevatedButton(
      onPressed: () async {
        await controller.approveArrival();
      },

      child: const Text(
        "Confirm Arrival",
      ),
    ),
  );
}

if (status == "cleaning_in_progress" &&
    controller.checklist.isNotEmpty &&
    controller.completedTasks.length ==
        controller.checklist.length) {

  return Column(
    children: [

      SizedBox(
        width: double.infinity,

        child: ElevatedButton(
          onPressed: () async {

            controller.bookingStatus.value =
                "completed";

            controller.update();

            await controller.approveWork();
          },

          child: const Text(
            "Approve Completion",
          ),
        ),
      ),

      const SizedBox(
        height: 12,
      ),

      SizedBox(
        width: double.infinity,

        child: OutlinedButton(
          onPressed: () {
            _showReworkDialog(controller);
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

              child: const Text(
                "Approve Completion",
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

          child: const Text(
            "Done",
          ),
        ),
      );
    }

    return const SizedBox();
  }

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

      case "arrival_confirmed":
        return "Technician Arrived";

      case "cleaning_in_progress":
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
         return "Your technician has reached the location and is waiting for your confirmation.";

      case "arrival_confirmed":
         return "Technician has arrived. Service can now begin.";

      case "cleaning_in_progress":
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
