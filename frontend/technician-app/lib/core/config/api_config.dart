import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  // Override when needed:
  // USB-connected phone with adb reverse -> --dart-define=API_BASE_URL=http://127.0.0.1:8000
  // Android emulator -> --dart-define=API_BASE_URL=http://10.0.2.2:8000
  // Physical phone on Wi-Fi -> --dart-define=API_BASE_URL=http://YOUR_LAPTOP_IP:8000
  static const String _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  static String get baseUrl {
    if (_configuredBaseUrl.isNotEmpty) {
      return _configuredBaseUrl.endsWith('/')
          ? _configuredBaseUrl.substring(0, _configuredBaseUrl.length - 1)
          : _configuredBaseUrl;
    }

    if (kIsWeb) {
      return 'http://127.0.0.1:8000';
    }

    return 'http://127.0.0.1:8000';
  }
}
