class LoginResponse {
  final String accessToken;
  final String tokenType;
  final int userId;
  final String role;
  final String fullName;

  const LoginResponse({
    required this.accessToken,
    required this.tokenType,
    required this.userId,
    required this.role,
    required this.fullName,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['access_token'] as String,
      tokenType: json['token_type'] as String,
      userId: json['user_id'] as int,
      role: json['role'] as String,
      fullName: json['full_name'] as String,
    );
  }
}


class TechnicianProfile {
  final int id;
  final String fullName;
  final String email;
  final String? phoneNumber;
  final String role;
  final bool isActive;

  const TechnicianProfile({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phoneNumber,
    required this.role,
    required this.isActive,
  });

  factory TechnicianProfile.fromJson(Map<String, dynamic> json) {
    return TechnicianProfile(
      id: json['id'] as int,
      fullName: json['full_name'] as String,
      email: json['email'] as String,
      phoneNumber: json['phone_number'] as String?,
      role: json['role'] as String,
      isActive: json['is_active'] as bool,
    );
  }
}
