import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const String _tokenKey = 'auth_token';
  static const String _roleKey = 'user_role';
  static const String _userIdKey = 'user_id';
  static const String _fullNameKey = 'full_name';
  static const String _stayLoggedInKey = 'stay_logged_in';

  Future<void> saveSession({
    required String token,
    required String role,
    required int userId,
    required String fullName,
    required bool stayLoggedIn,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_roleKey, role);
    await prefs.setInt(_userIdKey, userId);
    await prefs.setString(_fullNameKey, fullName);
    await prefs.setBool(_stayLoggedInKey, stayLoggedIn);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<bool> shouldRestoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_stayLoggedInKey) ?? true;
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_roleKey);
    await prefs.remove(_userIdKey);
    await prefs.remove(_fullNameKey);
    await prefs.remove(_stayLoggedInKey);
  }
}
