import 'package:flutter/material.dart';

class NotificationItem {
  final String title;
  final String message;
  final String time;
  final IconData icon;

  NotificationItem({
    required this.title,
    required this.message,
    required this.time,
    required this.icon,
  });
}

final List<NotificationItem> demoNotifications = [
  NotificationItem(
    title: 'New Job Assigned',
    message: 'Office Cleaning assigned in Whitefield, Bengaluru',
    time: 'Just now',
    icon: Icons.assignment,
  ),
  NotificationItem(
    title: 'Task Completed',
    message: 'Client notified: Vacuuming completed',
    time: '10 mins ago',
    icon: Icons.check_circle,
  ),
  NotificationItem(
    title: 'Completion Requested',
    message: 'Waiting for client approval',
    time: '30 mins ago',
    icon: Icons.hourglass_bottom,
  ),
  NotificationItem(
    title: 'Job Completed',
    message: 'Office Cleaning – Indiranagar approved by client',
    time: 'Yesterday',
    icon: Icons.verified,
  ),
];
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: demoNotifications.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final notification = demoNotifications[index];

          return Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor:
                Theme.of(context).primaryColor.withOpacity(0.1),
                child: Icon(
                  notification.icon,
                  color: Theme.of(context).primaryColor,
                ),
              ),
              title: Text(
                notification.title,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(notification.message),
              trailing: Text(
                notification.time,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
