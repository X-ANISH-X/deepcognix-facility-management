import 'dart:async';

import 'package:flutter/material.dart';

import '../models/notification_models.dart';
import '../services/auth_service.dart';
import '../services/notification_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final NotificationService _notificationService = NotificationService();
  Timer? _refreshTimer;
  bool _isLoading = true;
  String? _errorMessage;
  List<AppNotification> _notifications = [];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _refreshTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      _loadNotifications(showLoader: false);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadNotifications({bool showLoader = true}) async {
    if (showLoader) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      final notifications = await _notificationService.getNotifications();
      if (!mounted) {
        return;
      }
      setState(() {
        _notifications = notifications;
        _errorMessage = null;
      });
    } on AuthException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = error.message;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = 'Unable to load notifications.';
      });
    } finally {
      if (mounted && showLoader) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _markAllRead() async {
    await _notificationService.markAllRead();
    await _loadNotifications(showLoader: false);
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'job_assigned':
        return Icons.assignment;
      case 'job_started':
        return Icons.play_circle_outline;
      case 'completion_requested':
        return Icons.hourglass_bottom;
      case 'job_completed':
        return Icons.verified;
      case 'job_rejection_requested':
        return Icons.manage_history;
      case 'job_rejected':
        return Icons.report_problem_outlined;
      case 'booking_submitted':
        return Icons.pending_actions;
      default:
        return Icons.notifications_none;
    }
  }

  String _timeAgo(DateTime? timestamp) {
    if (timestamp == null) {
      return '';
    }

    final diff = DateTime.now().difference(timestamp.toLocal());
    if (diff.inSeconds < 60) {
      return 'Just now';
    }
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    }
    if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    }
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((item) => !item.isRead).length;

    return Scaffold(
      appBar: AppBar(
        title: Text(unreadCount > 0 ? 'Notifications ($unreadCount)' : 'Notifications'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: () => _loadNotifications(),
            icon: const Icon(Icons.refresh),
          ),
          IconButton(
            tooltip: 'Mark all read',
            onPressed: _notifications.isEmpty ? null : _markAllRead,
            icon: const Icon(Icons.done_all),
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_errorMessage!, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => _loadNotifications(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_notifications.isEmpty) {
      return RefreshIndicator(
        onRefresh: () => _loadNotifications(showLoader: false),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 140),
            Center(child: Text('No notifications yet')),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadNotifications(showLoader: false),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _notifications.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final notification = _notifications[index];
          final color = notification.isRead
              ? Theme.of(context).colorScheme.outline
              : Theme.of(context).colorScheme.primary;

          return Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: color.withOpacity(0.12),
                child: Icon(
                  _iconForType(notification.type),
                  color: color,
                ),
              ),
              title: Text(
                notification.title,
                style: TextStyle(
                  fontWeight: notification.isRead ? FontWeight.w500 : FontWeight.w700,
                ),
              ),
              subtitle: Text(notification.message),
              trailing: Text(
                _timeAgo(notification.createdAt),
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
