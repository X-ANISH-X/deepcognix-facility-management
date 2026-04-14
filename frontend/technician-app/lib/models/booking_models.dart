class BookingSummary {
  final int id;
  final int customerId;
  final int serviceId;
  final int packageId;
  final int? technicianId;
  final String status;
  final double? finalPrice;
  final String scheduledDate;
  final String scheduledTimeSlot;
  final String addressLine;
  final String? buildingName;
  final String? floorNumber;
  final String? apartmentNumber;
  final double? latitude;
  final double? longitude;
  final String? customerNotes;
  final String? technicianNotes;
  final String? packageName;
  final String? serviceName;
  final String? customerName;
  final String? technicianName;

  const BookingSummary({
    required this.id,
    required this.customerId,
    required this.serviceId,
    required this.packageId,
    required this.technicianId,
    required this.status,
    required this.finalPrice,
    required this.scheduledDate,
    required this.scheduledTimeSlot,
    required this.addressLine,
    required this.buildingName,
    required this.floorNumber,
    required this.apartmentNumber,
    required this.latitude,
    required this.longitude,
    required this.customerNotes,
    required this.technicianNotes,
    required this.packageName,
    required this.serviceName,
    required this.customerName,
    required this.technicianName,
  });

  factory BookingSummary.fromJson(Map<String, dynamic> json) {
    return BookingSummary(
      id: _asInt(json['id']) ?? 0,
      customerId: _asInt(json['customer_id']) ?? 0,
      serviceId: _asInt(json['service_id']) ?? 0,
      packageId: _asInt(json['package_id']) ?? 0,
      technicianId: _asInt(json['technician_id']),
      status: json['status'] as String,
      finalPrice: _asDouble(json['final_price']),
      scheduledDate: json['scheduled_date'] as String,
      scheduledTimeSlot: json['scheduled_time_slot'] as String,
      addressLine: json['address_line'] as String,
      buildingName: json['building_name'] as String?,
      floorNumber: json['floor_number'] as String?,
      apartmentNumber: json['apartment_number'] as String?,
      latitude: _asDouble(json['latitude']),
      longitude: _asDouble(json['longitude']),
      customerNotes: json['customer_notes'] as String?,
      technicianNotes: json['technician_notes'] as String?,
      packageName: json['package_name'] as String?,
      serviceName: json['service_name'] as String?,
      customerName: json['customer_name'] as String?,
      technicianName: json['technician_name'] as String?,
    );
  }

  String get title {
    final service = serviceName ?? 'Service';
    final package = packageName ?? 'Package';
    return '$service - $package';
  }

  String get locationLine {
    final parts = <String>[
      if (buildingName != null && buildingName!.isNotEmpty) buildingName!,
      if (apartmentNumber != null && apartmentNumber!.isNotEmpty) 'Apt $apartmentNumber',
      addressLine,
    ];
    return parts.join(', ');
  }

  String get timeLine => '$scheduledDate - ${_formatTimeSlot(scheduledTimeSlot)}';

  static String _formatTimeSlot(String timeSlot) {
    switch (timeSlot) {
      case 'morning':
        return 'Morning';
      case 'afternoon':
        return 'Afternoon';
      case 'evening':
        return 'Evening';
      default:
        return timeSlot;
    }
  }
}


class BookingTask {
  final int id;
  final int bookingId;
  final String taskName;
  final int? orderIndex;
  final bool isCompleted;

  const BookingTask({
    required this.id,
    required this.bookingId,
    required this.taskName,
    required this.orderIndex,
    required this.isCompleted,
  });

  factory BookingTask.fromJson(Map<String, dynamic> json) {
    return BookingTask(
      id: _asInt(json['id']) ?? 0,
      bookingId: _asInt(json['booking_id']) ?? 0,
      taskName: json['task_name'] as String,
      orderIndex: _asInt(json['order_index']),
      isCompleted: _asBool(json['is_completed']),
    );
  }
}

int? _asInt(dynamic value) {
  if (value == null) {
    return null;
  }
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  if (value is String) {
    return int.tryParse(value);
  }
  return null;
}

double? _asDouble(dynamic value) {
  if (value == null) {
    return null;
  }
  if (value is double) {
    return value;
  }
  if (value is num) {
    return value.toDouble();
  }
  if (value is String) {
    return double.tryParse(value);
  }
  return null;
}

bool _asBool(dynamic value) {
  if (value is bool) {
    return value;
  }
  if (value is num) {
    return value != 0;
  }
  if (value is String) {
    final normalized = value.trim().toLowerCase();
    return normalized == 'true' || normalized == '1';
  }
  return false;
}
