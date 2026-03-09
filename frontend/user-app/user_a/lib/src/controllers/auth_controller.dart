import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:user_a/src/services/api_client.dart';
import 'package:user_a/src/screens/home_screen.dart';

class AuthController extends GetxController {

  final ApiClient _api = ApiClient();
  final GetStorage _storage = GetStorage();

  RxBool isLoading = false.obs;

  /// LOGIN
  Future<void> login(String email, String password) async {

    if (email.isEmpty || password.isEmpty) {
      Get.snackbar("Error", "Enter email & password");
      return;
    }

    try {

      isLoading.value = true;

      final response = await _api.post(
        "/auth/login",
        {
          "email": email,
          "password": password,
        },
      );

      _storage.write("token", response["access_token"]);
      _storage.write("user_id", response["user_id"]);
      _storage.write("full_name", response["full_name"]);
      _storage.write("role", response["role"]);

      Get.offAll(() => HomeScreen());

    } catch (e) {

      Get.snackbar(
        "Login Failed",
        e.toString(),
        snackPosition: SnackPosition.BOTTOM,
      );

    } finally {

      isLoading.value = false;

    }
  }

  /// REGISTER
  Future<void> register(
    String name,
    String email,
    String phoneNumber,
    String password,
  ) async {

    if (name.isEmpty ||
        email.isEmpty ||
        phoneNumber.isEmpty ||
        password.isEmpty) {

      Get.snackbar("Error", "Please fill all fields");
      return;
    }

    try {

      isLoading.value = true;

      await _api.post(
        "/auth/register",
        {
          "full_name": name,
          "email": email,
          "password": password,
          "phone_number": phoneNumber,
        },
      );

      await login(email, password);

    } catch (e) {

      Get.snackbar(
        "Registration Failed",
        e.toString(),
        snackPosition: SnackPosition.BOTTOM,
      );

    } finally {

      isLoading.value = false;

    }
  }

  /// LOGOUT
  void logout() {

    _storage.remove("token");
    _storage.remove("user_id");
    _storage.remove("full_name");
    _storage.remove("role");

    Get.offAllNamed("/login");
  }
}