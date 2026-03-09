import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:user_a/src/controllers/booking_controller.dart';

class TrackingScreen extends GetView<BookingController> {
  const TrackingScreen({super.key});

  @override
  Widget build(BuildContext context) {

    final mapController = Rxn<GoogleMapController>();

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Live Tracking",
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        elevation: 0,
      ),
      body: Column(
        children: [

          /// ---------------- MAP ----------------
          Expanded(
            child: Obx(() {

              final lat = controller.technicianLat.value;
              final lng = controller.technicianLng.value;

              /// move camera when technician moves
              if (mapController.value != null) {
                mapController.value!.animateCamera(
                  CameraUpdate.newLatLng(
                    LatLng(lat, lng),
                  ),
                );
              }

              return GoogleMap(

                onMapCreated: (GoogleMapController c) {
                  mapController.value = c;
                },

                initialCameraPosition: CameraPosition(
                  target: LatLng(lat, lng),
                  zoom: 15,
                ),

                markers: {
                  Marker(
                    markerId: const MarkerId("technician"),
                    position: LatLng(lat, lng),
                    infoWindow: InfoWindow(
                      title: controller.technicianName.value,
                      snippet: "Technician",
                    ),
                  ),
                },

                myLocationEnabled: true,
                myLocationButtonEnabled: true,

                zoomControlsEnabled: false,
              );
            }),
          ),

          /// ---------------- TECHNICIAN CARD ----------------
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(
                    Theme.of(context).brightness == Brightness.dark
                        ? 0.2
                        : 0.05,
                  ),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Obx(() {

              return Row(
                children: [

                  const CircleAvatar(
                    radius: 26,
                    backgroundImage:
                        NetworkImage("https://i.pravatar.cc/150?img=3"),
                  ),

                  const SizedBox(width: 14),

                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [

                      Text(
                        controller.technicianName.value.isEmpty
                            ? "Technician"
                            : controller.technicianName.value,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),

                      const SizedBox(height: 4),

                      const Text("Technician on the way"),
                    ],
                  ),

                  const Spacer(),

                  const Text(
                    "Live",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ],
              );
            }),
          ),
        ],
      ),
    );
  }
}