import 'package:flutter/material.dart';
import 'src/screens/login_screen.dart';

void main() {
  runApp(const UserApp());
}

class UserApp extends StatelessWidget {
  const UserApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Facility Management - User App',
      debugShowCheckedModeBanner: false,
      home: const LoginScreen(),
    );
  }
}
