import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:get_storage/get_storage.dart';

class ApiClient {

  /// 🔹 Backend Base URL
  /// Android Emulator → 10.0.2.2
  /// Web / Windows → 127.0.0.1
  static const String baseUrl = "http://127.0.0.1:8000";

  final GetStorage _storage = GetStorage();

  /// 🔑 Get stored JWT token
  String? get token => _storage.read('token');

  /// 🔹 Common headers
  Map<String, String> get _headers {
    final headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    if (token != null) {
      headers["Authorization"] = "Bearer $token";
    }

    return headers;
  }

  /// ================= GET =================
  Future<dynamic> get(String endpoint) async {
    final url = Uri.parse("$baseUrl$endpoint");

    final response = await http.get(url, headers: _headers);

    return _handleResponse(response);
  }

  /// ================= POST =================
  Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse("$baseUrl$endpoint");

    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode(body),
    );

    return _handleResponse(response);
  }

  /// ================= PUT =================
  Future<dynamic> put(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse("$baseUrl$endpoint");

    final response = await http.put(
      url,
      headers: _headers,
      body: jsonEncode(body),
    );

    return _handleResponse(response);
  }

  /// ================= DELETE =================
  Future<dynamic> delete(String endpoint) async {
    final url = Uri.parse("$baseUrl$endpoint");

    final response = await http.delete(url, headers: _headers);

    return _handleResponse(response);
  }

  /// ================= RESPONSE HANDLER =================
  dynamic _handleResponse(http.Response response) {

    try {
      final data = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return data;
      } else {
        throw Exception(data["detail"] ?? data["message"] ?? "API Error");
      }

    } catch (_) {
      throw Exception("Server Error (${response.statusCode})");
    }
  }
}