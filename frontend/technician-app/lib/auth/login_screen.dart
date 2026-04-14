import 'package:flutter/material.dart';
import '../dashboard/jobs_screen.dart';
import '../main_shell.dart';

class TechnicianLoginScreen extends StatelessWidget {
  final VoidCallback toggleTheme;
  final VoidCallback toggleLanguage;

  const TechnicianLoginScreen({
    super.key,
    required this.toggleTheme,
    required this.toggleLanguage,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actions: [
          IconButton(
            icon: const Icon(Icons.language),
            onPressed: toggleLanguage,
          ),
          IconButton(
            icon: const Icon(Icons.brightness_6),
            onPressed: toggleTheme,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cleaning_services, size: 60),
            const SizedBox(height: 12),
            const Text(
              'Technician Portal',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 32),

            TextField(decoration: const InputDecoration(labelText: 'Email')),
            const SizedBox(height: 16),
            TextField(
              decoration: const InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (_) => MainShell(
                        toggleTheme: toggleTheme,
                        toggleLanguage: toggleLanguage,
                      ),
                    ),
                  );
                },
                child: const Text('Sign In'),
              ),
            ),

            const SizedBox(height: 16),
            const Text(
              'Contact admin if you don’t have access',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
