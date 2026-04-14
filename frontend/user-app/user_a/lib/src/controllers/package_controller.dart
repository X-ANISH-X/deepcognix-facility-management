import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:user_a/src/models/package_model.dart';
import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/services/api_client.dart';

class PackageController extends GetxController {
  final ApiClient _api = ApiClient();

  final packages        = <PackageModel>[].obs;
  final isLoading       = false.obs;
  final selectedPackage = Rxn<PackageModel>();

  // ================================================================== //
  //  SELECT PACKAGE  — syncs into BookingController immediately
  // ================================================================== //
  void selectPackage(PackageModel package) {
    selectedPackage.value = package;

    // Push packageId + price into BookingController (single source of truth)
    final bookingCtrl = Get.find<BookingController>();
    bookingCtrl.packageId.value = package.id;
    bookingCtrl.price.value     = package.price;

    debugPrint("Package selected → id=${package.id}, price=${package.price}");
  }

  // ================================================================== //
  //  LOAD PACKAGES  (categoryId is now int)
  // ================================================================== //
  Future<void> loadPackages(int categoryId) async {
    try {
      isLoading.value = true;
      selectedPackage.value = null; // reset on every new category

      final response = await _api.get("/services/category/$categoryId");

      debugPrint("Packages API response → $response");

      if (response is List && response.isNotEmpty) {
        packages.value = response.map<PackageModel>((s) {
          return PackageModel(
            id:          _parseInt(s['id']),
            name:        s['name']        ?? "Cleaning Package",
            description: s['description'] ?? "",
            price:       (s['price']      ?? 0).toDouble(),
            checklist: s['checklist'] != null
                ? List<String>.from(s['checklist'])
                : [],
            durationByApartment: s['durationByApartment'] != null
                ? Map<String, String>.from(s['durationByApartment'])
                : {},
          );
        }).toList();
      } else {
        debugPrint("Backend returned empty packages → using fallback");
        _loadFallbackPackages();
      }
    } catch (e) {
      debugPrint("Package API FAILED → $e");
      _loadFallbackPackages();
    } finally {
      isLoading.value = false;
    }
  }

  // ================================================================== //
  //  FALLBACK PACKAGES  (used when API fails or returns empty)
  // ================================================================== //
  void _loadFallbackPackages() {
    packages.value = [
      PackageModel(
        id: 1,
        name: 'Silver Package',
        description: 'Basic apartment cleaning service',
        price: 99,
        checklist: [
          'Dusting furniture and shelves',
          'Sweeping and mopping floors',
          'Cleaning kitchen countertop and sink',
          'Wiping cabinet exteriors',
          'Cleaning bathroom basin, mirror and toilet',
          'Garbage collection and disposal',
          'Dusting window sills and frames',
          'Cleaning door handles',
          'Basic balcony sweeping and mopping',
        ],
        durationByApartment: {
          "Studio": "2-3 hours",
          "1 BHK":  "3-4 hours",
          "2 BHK":  "4-5 hours",
          "3 BHK":  "5-6 hours",
        },
      ),
      PackageModel(
        id: 2,
        name: 'Gold Package',
        description: 'Comprehensive deep cleaning service',
        price: 149,
        checklist: [
          'All Silver package services',
          'Deep cleaning kitchen cabinets',
          'Degreasing kitchen wall tiles',
          'Cleaning kitchen appliance exteriors',
          'Deep cleaning bathroom tiles and shower',
          'Glass and mirror polishing',
          'Vacuum cleaning sofas and cushions',
          'Detailed dusting doors and wardrobes',
          'Interior window glass cleaning',
          'Balcony washing and cleaning',
          'Deep floor cleaning and mopping',
        ],
        durationByApartment: {
          "Studio": "3-4 hours",
          "1 BHK":  "4-5 hours",
          "2 BHK":  "5-6 hours",
          "3 BHK":  "6-7 hours",
        },
      ),
      PackageModel(
        id: 3,
        name: 'Platinum Package',
        description: 'Premium deep cleaning and sanitization',
        price: 249,
        checklist: [
          'All Gold package services',
          'Steam sanitization of kitchen and bathrooms',
          'Deep vacuum cleaning carpets and sofas',
          'Mattress vacuum cleaning',
          'Cleaning behind accessible furniture',
          'Cleaning AC vents',
          'Interior window glass streak-free cleaning',
          'Wall spot cleaning',
          'Wardrobe internal cleaning',
          'Interior fridge cleaning',
          'Premium floor polishing',
          'Balcony pressure cleaning',
        ],
        durationByApartment: {
          "Studio": "4-5 hours",
          "1 BHK":  "5-6 hours",
          "2 BHK":  "6-7 hours",
          "3 BHK":  "7-8 hours",
        },
      ),
    ];
  }

  // ================================================================== //
  //  HELPER
  // ================================================================== //
  int _parseInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value.toString()) ?? 0;
  }
}