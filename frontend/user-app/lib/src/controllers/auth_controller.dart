import 'package:get/get.dart';
import 'package:user_a/src/services/api_client.dart';
import 'package:user_a/src/services/auth_service.dart';

class AuthController extends GetxController {
  final ApiClient   _api  = ApiClient();
  final AuthService _auth = AuthService();

  final RxBool isLoading = false.obs;

  // ================================================================== //
  //  LOGIN
  // ================================================================== //
  Future<void> login(String email, String password, {bool rememberMe = true}) async {
    if (email.trim().isEmpty || password.isEmpty) {
      _snack("Error", "Please enter your email and password.");
      return;
    }

    try {
      isLoading.value = true;

      final response = await _api.post(
        "/auth/login",
        {
          "email":    email.trim(),
          "password": password,
        },
      );

      // ── Persist everything through AuthService (single source of truth)
      _auth.saveAuth(
        token:  response["access_token"],
        userId: response["user_id"],
        name:   response["full_name"] ?? "",
        role:   response["role"]      ?? "user",
        email:  email.trim(),
        phone:  response["phone_number"], // may be null — saveAuth handles it
        rememberMe: rememberMe,
      );

      Get.offAllNamed('/home');

    } catch (e) {
      _snack("Login Failed", _message(e), bottom: true);
    } finally {
      isLoading.value = false;
    }
  }

  // ================================================================== //
  //  REGISTER
  // ================================================================== //
  Future<void> register(
    String name,
    String email,
    String phone,
    String password,
  ) async {
    if (name.trim().isEmpty ||
        email.trim().isEmpty ||
        phone.trim().isEmpty ||
        password.isEmpty) {
      _snack("Error", "Please fill in all fields.");
      return;
    }

    try {
      isLoading.value = true;

      await _api.post(
        "/auth/register",
        {
          "full_name":    name.trim(),
          "email":        email.trim(),
          "password":     password,
          "phone_number": phone.trim(),
        },
      );

      _snack("Success", "Account created. Please log in.");
      Get.offAllNamed('/login');

    } catch (e) {
      _snack("Registration Failed", _message(e), bottom: true);
    } finally {
      isLoading.value = false;
    }
  }

  // ================================================================== //
  //  LOGOUT
  // ================================================================== //
  void logout() {
    _auth.logout(); // calls _storage.erase() internally
    Get.offAllNamed('/login');
  }

  // ================================================================== //
  //  HELPERS
  // ================================================================== //

  /// Strips the "Exception: " / "ApiException(4xx): " prefix that Dart adds
  /// before showing the message in a snackbar.
  String _message(Object e) {
    if (e is ApiException) return e.message;
    final raw = e.toString();
    if (raw.startsWith("Exception: ")) return raw.replaceFirst("Exception: ", "");
    return raw;
  }

  void _snack(
    String title,
    String message, {
    bool bottom = false,
  }) {
    Get.snackbar(
      title,
      message,
      snackPosition: bottom ? SnackPosition.BOTTOM : SnackPosition.TOP,
      duration: const Duration(seconds: 3),
    );
  }
}
