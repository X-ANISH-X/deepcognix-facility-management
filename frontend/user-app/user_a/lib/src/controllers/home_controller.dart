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
    fetchServices();
  }

  Future<void> fetchServices() async {
    try {
      isLoading.value = true;

      final response = await _api.get("/services");

      services.value = List.from(response).map((s) {
        return ServiceModel(
          id: s["id"].toString(),
          title: s["title"],
          subtitle: s["subtitle"],
          icon: Icons.business,
        );
      }).toList();
    } catch (e) {
      print("API FAILED → USING DEMO DATA");

      // 🔥 DEMO DATA FALLBACK
      services.value = [
        ServiceModel(
          id: 'office',
          title: 'Office Cleaning',
          subtitle: 'Corporate & workspace',
          icon: Icons.business,
        ),
        ServiceModel(
          id: 'mall',
          title: 'Mall Cleaning',
          subtitle: 'Large retail spaces',
          icon: Icons.store_mall_directory,
        ),
        ServiceModel(
          id: 'theater',
          title: 'Theater Cleaning',
          subtitle: 'Auditorium & lobby',
          icon: Icons.theaters,
        ),
        ServiceModel(
          id: 'glass',
          title: 'Glass Cleaning',
          subtitle: 'Exterior & interior',
          icon: Icons.window,
        ),
      ];
    } finally {
      isLoading.value = false;
    }
  }
}
