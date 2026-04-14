import 'package:get/get.dart';
import '../screens/home_screen.dart';
import '../services/auth_service.dart';

class AuthController extends GetxController {
  final AuthService _authService = AuthService();

  var isLoading = false.obs;

  Future<void> login(String email, String password) async {
    try {
      isLoading.value = true;

      await _authService.login(email, password);

      Get.snackbar("Success", "Login successful");
      Get.offAll(() => const HomeScreen());
    } catch (e) {
      Get.snackbar("Error", e.toString().replaceFirst("Exception: ", ""));
    } finally {
      isLoading.value = false;
    }
  }
}
