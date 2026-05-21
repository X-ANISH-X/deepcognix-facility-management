import 'package:flutter/material.dart';

import '../jobs/job_detail_screen_live.dart';
import '../models/booking_models.dart';
import '../models/job_ui_models.dart';
import '../services/auth_service.dart';
import '../services/booking_service.dart';

class JobsScreen extends StatelessWidget {
  const JobsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My Jobs'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Assigned'),
              Tab(text: 'Active'),
              Tab(text: 'Completed'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            JobsList(status: 'assigned'),
            JobsList(status: 'active'),
            JobsList(status: 'completed'),
          ],
        ),
      ),
    );
  }
}

class JobsList extends StatefulWidget {
  final String status;

  const JobsList({super.key, required this.status});

  @override
  State<JobsList> createState() => _JobsListState();
}

class _JobsListState extends State<JobsList> {
  final BookingService _bookingService = BookingService();
  late Future<List<BookingSummary>> _bookingsFuture;

  @override
  void initState() {
    super.initState();
    _bookingsFuture = _bookingService.getMyBookings();
  }

  Future<void> _refreshBookings() async {
    final future = _bookingService.getMyBookings();
    setState(() {
      _bookingsFuture = future;
    });
    await future;
  }

  String get _statusFilter {
    switch (widget.status) {
      case 'active':
        return 'active';
      default:
        return widget.status;
    }
  }

  bool _matchesStatus(BookingSummary booking) {
    if (_statusFilter == 'active') {
      return const {
        'on_the_way',
        'arrival_approval_pending',
        'in_progress',
        'customer_review_pending',
        'admin_review_pending',
      }.contains(booking.status);
    }

    return booking.status == _statusFilter;
  }

  String _chipLabel(String status) {
    switch (status) {
      case 'assigned':
        return 'Assigned';
      case 'on_the_way':
        return 'On The Way';
      case 'arrival_approval_pending':
        return 'Arrived';
      case 'in_progress':
        return 'In Progress';
      case 'customer_review_pending':
        return 'Awaiting Customer';
      case 'admin_review_pending':
        return 'Awaiting Admin';
      case 'completed':
        return 'Completed';
      case 'rejection_requested':
        return 'Pending Admin';
      default:
        return status;
    }
  }

  JobItem _toJobItem(BookingSummary booking) {
    return JobItem(
      id: booking.id,
      title: booking.title,
      location: booking.locationLine,
      time: booking.timeLine,
      status: booking.status,
      tasks: [],
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<BookingSummary>>(
      future: _bookingsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          final message = snapshot.error is AuthException
              ? (snapshot.error as AuthException).message
              : snapshot.error.toString();

          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(message, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _refreshBookings,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        }

        final bookings = (snapshot.data ?? [])
            .where(_matchesStatus)
            .toList();

        if (bookings.isEmpty) {
          return RefreshIndicator(
            onRefresh: _refreshBookings,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: const [
                SizedBox(height: 120),
                Center(child: Text('No jobs available')),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: _refreshBookings,
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: bookings.length,
            itemBuilder: (context, index) {
              final booking = bookings[index];
              final job = _toJobItem(booking);

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  title: Text(
                    booking.title,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text('${booking.locationLine}\n${booking.timeLine}'),
                  trailing: Chip(
                    label: Text(_chipLabel(booking.status)),
                  ),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => JobDetailScreen(job: job),
                      ),
                    );
                  },
                ),
              );
            },
          ),
        );
      },
    );
  }
}
