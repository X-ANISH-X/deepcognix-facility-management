
import 'dart:convert';
import 'package:get_storage/get_storage.dart';

class AuthService {

  final GetStorage _storage =
      GetStorage();

  // =========================================================
  // STORAGE KEYS
  // =========================================================
  static const _kToken =
      "token";

  static const _kUserId =
      "user_id";

  static const _kName =
      "full_name";

  static const _kEmail =
      "email";

  static const _kPhone =
      "phone";

  static const _kRole =
      "role";

  static const _kRemember =
      "remember_me";

  // =========================================================
  // SAVE AUTH
  // =========================================================
  Future<void> saveAuth({
    required String token,
    required int userId,
    required String name,
    required String role,
    String? email,
    String? phone,
    bool rememberMe = true,
  }) async {

    await _storage.write(
      _kToken,
      token,
    );

    await _storage.write(
      _kUserId,
      userId,
    );

    await _storage.write(
      _kName,
      name,
    );

    await _storage.write(
      _kRole,
      role,
    );

    await _storage.write(
      _kRemember,
      rememberMe,
    );

    if (email != null) {

      await _storage.write(
        _kEmail,
        email,
      );
    }

    if (phone != null) {

      await _storage.write(
        _kPhone,
        phone,
      );
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================
  Future<void> logout() async {

    await _storage.remove(
      _kToken,
    );

    await _storage.remove(
      _kUserId,
    );

    await _storage.remove(
      _kName,
    );

    await _storage.remove(
      _kEmail,
    );

    await _storage.remove(
      _kPhone,
    );

    await _storage.remove(
      _kRole,
    );
  }

  // =========================================================
  // LOGIN STATE
  // =========================================================
  bool get isLoggedIn {

    final t = token;

    if (t == null ||
        t.trim().isEmpty) {

      return false;
    }

    if (isTokenExpired) {

      return false;
    }

    return true;
  }

  bool get shouldRestoreSession {

    return _storage.read<bool>(
          _kRemember,
        ) ??
        true;
  }

  // =========================================================
  // GETTERS
  // =========================================================
  String? get token =>
      _safeRead<String>(
        _kToken,
      );

  int? get userId =>
      _safeRead<int>(
        _kUserId,
      );

  String? get fullName =>
      _safeRead<String>(
        _kName,
      );

  String? get email =>
      _safeRead<String>(
        _kEmail,
      );

  String? get phone =>
      _safeRead<String>(
        _kPhone,
      );

  String? get role =>
      _safeRead<String>(
        _kRole,
      );

  // =========================================================
  // SAFE STORAGE READ
  // =========================================================
  T? _safeRead<T>(
    String key,
  ) {

    try {

      return _storage.read<T>(
        key,
      );

    } catch (_) {

      return null;
    }
  }

  // =========================================================
  // TOKEN EXPIRY CHECK
  // =========================================================
  bool get isTokenExpired {

    try {

      final t = token;

      if (t == null ||
          t.trim().isEmpty) {

        return true;
      }

      final parts =
          t.split('.');

      if (parts.length != 3) {

        return false;
      }

      String payload =
          parts[1];

      payload += '=' *
          ((4 -
                      payload.length %
                          4) %
                  4);

      final decoded =
          utf8.decode(
        base64Url.decode(
          payload,
        ),
      );

      final map =
          jsonDecode(decoded)
              as Map<String,
                  dynamic>;

      final exp =
          map['exp'];

      if (exp == null) {

        return false;
      }

      final expiry =
          DateTime
              .fromMillisecondsSinceEpoch(
        (exp as int) * 1000,
        isUtc: true,
      );

      return DateTime.now()
          .toUtc()
          .isAfter(expiry);

    } catch (_) {

      return false;
    }
  }

  // =========================================================
  // UPDATE PROFILE
  // =========================================================
  Future<void> updateProfile({
    String? name,
    String? email,
    String? phone,
  }) async {

    if (name != null) {

      await _storage.write(
        _kName,
        name,
      );
    }

    if (email != null) {

      await _storage.write(
        _kEmail,
        email,
      );
    }

    if (phone != null) {

      await _storage.write(
        _kPhone,
        phone,
      );
    }
  }
}

