import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../core/config/api_config.dart';
import '../models/notification_models.dart';
import 'auth_service.dart';
import 'storage_service.dart';

class NotificationService {
  final http.Client _client;
  final StorageService _storageService;

  NotificationService({
    http.Client? client,
    StorageService? storageService,
  })  : _client = client ?? http.Client(),
        _storageService = storageService ?? StorageService();

  Future<List<AppNotification>> getNotifications() async {
    final token = await _requireToken();

    try {
      final response = await _client
          .get(
            Uri.parse('${ApiConfig.baseUrl}/notifications/'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode != 200) {
        throw AuthException(_extractMessage(response.body));
      }

      final json = jsonDecode(response.body) as List<dynamic>;
      return json
          .map((item) => AppNotification.fromJson(item as Map<String, dynamic>))
          .toList();
    } on TimeoutException {
      throw const AuthException('Notifications request timed out. Please try again.');
    } on SocketException {
      throw AuthException(
        'Could not reach ${ApiConfig.baseUrl}. Check the backend URL and make sure FastAPI is running.',
      );
    }
  }

  Future<void> markAllRead() async {
    final token = await _requireToken();
    await _client
        .patch(
          Uri.parse('${ApiConfig.baseUrl}/notifications/read-all'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
        )
        .timeout(const Duration(seconds: 10));
  }

  Future<String> _requireToken() async {
    final token = await _storageService.getToken();
    if (token == null || token.isEmpty) {
      throw const AuthException('Session expired. Please sign in again.');
    }
    return token;
  }

  String _extractMessage(String body) {
    try {
      final json = jsonDecode(body) as Map<String, dynamic>;
      final detail = json['detail'];
      if (detail is String && detail.isNotEmpty) {
        return detail;
      }
    } catch (_) {
      // Fall back below.
    }
    return 'Unable to load notifications.';
  }
}
