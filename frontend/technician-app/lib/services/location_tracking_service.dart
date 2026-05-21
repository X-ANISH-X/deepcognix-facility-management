import 'dart:async';

import '../models/location_models.dart';
import 'location_service.dart';

class LocationTrackingService {
  final LocationService _locationService;
  Timer? _timer;
  bool _isSending = false;
  int? _activeBookingId;
  Duration? _activeInterval;

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
    if (_timer != null &&
        _activeBookingId == bookingId &&
        _activeInterval == interval) {
      return;
    }

    stop();
    _activeBookingId = bookingId;
    _activeInterval = interval;

    try {
      final initialSnapshot = await sendSingleUpdate(bookingId);
      onSent(initialSnapshot);
    } catch (error) {
      _activeBookingId = null;
      _activeInterval = null;
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
    _activeBookingId = null;
    _activeInterval = null;
  }

  bool get isTracking => _timer != null;
  Duration? get currentInterval => _activeInterval;
}
