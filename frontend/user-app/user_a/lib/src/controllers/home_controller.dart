import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:user_a/src/models/service_model.dart';
import 'package:user_a/src/services/api_client.dart';

class HomeController extends GetxController {
  final ApiClient _api = ApiClient();

  final services = <ServiceModel>[].obs;
  final isLoading = true.obs;
  final hasError = false.obs;
  final errorMessage = "".obs;

  @override
  void onInit() {
    super.onInit();
    fetchCategories();
  }

  // ================================================================== //
  // FETCH SERVICES
  // ================================================================== //
  Future<void> fetchCategories() async {
    try {
      isLoading.value = true;
      hasError.value = false;

      final response = await _api.get("/categories");

      if (response is! List) throw Exception("Invalid response");

      services.value = response.map<ServiceModel>((c) {
        return ServiceModel(
          id: _parseInt(c["id"]),
          title: c["name"] ?? "Service",
          subtitle: c["description"] ?? "",
          price: (c["base_price"] ?? 0).toDouble(),
          icon: _iconForCategory(c["name"] ?? ""),
        );
      }).toList();

    } catch (e) {
      hasError.value = true;
      errorMessage.value = e.toString();

      services.value = _fallbackServices();
    } finally {
      isLoading.value = false;
    }
  }

  /// 🔥 FIXED: NOW RETURNS Future<void>
  Future<void> refresh() async {
    await fetchCategories();
  }

  // ================================================================== //
  // FALLBACK DATA
  // ================================================================== //
  List<ServiceModel> _fallbackServices() => [

    ServiceModel(
      id: 1,
      title: "Studio - Basic",
      subtitle: "Basic cleaning",
      price: 499,
      icon: Icons.home,
    ),

    ServiceModel(
      id: 2,
      title: "Studio - Silver",
      subtitle: "Deep cleaning",
      price: 699,
      icon: Icons.home,
    ),

    ServiceModel(
      id: 3,
      title: "Studio - Premium",
      subtitle: "Premium cleaning",
      price: 899,
      icon: Icons.home,
    ),

    ServiceModel(
      id: 4,
      title: "2BHK - Basic",
      subtitle: "Basic cleaning",
      price: 799,
      icon: Icons.apartment,
    ),

    ServiceModel(
      id: 5,
      title: "2BHK - Silver",
      subtitle: "Deep cleaning",
      price: 999,
      icon: Icons.apartment,
    ),

    ServiceModel(
      id: 6,
      title: "2BHK - Premium",
      subtitle: "Premium cleaning",
      price: 1199,
      icon: Icons.apartment,
    ),
  ];

  // ================================================================== //
  IconData _iconForCategory(String name) {
    final n = name.toLowerCase();
    if (n.contains("apartment")) return Icons.apartment;
    if (n.contains("home")) return Icons.home;
    return Icons.cleaning_services;
  }

  int _parseInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value.toString()) ?? 0;
  }
}