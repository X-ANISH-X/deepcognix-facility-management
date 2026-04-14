import 'package:flutter/material.dart';
import 'dashboard/jobs_screen_live.dart';
import 'notifications/notifications_screen_live.dart';
import 'profile/profile_screen_live.dart';

class MainShell extends StatefulWidget {
  final VoidCallback toggleTheme;
  final VoidCallback toggleLanguage;

  const MainShell({
    super.key,
    required this.toggleTheme,
    required this.toggleLanguage,
  });

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  late final List<Widget> _screens = [
    const JobsScreen(),
    const NotificationsScreen(),
    ProfileScreen(
      toggleTheme: widget.toggleTheme,
      toggleLanguage: widget.toggleLanguage,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.work_outline),
            label: 'Jobs',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications_none),
            label: 'Notifications',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
