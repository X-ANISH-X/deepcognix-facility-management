import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

import '../core/config/api_config.dart';
import '../models/location_models.dart';
import 'auth_service.dart';
import 'storage_service.dart';

class LocationService {
  final http.Client _client;
  final StorageService _storageService;

  LocationService({
    http.Client? client,
    StorageService? storageService,
  })  : _client = client ?? http.Client(),
        _storageService = storageService ?? StorageService();

  Future<void> ensureTrackingPermission() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      throw const AuthException(
        'Location services are turned off. Please enable GPS to share live location.',
      );
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      throw const AuthException(
        'Location permission was denied. Please allow location access to continue.',
      );
    }

    if (permission == LocationPermission.deniedForever) {
      throw const AuthException(
        'Location permission is permanently denied. Enable it from app settings.',
      );
    }
  }

  Future<LiveLocationSnapshot> getCurrentLocation() async {
    await ensureTrackingPermission();

    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
      ),
    );

    return LiveLocationSnapshot(
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
    );
  }

  Future<void> postLocation(LiveLocationPayload payload) async {
    final token = await _storageService.getToken();
    if (token == null || token.isEmpty) {
      throw const AuthException('Session expired. Please sign in again.');
    }

    try {
      final response = await _client
          .post(
            Uri.parse('${ApiConfig.baseUrl}/location/'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: jsonEncode(payload.toJson()),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode >= 400) {
        throw AuthException(_extractMessage(response.body));
      }
    } on TimeoutException {
      throw const AuthException('Location update timed out. Please try again.');
    } on SocketException {
      throw AuthException(
        'Could not reach ${ApiConfig.baseUrl}. Check the backend URL and make sure FastAPI is running.',
      );
    }
  }

  String _extractMessage(String body) {
    try {
      final json = jsonDecode(body) as Map<String, dynamic>;
      final detail = json['detail'];
      if (detail is String && detail.isNotEmpty) {
        return detail;
      }
    } catch (_) {
      // Ignore parsing issues and fall back.
    }

    return 'Unable to send live location right now.';
  }
}
