import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:get_storage/get_storage.dart';
import 'package:get/get.dart';

class ApiClient {
  static const int _port = 8000;
  static const Duration _timeout = Duration(seconds: 15);

  static String get baseUrl {
    // kIsWeb is safe on all platforms (including web)
    if (!kIsWeb) {
      // On native Android emulator the host machine is 10.0.2.2
      // For real device / iOS / desktop use 127.0.0.1
      // We use 127.0.0.1 since we target Chrome for dev
    }
    return "http://127.0.0.1:$_port";
  }

  final GetStorage _storage = GetStorage();

  String? get token => _storage.read<String>('token');

  Map<String, String> get _headers {
    final headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    if (token != null && token!.isNotEmpty) {
      headers["Authorization"] = "Bearer $token";
    }

    return headers;
  }

  // ================================================================== //
  // GET
  // ================================================================== //
  Future<dynamic> get(String endpoint) async {
    final url = Uri.parse("$baseUrl$endpoint");
    final response =
        await http.get(url, headers: _headers).timeout(_timeout);

    return _handleResponse(response);
  }

  // ================================================================== //
  // POST (🔥 FIXED REDIRECT ISSUE)
  // ================================================================== //
  Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse("$baseUrl$endpoint");

    final response = await http
        .post(url, headers: _headers, body: jsonEncode(body))
        .timeout(_timeout);

    // 🔥 HANDLE 307 REDIRECT AUTOMATICALLY
    if (response.statusCode == 307 || response.statusCode == 308) {
      final redirectedUrl = response.headers['location'];

      if (redirectedUrl != null) {
        final redirectResponse = await http.post(
          Uri.parse(redirectedUrl),
          headers: _headers,
          body: jsonEncode(body),
        );

        return _handleResponse(redirectResponse);
      }
    }

    return _handleResponse(response);
  }

  // ================================================================== //
  // PUT
  // ================================================================== //
  Future<dynamic> put(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse("$baseUrl$endpoint");

    final response = await http
        .put(url, headers: _headers, body: jsonEncode(body))
        .timeout(_timeout);

    return _handleResponse(response);
  }

  // ================================================================== //
  // DELETE
  // ================================================================== //
  Future<dynamic> delete(String endpoint) async {
    final url = Uri.parse("$baseUrl$endpoint");

    final response =
        await http.delete(url, headers: _headers).timeout(_timeout);

    return _handleResponse(response);
  }

  // ================================================================== //
  // RESPONSE HANDLER
  // ================================================================== //
  dynamic _handleResponse(http.Response response) {

    if (response.statusCode == 401) {
      _storage.erase();
      Get.offAllNamed('/login');

      throw ApiException(
        statusCode: 401,
        message: "Session expired. Please log in again.",
      );
    }

    dynamic data;

    try {
      data = jsonDecode(response.body);
    } catch (_) {
      throw ApiException(
        statusCode: response.statusCode,
        message: "Unexpected server response (${response.statusCode}).",
      );
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    final message = _extractErrorMessage(data, response.statusCode);
    throw ApiException(statusCode: response.statusCode, message: message);
  }

  String _extractErrorMessage(dynamic data, int statusCode) {
    if (data is Map) {
      final detail = data["detail"];

      if (detail is String) return detail;

      if (detail is List && detail.isNotEmpty) {
        return detail
            .map((e) => e is Map ? (e["msg"] ?? e.toString()) : e.toString())
            .join(", ");
      }

      if (data["message"] is String) return data["message"];
    }

    return "API Error ($statusCode)";
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;

  const ApiException({required this.statusCode, required this.message});

  @override
  String toString() => "ApiException($statusCode): $message";
}