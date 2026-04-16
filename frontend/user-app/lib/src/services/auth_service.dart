import 'dart:convert';
import 'package:get_storage/get_storage.dart';

class AuthService {
  final GetStorage _storage = GetStorage();

  // ------------------------------------------------------------------ //
  //  STORAGE KEYS  (single source of truth — no more magic strings)
  // ------------------------------------------------------------------ //
  static const _kToken    = "token";
  static const _kUserId   = "user_id";
  static const _kName     = "full_name";
  static const _kEmail    = "email";
  static const _kPhone    = "phone";
  static const _kRole     = "role";
  static const _kRemember = "remember_me";

  // ================================================================== //
  //  SAVE AUTH  (call this right after a successful login / register)
  // ================================================================== //
  void saveAuth({
    required String token,
    required int    userId,
    required String name,
    required String role,
    String? email,
    String? phone,
    bool rememberMe = true,
  }) {
    _storage.write(_kToken,  token);
    _storage.write(_kUserId, userId);
    _storage.write(_kName,   name);
    _storage.write(_kRole,   role);
    _storage.write(_kRemember, rememberMe);
    if (email != null) _storage.write(_kEmail, email);
    if (phone != null) _storage.write(_kPhone, phone);
  }

  // ================================================================== //
  //  LOGOUT  — erase everything at once so nothing is ever left behind
  // ================================================================== //
  void logout() => _storage.erase();

  // ================================================================== //
  //  LOGIN STATE
  // ================================================================== //
  bool get isLoggedIn {
    final t = token;
    if (t == null || t.isEmpty) return false;
    // Also treat an expired token as "not logged in"
    return !isTokenExpired;
  }

  bool get shouldRestoreSession => _storage.read<bool>(_kRemember) ?? true;

  // ================================================================== //
  //  GETTERS
  // ================================================================== //
  String? get token   => _storage.read<String>(_kToken);
  int?    get userId  => _storage.read<int>(_kUserId);
  String? get fullName => _storage.read<String>(_kName);
  String? get email   => _storage.read<String>(_kEmail);
  String? get phone   => _storage.read<String>(_kPhone);
  String? get role    => _storage.read<String>(_kRole);

  // ================================================================== //
  //  JWT EXPIRY CHECK
  //  Decodes the payload (middle segment) of the JWT without a library.
  //  Returns true if the token is expired or unreadable.
  // ================================================================== //
  bool get isTokenExpired {
    try {
      final t = token;
      if (t == null || t.isEmpty) return true;

      final parts = t.split('.');
      if (parts.length != 3) return true;

      // Base64Url → Base64 (pad to multiple of 4)
      String payload = parts[1];
      payload += '=' * ((4 - payload.length % 4) % 4);
      final decoded = utf8.decode(base64Url.decode(payload));
      final map = jsonDecode(decoded) as Map<String, dynamic>;

      final exp = map['exp'];
      if (exp == null) return false; // no expiry claim → treat as valid

      final expiry = DateTime.fromMillisecondsSinceEpoch(
        (exp as int) * 1000,
        isUtc: true,
      );
      return DateTime.now().toUtc().isAfter(expiry);
    } catch (_) {
      return true; // if we can't decode it, treat as expired
    }
  }

  // ================================================================== //
  //  UPDATE PROFILE  (used by UserController when user edits profile)
  // ================================================================== //
  void updateProfile({String? name, String? email, String? phone}) {
    if (name  != null) _storage.write(_kName,  name);
    if (email != null) _storage.write(_kEmail, email);
    if (phone != null) _storage.write(_kPhone, phone);
  }
}
