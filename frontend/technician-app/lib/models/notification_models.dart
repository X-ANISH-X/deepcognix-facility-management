class AppNotification {
  final int id;
  final String title;
  final String type;
  final String message;
  final bool isRead;
  final DateTime? createdAt;

  const AppNotification({
    required this.id,
    required this.title,
    required this.type,
    required this.message,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: _asInt(json['id']) ?? 0,
      title: (json['title'] as String?)?.trim().isNotEmpty == true
          ? json['title'] as String
          : _fallbackTitle(json['notification_type'] as String?),
      type: json['notification_type'] as String? ?? 'general',
      message: json['message'] as String? ?? '',
      isRead: _asBool(json['is_read']),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? ''),
    );
  }

  static String _fallbackTitle(String? type) {
    switch (type) {
      case 'job_assigned':
        return 'New Job Assigned';
      case 'job_started':
        return 'Job Accepted';
      case 'completion_requested':
        return 'Completion Requested';
      case 'job_completed':
        return 'Job Approved';
      case 'job_rejection_requested':
        return 'Rejection Requested';
      case 'job_rejected':
        return 'Job Rejected';
      default:
        return 'Notification';
    }
  }
}

int? _asInt(dynamic value) {
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
