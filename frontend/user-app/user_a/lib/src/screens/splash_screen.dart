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

        child: const Center(
          child: Column(
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
    );
  }
}