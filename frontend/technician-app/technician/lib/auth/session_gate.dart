import 'package:flutter/material.dart';

import '../main_shell.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import 'technician_login_screen.dart';

class SessionGate extends StatefulWidget {
  final VoidCallback toggleTheme;
  final VoidCallback toggleLanguage;

  const SessionGate({
    super.key,
    required this.toggleTheme,
    required this.toggleLanguage,
  });

  @override
  State<SessionGate> createState() => _SessionGateState();
}

class _SessionGateState extends State<SessionGate> {
  final _storageService = StorageService();
  final _authService = AuthService();
  bool _isCheckingSession = true;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final token = await _storageService.getToken();

    if (token == null || token.isEmpty) {
      if (!mounted) {
        return;
      }
      setState(() {
        _isCheckingSession = false;
        _isAuthenticated = false;
      });
      return;
    }

    try {
      final profile = await _authService.getCurrentUser(token);

      if (!mounted) {
        return;
      }

      setState(() {
        _isAuthenticated = profile.role == 'technician' && profile.isActive;
        _isCheckingSession = false;
      });
    } catch (_) {
      await _storageService.clearSession();

      if (!mounted) {
        return;
      }

      setState(() {
        _isAuthenticated = false;
        _isCheckingSession = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isCheckingSession) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_isAuthenticated) {
      return MainShell(
        toggleTheme: widget.toggleTheme,
        toggleLanguage: widget.toggleLanguage,
      );
    }

    return TechnicianLoginScreen(
      toggleTheme: widget.toggleTheme,
      toggleLanguage: widget.toggleLanguage,
    );
  }
}
