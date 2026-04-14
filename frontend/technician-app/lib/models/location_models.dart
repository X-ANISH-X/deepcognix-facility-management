class LiveLocationPayload {
  final int bookingId;
  final double latitude;
  final double longitude;
  final double? accuracy;

  const LiveLocationPayload({
    required this.bookingId,
    required this.latitude,
    required this.longitude,
    required this.accuracy,
  });

  Map<String, dynamic> toJson() {
    return {
      'booking_id': bookingId,
      'latitude': latitude,
      'longitude': longitude,
      'accuracy': accuracy,
    };
  }
}


class LiveLocationSnapshot {
  final double latitude;
  final double longitude;
  final double? accuracy;

  const LiveLocationSnapshot({
    required this.latitude,
    required this.longitude,
    required this.accuracy,
  });
}
