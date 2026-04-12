import 'dart:async';

import '../models/location_models.dart';
import 'location_service.dart';

class LocationTrackingService {
  final LocationService _locationService;
  Timer? _timer;
  bool _isSending = false;

  LocationTrackingService({LocationService? locationService})
      : _locationService = locationService ?? LocationService();

  Future<LiveLocationSnapshot> sendSingleUpdate(int bookingId) async {
    final snapshot = await _locationService.getCurrentLocation();
    await _locationService.postLocation(
      LiveLocationPayload(
        bookingId: bookingId,
        latitude: snapshot.latitude,
        longitude: snapshot.longitude,
        accuracy: snapshot.accuracy,
      ),
    );
    return snapshot;
  }

  Future<void> start({
    required int bookingId,
    required void Function(LiveLocationSnapshot snapshot) onSent,
    required void Function(String message) onError,
    Duration interval = const Duration(seconds: 30),
  }) async {
    stop();

    try {
      final initialSnapshot = await sendSingleUpdate(bookingId);
      onSent(initialSnapshot);
    } catch (error) {
      onError(error.toString());
      return;
    }

    _timer = Timer.periodic(interval, (_) async {
      if (_isSending) {
        return;
      }

      _isSending = true;
      try {
        final snapshot = await sendSingleUpdate(bookingId);
        onSent(snapshot);
      } catch (error) {
        onError(error.toString());
      } finally {
        _isSending = false;
      }
    });
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _isSending = false;
  }

  bool get isTracking => _timer != null;
}
