import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:user_a/src/models/service_model.dart';
import 'package:user_a/src/services/api_client.dart';

class HomeController extends GetxController {

  final ApiClient _api = ApiClient();

  var services = <ServiceModel>[].obs;
  var isLoading = true.obs;

  @override
  void onInit() {
    super.onInit();
    fetchCategories();
  }

  /// ================= FETCH CATEGORIES =================
  Future<void> fetchCategories() async {

    try {

      isLoading.value = true;

      final response = await _api.get("/categories");

      services.value = List.from(response).map((c) {

        IconData icon = Icons.cleaning_services;

        /// simple icon mapping
        final name = (c["name"] ?? "").toString().toLowerCase();

        if (name.contains("office")) icon = Icons.business;
        if (name.contains("home")) icon = Icons.home;
        if (name.contains("apartment")) icon = Icons.apartment;
        if (name.contains("glass")) icon = Icons.window;
        if (name.contains("mall")) icon = Icons.store;
        if (name.contains("theater")) icon = Icons.theaters;

        return ServiceModel(
          id: c["id"].toString(),
          title: c["name"] ?? "Service",
          subtitle: c["description"] ?? "",
          icon: icon,
        );

      }).toList();

    } catch (e) {

      print("API FAILED → USING DEMO DATA");

      /// fallback demo data
      services.value = [

        ServiceModel(
          id: '1',
          title: 'Home Cleaning',
          subtitle: 'Apartments & houses',
          icon: Icons.home,
        ),

        ServiceModel(
          id: '2',
          title: 'Office Cleaning',
          subtitle: 'Corporate workspace',
          icon: Icons.business,
        ),

        ServiceModel(
          id: '3',
          title: 'Glass Cleaning',
          subtitle: 'Exterior & interior',
          icon: Icons.window,
        ),

        ServiceModel(
          id: '4',
          title: 'Mall Cleaning',
          subtitle: 'Retail spaces',
          icon: Icons.store,
        ),
      ];

    } finally {

      isLoading.value = false;

    }
  }
}