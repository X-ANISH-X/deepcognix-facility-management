import 'package:get_storage/get_storage.dart';
import 'api_client.dart';

class AuthService {
  final ApiClient _api = ApiClient();
  final GetStorage _storage = GetStorage();

  Future<void> login(String email, String password) async {
    final response = await _api.post("/login", {
      "email": email,
      "password": password,
    });

    // assuming backend returns { "access_token": "..." }
    _storage.write("token", response["access_token"]);
  }

  void logout() {
    _storage.remove("token");
  }

  bool get isLoggedIn => _storage.read("token") != null;
}
