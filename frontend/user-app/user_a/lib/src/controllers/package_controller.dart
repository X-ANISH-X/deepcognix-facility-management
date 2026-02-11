import 'package:get/get.dart';
import 'package:user_a/src/models/package_model.dart';

class PackageController extends GetxController {
  final packages = <PackageModel>[
    PackageModel(
      id: 'basic',
      name: 'Basic',
      description: 'Essential cleaning',
      price: 99,
      checklist: [
        'Dusting',
        'Vacuuming',
        'Trash removal',
      ],
    ),
    PackageModel(
      id: 'standard',
      name: 'Standard',
      description: 'Most popular choice',
      price: 149,
      checklist: [
        'Dusting',
        'Vacuuming',
        'Mopping',
        'Restroom cleaning',
      ],
    ),
    PackageModel(
      id: 'premium',
      name: 'Premium',
      description: 'Deep cleaning',
      price: 249,
      checklist: [
        'All Standard tasks',
        'Deep cleaning',
        'Carpet cleaning',
      ],
    ),
  ].obs;

  // ✅ THIS FIXES YOUR SELECTION ISSUE
  final selectedPackage = Rxn<PackageModel>();

  void selectPackage(PackageModel package) {
    selectedPackage.value = package;
  }
}
