import 'package:get/get.dart';
import 'package:user_a/src/models/package_model.dart';

class PackageController extends GetxController {
  final packages = <PackageModel>[
    PackageModel(
      id: 'basic',
      name: 'pkg_basic',
      description: 'pkg_basic_desc',
      price: 99,
      checklist: [
        'task_dusting',
        'task_vacuuming',
        'task_trash',
      ],
    ),
    PackageModel(
      id: 'standard',
      name: 'pkg_standard',
      description: 'pkg_standard_desc',
      price: 149,
      checklist: [
        'task_dusting',
        'task_vacuuming',
        'task_mopping',
        'task_restroom',
      ],
    ),
    PackageModel(
      id: 'premium',
      name: 'pkg_premium',
      description: 'pkg_premium_desc',
      price: 249,
      checklist: [
        'task_all_standard',
        'task_deep_cleaning',
        'task_carpet_cleaning',
      ],
    ),
  ].obs;

  final selectedPackage = Rxn<PackageModel>();

  void selectPackage(PackageModel package) {
    selectedPackage.value = package;
  }
}
