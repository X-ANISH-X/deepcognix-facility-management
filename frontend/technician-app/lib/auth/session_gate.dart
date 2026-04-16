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
    final splashStartedAt = DateTime.now();
    final shouldRestore = await _storageService.shouldRestoreSession();

    if (!shouldRestore) {
      await _storageService.clearSession();
      await _finishSplashDelay(splashStartedAt);

      if (!mounted) {
        return;
      }

      setState(() {
        _isCheckingSession = false;
        _isAuthenticated = false;
      });
      return;
    }

    final token = await _storageService.getToken();

    if (token == null || token.isEmpty) {
      await _finishSplashDelay(splashStartedAt);

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
      await _finishSplashDelay(splashStartedAt);

      if (!mounted) {
        return;
      }

      setState(() {
        _isAuthenticated = profile.role == 'technician' && profile.isActive;
        _isCheckingSession = false;
      });
    } catch (_) {
      await _storageService.clearSession();
      await _finishSplashDelay(splashStartedAt);

      if (!mounted) {
        return;
      }

      setState(() {
        _isAuthenticated = false;
        _isCheckingSession = false;
      });
    }
  }

  Future<void> _finishSplashDelay(DateTime startedAt) async {
    final elapsed = DateTime.now().difference(startedAt);
    const minimumSplashTime = Duration(seconds: 2);
    if (elapsed < minimumSplashTime) {
      await Future.delayed(minimumSplashTime - elapsed);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isCheckingSession) {
      return const _TechnicianSplash();
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

class _TechnicianSplash extends StatefulWidget {
  const _TechnicianSplash();

  @override
  State<_TechnicianSplash> createState() => _TechnicianSplashState();
}

class _TechnicianSplashState extends State<_TechnicianSplash>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeAnimation;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..forward();
    _fadeAnimation = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    _scaleAnimation = Tween<double>(begin: 0.88, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF00897B),
              Color(0xFF26A69A),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: ScaleTransition(
              scale: _scaleAnimation,
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.cleaning_services,
                    size: 80,
                    color: Colors.white,
                  ),
                  SizedBox(height: 20),
                  Text(
                    'CARTEL STAR BUILDING',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 2,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'TECHNICIAN SERVICES',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
