import 'package:get_storage/get_storage.dart';
import 'api_client.dart';

class AuthService {
  final ApiClient _api = ApiClient();
  final GetStorage _storage = GetStorage();

  Future<void> login(String email, String password) async {
    final response = await _api.post("/auth/login", {
      "email": email,
      "password": password,
    });

    // backend returns { "access_token": "...", "role": "...", ... }
    _storage.write("token", response["access_token"]);
    _storage.write("user_role", response["role"]);
    _storage.write("user_id", response["user_id"]);
    _storage.write("full_name", response["full_name"]);
  }

  void logout() {
    _storage.remove("token");
  }

  bool get isLoggedIn => _storage.read("token") != null;
}
