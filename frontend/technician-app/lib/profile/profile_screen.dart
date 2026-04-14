import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  final VoidCallback toggleTheme;
  final VoidCallback toggleLanguage;

  const ProfileScreen({
    super.key,
    required this.toggleTheme,
    required this.toggleLanguage,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
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
          children: [
            const CircleAvatar(
              radius: 40,
              child: Icon(Icons.person, size: 40),
            ),
            const SizedBox(height: 12),
            const Text(
              'Ramesh Kumar',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Cleaning Technician',
              style: TextStyle(color: Colors.grey),
            ),

            const SizedBox(height: 24),

            _infoTile(Icons.phone, '+91 98765 43210'),
            _infoTile(Icons.email, 'ramesh.kumar@cleanpro.in'),
            _infoTile(Icons.location_on, 'Bengaluru, Karnataka'),

            const Spacer(),

            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton(
                onPressed: () {
                  Navigator.pop(context); // demo logout
                },
                child: const Text('Log Out'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoTile(IconData icon, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 12),
          Text(value),
        ],
      ),
    );
  }
}
