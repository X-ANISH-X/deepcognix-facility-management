import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../core/config/api_config.dart';
import '../models/auth_models.dart';

class AuthException implements Exception {
  final String message;

  const AuthException(this.message);

  @override
  String toString() => message;
}


class AuthService {
  final http.Client _client;

  AuthService({http.Client? client}) : _client = client ?? http.Client();

  Future<LoginResponse> login({
    required String email,
    required String password,
  }) async {
    http.Response response;
    try {
      response = await _client
          .post(
            Uri.parse('${ApiConfig.baseUrl}/auth/login'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'email': email.trim(),
              'password': password,
            }),
          )
          .timeout(const Duration(seconds: 10));
    } on TimeoutException {
      throw const AuthException('Login timed out. Check that the backend is running and reachable.');
    } on SocketException {
      throw AuthException(
        'Could not reach ${ApiConfig.baseUrl}. Check the backend URL and make sure FastAPI is running.',
      );
    }

    if (response.statusCode != 200) {
      throw AuthException(_extractMessage(response.body, fallback: 'Login failed'));
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return LoginResponse.fromJson(json);
  }

  Future<TechnicianProfile> getCurrentUser(String token) async {
    http.Response response;
    try {
      response = await _client
          .get(
            Uri.parse('${ApiConfig.baseUrl}/auth/me'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 10));
    } on TimeoutException {
      throw const AuthException('Profile request timed out. Please try again.');
    } on SocketException {
      throw AuthException(
        'Could not reach ${ApiConfig.baseUrl}. Check the backend URL and make sure FastAPI is running.',
      );
    }

    if (response.statusCode != 200) {
      throw AuthException(_extractMessage(response.body, fallback: 'Unable to fetch profile'));
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return TechnicianProfile.fromJson(json);
  }

  String _extractMessage(String body, {required String fallback}) {
    try {
      final json = jsonDecode(body) as Map<String, dynamic>;
      final detail = json['detail'];
      if (detail is String && detail.isNotEmpty) {
        return detail;
      }
    } catch (_) {
      // Ignore JSON parsing failures and use fallback.
    }
    return fallback;
  }
}
