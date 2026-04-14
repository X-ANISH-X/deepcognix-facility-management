import 'package:get/get.dart';
import 'package:user_a/src/models/service_model.dart';
import 'package:user_a/src/services/api_client.dart';

class HomeController extends GetxController {
  final _api = ApiClient();

  final services = <ServiceModel>[].obs;
  final isLoading = false.obs;
  final errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    fetchServices();
  }

  Future<void> fetchServices() async {
    try {
      isLoading.value = true;
      errorMessage.value = '';
      final data = await _api.get('/services') as List;
      services.value = data
          .map((e) => ServiceModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      errorMessage.value = e.toString().replaceFirst('Exception: ', '');
    } finally {
      isLoading.value = false;
    }
  }
}
