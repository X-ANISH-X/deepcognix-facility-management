import 'package:flutter/foundation.dart';
import 'package:get/get.dart';

import 'package:user_a/src/models/package_model.dart';
import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/services/api_client.dart';

class PackageController extends GetxController {

  final ApiClient _api =
      ApiClient();

  final packages =
      <PackageModel>[].obs;

  final isLoading =
      false.obs;

  final hasError =
      false.obs;

  final errorMessage =
      "".obs;

  final selectedPackage =
      Rxn<PackageModel>();

  // =========================================================
  // SELECT PACKAGE
  // =========================================================
  void selectPackage(
    PackageModel package,
  ) {

    selectedPackage.value =
        package;

    final bookingCtrl =
        Get.find<BookingController>();

    bookingCtrl.packageId.value =
        package.id;

    bookingCtrl.price.value =
        package.price;
  }

  // =========================================================
  // LOAD PACKAGES
  // =========================================================
  Future<void> loadPackages(
    int serviceId,
  ) async {

    try {

      isLoading.value = true;

      hasError.value = false;

      errorMessage.value = "";

      selectedPackage.value =
          null;

      // =====================================================
      // FETCH REAL PACKAGES
      // =====================================================
      final response =
          await _api.get(
        "/packages/",
      );

      if (response is! List ||
          response.isEmpty) {

        throw Exception(
          "No packages found",
        );
      }

      final loadedPackages =
          <PackageModel>[];

      for (final p in response) {

        // =================================================
        // FETCH PACKAGE TASKS
        // =================================================
        List<String> tasks = [];

        try {

          final taskResp =
              await _api.get(
            "/packages/${p['id']}/tasks",
          );

          if (taskResp is List) {

            tasks =
                taskResp.map<String>(
              (t) {

                return t["task_name"]
                        ?.toString() ??
                    "";
              },
            ).where(
              (e) =>
                  e.trim().isNotEmpty,
            ).toList();
          }

        } catch (_) {}

        loadedPackages.add(

          PackageModel(

            id: _parseInt(
              p['id'],
            ),

            name:
                p['name']
                        ?.toString() ??
                    '',

            description:
                p['description']
                        ?.toString() ??
                    '',

            price:
                double.tryParse(
                      p['price']
                              ?.toString() ??
                          "0",
                    ) ??
                    0,

            checklist:
                tasks,

            // =============================================
            // TEMP FRONTEND DURATION MAPPING
            // =============================================
            durationByApartment:
                _durationMap(
              p['name']
                      ?.toString() ??
                  '',
            ),
          ),
        );
      }

      packages.value =
          loadedPackages;

    } catch (e) {

      hasError.value = true;

      errorMessage.value =
          "Unable to load packages.";

      debugPrint(
        "PACKAGE LOAD ERROR → $e",
      );

      _loadFallbackPackages();

    } finally {

      isLoading.value = false;
    }
  }

  // =========================================================
  // RETRY
  // =========================================================
  Future<void> retryLoad(
    int serviceId,
  ) async {

    await loadPackages(
      serviceId,
    );
  }

  // =========================================================
  // DURATION MAP
  // =========================================================
  Map<String, String>
      _durationMap(
    String packageName,
  ) {

    final lower =
        packageName
            .toLowerCase();

    if (lower.contains(
      'silver',
    )) {

      return {

        'Studio':
            '2–3 hours',

        '1 BHK':
            '3–4 hours',

        '2 BHK':
            '4–5 hours',

        '3 BHK':
            '5–6 hours',
      };
    }

    if (lower.contains(
      'gold',
    )) {

      return {

        'Studio':
            '3–4 hours',

        '1 BHK':
            '4–5 hours',

        '2 BHK':
            '5–6 hours',

        '3 BHK':
            '6–7 hours',
      };
    }

    return {

      'Studio':
          '4–5 hours',

      '1 BHK':
          '5–6 hours',

      '2 BHK':
          '6–7 hours',

      '3 BHK':
          '7–8 hours',
    };
  }

  // =========================================================
  // FALLBACK PACKAGES
  // =========================================================
  void _loadFallbackPackages() {

    packages.value = [

      PackageModel(
        id: 1,

        name:
            'Silver Package',

        description:
            'Basic Cleaning',

        price: 999,

        checklist: [

          'Dusting of furniture, shelves and surfaces',

          'Sweeping and mopping of floors',

          'Cleaning kitchen countertop and sink',

          'Wiping cabinet exteriors',

          'Cleaning bathroom basin, mirror and toilet',

          'Garbage collection and disposal',

          'Dusting window sills and frames',

          'Cleaning door handles',

          'Basic balcony sweeping and mopping',
        ],

        durationByApartment: {

          'Studio':
              '2–3 hours',

          '1 BHK':
              '3–4 hours',

          '2 BHK':
              '4–5 hours',

          '3 BHK':
              '5–6 hours',
        },
      ),

      PackageModel(
        id: 2,

        name:
            'Gold Package',

        description:
            'Standard Deep Cleaning',

        price: 1999,

        checklist: [

          'Includes all Silver package services',

          'Deep cleaning kitchen cabinets',

          'Degreasing kitchen wall tiles',

          'Cleaning appliance exteriors',

          'Deep cleaning bathrooms and shower area',

          'Glass and mirror polishing',

          'Vacuum cleaning sofas and cushions',

          'Detailed dusting of doors and wardrobes',

          'Interior window glass cleaning',

          'Balcony washing and cleaning',

          'Deep floor cleaning and mopping',
        ],

        durationByApartment: {

          'Studio':
              '3–4 hours',

          '1 BHK':
              '4–5 hours',

          '2 BHK':
              '5–6 hours',

          '3 BHK':
              '6–7 hours',
        },
      ),

      PackageModel(
        id: 3,

        name:
            'Platinum Package',

        description:
            'Premium Deep Cleaning & Sanitization',

        price: 2999,

        checklist: [

          'Includes all Gold package services',

          'Steam sanitization of bathrooms and kitchen',

          'Deep vacuum cleaning of carpets and sofas',

          'Mattress vacuum cleaning',

          'Cleaning behind accessible furniture',

          'Cleaning AC vents',

          'Interior streak-free glass cleaning',

          'Wall spot cleaning',

          'Detailed wardrobe internal cleaning',

          'Interior fridge cleaning',

          'Premium floor polishing',

          'Balcony pressure cleaning',
        ],

        durationByApartment: {

          'Studio':
              '4–5 hours',

          '1 BHK':
              '5–6 hours',

          '2 BHK':
              '6–7 hours',

          '3 BHK':
              '7–8 hours',
        },
      ),
    ];
  }

  // =========================================================
  // PARSE INT
  // =========================================================
  int _parseInt(
    dynamic value,
  ) {

    if (value is int) {
      return value;
    }

    return int.tryParse(
          value.toString(),
        ) ??
        0;
  }
}