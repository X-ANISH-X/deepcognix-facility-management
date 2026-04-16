import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:user_a/src/services/auth_service.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {

  final AuthService authService = Get.find<AuthService>();
  @override
  void initState() {
    super.initState();
    _navigateUser();
  }

  void _navigateUser() async {

    /// splash delay (UI only)
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    if (!authService.shouldRestoreSession) {
      authService.logout();
      Get.offAllNamed('/login');
      return;
    }

    final bool isLoggedIn = authService.isLoggedIn;

    if (isLoggedIn) {
      Get.offAllNamed('/home');
    } else {
      Get.offAllNamed('/login');
    }
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
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.88, end: 1),
            duration: const Duration(milliseconds: 900),
            curve: Curves.easeOutBack,
            builder: (context, scale, child) {
              return Opacity(
                opacity: scale.clamp(0.0, 1.0).toDouble(),
                child: Transform.scale(scale: scale, child: child),
              );
            },
            child: const Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [

                Icon(
                  Icons.cleaning_services,
                  size: 80,
                  color: Colors.white,
                ),

                SizedBox(height: 20),

                Text(
                  "CARTEL STAR BUILDING",
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
                  "CLEANING SERVICES LLC",
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
    );
  }
}
