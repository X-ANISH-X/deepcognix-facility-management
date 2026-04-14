import 'package:get/get.dart';
import 'package:user_a/src/models/package_model.dart';
import 'package:user_a/src/services/api_client.dart';

class PackageController extends GetxController {
  final _api = ApiClient();

  final packages = <PackageModel>[].obs;
  final isLoading = false.obs;
  final selectedPackage = Rxn<PackageModel>();

  /// Populated before navigating here from HomeScreen
  int selectedServiceId = 0;

  @override
  void onInit() {
    super.onInit();
    fetchPackages();
  }

  Future<void> fetchPackages() async {
    try {
      isLoading.value = true;
      final data = await _api.get('/packages') as List;
      final pkgList = data
          .map((e) => PackageModel.fromJson(e as Map<String, dynamic>))
          .toList();

      // Enrich each package with its checklist task names
      final enriched = <PackageModel>[];
      for (final pkg in pkgList) {
        try {
          final tasks = await _api.get('/packages/${pkg.id}/tasks') as List;
          final names = tasks
              .map((t) => (t as Map<String, dynamic>)['task_name'] as String)
              .toList();
          enriched.add(pkg.withChecklist(names));
        } catch (_) {
          enriched.add(pkg);
        }
      }
      packages.value = enriched;
    } catch (_) {
      // error handled by empty list — UI will show accordingly
    } finally {
      isLoading.value = false;
    }
  }

  void selectPackage(PackageModel package) {
    selectedPackage.value = package;
  }
}
