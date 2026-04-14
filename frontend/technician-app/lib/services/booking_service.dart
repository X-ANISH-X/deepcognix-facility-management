import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../core/config/api_config.dart';
import '../models/booking_models.dart';
import 'auth_service.dart';
import 'storage_service.dart';

class BookingService {
  final http.Client _client;
  final StorageService _storageService;

  BookingService({
    http.Client? client,
    StorageService? storageService,
  })  : _client = client ?? http.Client(),
        _storageService = storageService ?? StorageService();

  Future<List<BookingSummary>> getMyBookings() async {
    final token = await _storageService.getToken();
    if (token == null || token.isEmpty) {
      throw const AuthException('Session expired. Please sign in again.');
    }

    http.Response response;
    try {
      response = await _client
          .get(
            Uri.parse('${ApiConfig.baseUrl}/bookings/'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 10));
    } on TimeoutException {
      throw const AuthException('Bookings request timed out. Please try again.');
    } on SocketException {
      throw AuthException(
        'Could not reach ${ApiConfig.baseUrl}. Check the backend URL and make sure FastAPI is running.',
      );
    }

    if (response.statusCode != 200) {
      throw AuthException(_extractMessage(response.body, fallback: 'Unable to load bookings'));
    }

    final json = jsonDecode(response.body) as List<dynamic>;
    return json
        .map((item) => BookingSummary.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<BookingSummary> getBookingDetails(int bookingId) async {
    final token = await _requireToken();
    final response = await _authorizedGet('/bookings/$bookingId', token);
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return BookingSummary.fromJson(json);
  }

  Future<List<BookingTask>> getBookingTasks(int bookingId) async {
    final token = await _requireToken();
    final response = await _authorizedGet('/bookings/$bookingId/tasks', token);
    final json = jsonDecode(response.body) as List<dynamic>;
    return json
        .map((item) => BookingTask.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> startJob(int bookingId) async {
    final token = await _requireToken();
    await _authorizedPost('/bookings/$bookingId/start', token);
  }

  Future<void> rejectJob({
    required int bookingId,
    required String reason,
  }) async {
    final token = await _requireToken();
    await _authorizedPost(
      '/bookings/$bookingId/reject',
      token,
      body: {'reason': reason},
    );
  }

  Future<void> updateTask({
    required int bookingId,
    required int taskId,
    required bool isCompleted,
  }) async {
    final token = await _requireToken();
    await _authorizedPatch(
      '/bookings/$bookingId/tasks/$taskId',
      token,
      {'is_completed': isCompleted},
    );
  }

  Future<void> completeJob(int bookingId) async {
    final token = await _requireToken();
    await _authorizedPost('/bookings/$bookingId/complete', token);
  }

  Future<String> _requireToken() async {
    final token = await _storageService.getToken();
    if (token == null || token.isEmpty) {
      throw const AuthException('Session expired. Please sign in again.');
    }
    return token;
  }

  Future<http.Response> _authorizedGet(String path, String token) async {
    try {
      final response = await _client
          .get(
            Uri.parse('${ApiConfig.baseUrl}$path'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 10));
      if (response.statusCode >= 400) {
        throw AuthException(_extractMessage(response.body, fallback: 'Request failed'));
      }
      return response;
    } on TimeoutException {
      throw const AuthException('Request timed out. Please try again.');
    } on SocketException {
      throw AuthException(
        'Could not reach ${ApiConfig.baseUrl}. Check the backend URL and make sure FastAPI is running.',
      );
    }
  }

  Future<http.Response> _authorizedPost(
    String path,
    String token, {
    Map<String, dynamic>? body,
  }) async {
    try {
      final response = await _client
          .post(
            Uri.parse('${ApiConfig.baseUrl}$path'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: body == null ? null : jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));
      if (response.statusCode >= 400) {
        throw AuthException(_extractMessage(response.body, fallback: 'Request failed'));
      }
      return response;
    } on TimeoutException {
      throw const AuthException('Request timed out. Please try again.');
    } on SocketException {
      throw AuthException(
        'Could not reach ${ApiConfig.baseUrl}. Check the backend URL and make sure FastAPI is running.',
      );
    }
  }

  Future<http.Response> _authorizedPatch(String path, String token, Map<String, dynamic> body) async {
    try {
      final response = await _client
          .patch(
            Uri.parse('${ApiConfig.baseUrl}$path'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));
      if (response.statusCode >= 400) {
        throw AuthException(_extractMessage(response.body, fallback: 'Request failed'));
      }
      return response;
    } on TimeoutException {
      throw const AuthException('Request timed out. Please try again.');
    } on SocketException {
      throw AuthException(
        'Could not reach ${ApiConfig.baseUrl}. Check the backend URL and make sure FastAPI is running.',
      );
    }
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
