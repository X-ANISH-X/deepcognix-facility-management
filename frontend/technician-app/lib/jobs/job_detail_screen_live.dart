import 'dart:async';

import 'package:flutter/material.dart';

import '../core/config/package_catalog.dart';
import '../models/booking_models.dart';
import '../models/job_ui_models.dart';
import '../models/location_models.dart';
import '../services/auth_service.dart';
import '../services/booking_service.dart';
import '../services/location_tracking_service.dart';

class JobDetailScreen extends StatefulWidget {
  final JobItem job;

  const JobDetailScreen({
    super.key,
    required this.job,
  });

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  final BookingService _bookingService = BookingService();
  final ScrollController _tasksScrollController = ScrollController();
  final LocationTrackingService _locationTrackingService = LocationTrackingService();
  late Timer _timer;
  Duration elapsed = Duration.zero;
  bool _isLoading = true;
  bool _isSubmitting = false;
  bool _isTrackingLocation = false;
  String? _errorMessage;
  String? _trackingMessage;
  BookingSummary? _booking;
  List<BookingTask> _tasks = [];
  LiveLocationSnapshot? _lastLocationSnapshot;
  DateTime? _lastLocationSentAt;
  int _locationUpdateCount = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {
          elapsed += const Duration(seconds: 1);
        });
      }
    });
    _loadBooking();
  }

  @override
  void dispose() {
    _timer.cancel();
    _tasksScrollController.dispose();
    _locationTrackingService.stop();
    super.dispose();
  }

  Future<void> _loadBooking() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final booking = await _bookingService.getBookingDetails(widget.job.id);
      final tasks = await _bookingService.getBookingTasks(widget.job.id);
      if (!mounted) {
        return;
      }
      final uniqueTasksByName = <String, BookingTask>{};
      for (final task in tasks) {
        final key = task.taskName.trim().toLowerCase();
        uniqueTasksByName.putIfAbsent(key, () => task);
      }
      setState(() {
        _booking = booking;
        _tasks = uniqueTasksByName.values.toList()
          ..sort((a, b) {
            final left = a.orderIndex ?? 9999;
            final right = b.orderIndex ?? 9999;
            return left.compareTo(right);
          });
      });

      _syncLocationTracking(booking);
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
        _errorMessage = 'Unable to load booking details.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _syncLocationTracking(BookingSummary booking) {
    if (booking.status == 'in_progress') {
      _startLocationTracking(booking.id);
      return;
    }

    _stopLocationTracking(clearMessage: booking.status == 'completed');
  }

  Future<void> _startLocationTracking(int bookingId) async {
    if (_locationTrackingService.isTracking) {
      return;
    }

    setState(() {
      _isTrackingLocation = true;
      _trackingMessage = 'Starting live location sharing...';
    });

    await _locationTrackingService.start(
      bookingId: bookingId,
      onSent: (snapshot) {
        if (!mounted) {
          return;
        }
        setState(() {
          _isTrackingLocation = true;
          _lastLocationSnapshot = snapshot;
          _lastLocationSentAt = DateTime.now();
          _locationUpdateCount += 1;
          _trackingMessage = 'Live location is being shared.';
        });
      },
      onError: (message) {
        if (!mounted) {
          return;
        }
        setState(() {
          _isTrackingLocation = false;
          _trackingMessage = message;
        });
      },
    );
  }

  void _stopLocationTracking({bool clearMessage = false}) {
    _locationTrackingService.stop();
    if (!mounted) {
      return;
    }
    setState(() {
      _isTrackingLocation = false;
      if (clearMessage) {
        _trackingMessage = null;
        _lastLocationSnapshot = null;
        _lastLocationSentAt = null;
        _locationUpdateCount = 0;
      }
    });
  }

  double get progress {
    if (_tasks.isEmpty) {
      return 0;
    }
    final completed = _tasks.where((task) => task.isCompleted).length;
    return completed / _tasks.length;
  }

  void _restoreTaskScrollPosition(double offset) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_tasksScrollController.hasClients) {
        return;
      }

      final maxOffset = _tasksScrollController.position.maxScrollExtent;
      final safeOffset = offset.clamp(0.0, maxOffset).toDouble();
      _tasksScrollController.jumpTo(safeOffset);
    });
  }

  Future<void> _toggleTask(BookingTask task) async {
    final previousTasks = List<BookingTask>.from(_tasks);
    final index = _tasks.indexWhere((item) => item.id == task.id);
    if (index == -1) {
      return;
    }
    final scrollOffset = _tasksScrollController.hasClients
        ? _tasksScrollController.offset
        : 0.0;

    setState(() {
      _tasks[index] = BookingTask(
        id: task.id,
        bookingId: task.bookingId,
        taskName: task.taskName,
        orderIndex: task.orderIndex,
        isCompleted: !task.isCompleted,
      );
      _isSubmitting = true;
    });
    _restoreTaskScrollPosition(scrollOffset);

    try {
      await _bookingService.updateTask(
        bookingId: widget.job.id,
        taskId: task.id,
        isCompleted: !task.isCompleted,
      );
      _restoreTaskScrollPosition(scrollOffset);
    } on AuthException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _tasks = previousTasks;
      });
      _restoreTaskScrollPosition(scrollOffset);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _tasks = previousTasks;
      });
      _restoreTaskScrollPosition(scrollOffset);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to update task right now.')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
        _restoreTaskScrollPosition(scrollOffset);
      }
    }
  }

  Future<void> _startJob() async {
    setState(() {
      _isSubmitting = true;
    });

    try {
      await _bookingService.startJob(widget.job.id);
      await _loadBooking();
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Job started successfully.')),
      );
    } on AuthException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  Future<void> _openRejectJobSheet(BookingSummary booking) async {
    final reasonController = TextEditingController();
    final reason = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(context).viewInsets.bottom + 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Request Job Rejection',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              const Text(
                'This will send a rejection request to the admin team. The job is rejected only after admin approval.',
              ),
              const SizedBox(height: 16),
              Text('Booking: ${booking.title}'),
              const SizedBox(height: 16),
              TextField(
                controller: reasonController,
                autofocus: true,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Reason',
                  hintText: 'Example: Not available for this slot',
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    final value = reasonController.text.trim();
                    if (value.isEmpty) {
                      return;
                    }
                    Navigator.pop(context, value);
                  },
                  child: const Text('Send Request'),
                ),
              ),
            ],
          ),
        );
      },
    );
    reasonController.dispose();

    if (reason == null || reason.isEmpty) {
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      await _bookingService.rejectJob(
        bookingId: booking.id,
        reason: reason,
      );
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Rejection request sent to admin.')),
      );
      Navigator.pop(context, true);
    } on AuthException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  Future<void> _completeJob({String? notes}) async {
    setState(() {
      _isSubmitting = true;
    });

    try {
      for (final task in _tasks.where((task) => task.isCompleted)) {
        await _bookingService.updateTask(
          bookingId: widget.job.id,
          taskId: task.id,
          isCompleted: true,
        );
      }

      final latestTasks = await _bookingService.getBookingTasks(widget.job.id);
      final uniqueTasksByName = <String, BookingTask>{};
      for (final task in latestTasks) {
        final key = task.taskName.trim().toLowerCase();
        uniqueTasksByName.putIfAbsent(key, () => task);
      }
      final syncedTasks = uniqueTasksByName.values.toList()
        ..sort((a, b) {
          final left = a.orderIndex ?? 9999;
          final right = b.orderIndex ?? 9999;
          return left.compareTo(right);
        });
      final pendingCount = syncedTasks.where((task) => !task.isCompleted).length;

      if (pendingCount > 0) {
        if (!mounted) {
          return;
        }
        setState(() {
          _tasks = syncedTasks;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '$pendingCount task${pendingCount == 1 ? '' : 's'} still need to be completed before requesting approval.',
            ),
          ),
        );
        return;
      }

      await _bookingService.reportPaymentReceived(widget.job.id, notes: notes);
      _stopLocationTracking(clearMessage: true);
      await _loadBooking();
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment received report sent to admin for approval.')),
      );
    } on AuthException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  Future<void> _openCompletionRequest(BookingSummary booking) async {
    String completionNotes = '';
    final submitted = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(context).viewInsets.bottom + 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Payment Received Report',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              const Text(
                'Confirm payment was collected from customer. This sends an approval request to admin before final completion.',
              ),
              const SizedBox(height: 16),
              Text('Booking: ${booking.title}'),
              Text('Completed tasks: ${_tasks.where((task) => task.isCompleted).length}/${_tasks.length}'),
              const SizedBox(height: 16),
              TextField(
                maxLines: 3,
                onChanged: (value) {
                  completionNotes = value;
                },
                decoration: const InputDecoration(
                  labelText: 'Payment notes',
                  hintText: 'Example: Cash collected at site',
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Report Payment Received'),
                ),
              ),
            ],
          ),
        );
      },
    );

    if (submitted == true) {
      await _completeJob(notes: completionNotes);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Job Details')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_errorMessage!, textAlign: TextAlign.center),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: _loadBooking,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final booking = _booking;
    if (booking == null) {
      return const Scaffold(
        body: Center(child: Text('Booking not found')),
      );
    }

    final completedCount = _tasks.where((task) => task.isCompleted).length;
    final packageEntry = PackageCatalog.entries[booking.packageName ?? ''];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Details'),
      ),
      body: booking.status == 'assigned'
          ? _AssignedView(
              booking: booking,
              packageEntry: packageEntry,
              isSubmitting: _isSubmitting,
              onStart: _startJob,
              onReject: () => _openRejectJobSheet(booking),
              trackingMessage: _trackingMessage,
            )
          : ListView(
              controller: _tasksScrollController,
              padding: const EdgeInsets.all(16),
              children: [
                  Text(
                    booking.title,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${booking.locationLine} • ${booking.timeLine}',
                    style: const TextStyle(color: Colors.grey),
                  ),
                  if (booking.customerName != null) ...[
                    const SizedBox(height: 6),
                    Text('Customer: ${booking.customerName}'),
                  ],
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$completedCount of ${_tasks.length} tasks completed',
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: progress,
                              minHeight: 8,
                              backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
                              valueColor: AlwaysStoppedAnimation(
                                Theme.of(context).colorScheme.primary,
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${(progress * 100).toStringAsFixed(0)}% completed',
                            style: const TextStyle(fontSize: 12),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Time elapsed: ${elapsed.inMinutes}m ${elapsed.inSeconds % 60}s',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (booking.status == 'in_progress') ...[
                    const SizedBox(height: 12),
                    _LiveTrackingCard(
                      isTracking: _isTrackingLocation,
                      trackingMessage: _trackingMessage,
                      snapshot: _lastLocationSnapshot,
                      lastSentAt: _lastLocationSentAt,
                      updateCount: _locationUpdateCount,
                    ),
                  ],
                  const SizedBox(height: 16),
                  if (packageEntry != null) ...[
                    _PackageSummaryCard(
                      packageEntry: packageEntry,
                      packageName: booking.packageName ?? packageEntry.name,
                    ),
                    const SizedBox(height: 16),
                  ],
                  const Text(
                    'Checklist',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  if (booking.status == 'rejection_requested') ...[
                    Card(
                      color: Theme.of(context).colorScheme.primaryContainer,
                      child: const Padding(
                        padding: EdgeInsets.all(12),
                        child: Text(
                          'Rejection request is waiting for admin approval. This job cannot be started unless admin reassigns or approves the request.',
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (_tasks.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 32),
                      child: Center(child: Text('No checklist tasks available for this booking.')),
                    )
                  else
                    ..._tasks.map(
                      (task) => ListTile(
                        leading: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 300),
                          child: task.isCompleted
                              ? const Icon(Icons.check_circle, color: Colors.green, key: ValueKey(true))
                              : const Icon(Icons.radio_button_unchecked, key: ValueKey(false)),
                        ),
                        title: Text(
                          task.taskName,
                          style: TextStyle(
                            color: task.isCompleted
                                ? Theme.of(context).disabledColor
                                : Theme.of(context).colorScheme.onSurface,
                          ),
                        ),
                        onTap: booking.status == 'completed' ||
                                booking.status == 'rejection_requested' ||
                                _isSubmitting
                            ? null
                            : () => _toggleTask(task),
                      ),
                    ),
                  if (booking.status == 'in_progress')
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: progress == 1.0 && !_isSubmitting
                              ? () => _openCompletionRequest(booking)
                              : null,
                          child: _isSubmitting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Text('Report Payment Received'),
                        ),
                      ),
                    ),
                ],
            ),
    );
  }
}

class _AssignedView extends StatelessWidget {
  final BookingSummary booking;
  final PackageCatalogEntry? packageEntry;
  final bool isSubmitting;
  final Future<void> Function() onStart;
  final Future<void> Function() onReject;
  final String? trackingMessage;

  const _AssignedView({
    required this.booking,
    required this.packageEntry,
    required this.isSubmitting,
    required this.onStart,
    required this.onReject,
    required this.trackingMessage,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.assignment, size: 48),
          const SizedBox(height: 12),
          const Text(
            'New Job Assigned',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          const Text(
            'Review the package scope, then start the job when you are ready.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
          ),
          if (trackingMessage != null) ...[
            const SizedBox(height: 12),
            Text(
              trackingMessage!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Theme.of(context).colorScheme.primary),
            ),
          ],
          const SizedBox(height: 24),
          if (packageEntry != null) ...[
            _PackageSummaryCard(
              packageEntry: packageEntry!,
              packageName: booking.packageName ?? packageEntry!.name,
            ),
            const SizedBox(height: 24),
          ],
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: isSubmitting ? null : () => onStart(),
              child: isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Start Job'),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton(
              onPressed: isSubmitting ? null : () => onReject(),
              child: const Text('Request Rejection'),
            ),
          ),
        ],
      ),
    );
  }
}

class _LiveTrackingCard extends StatelessWidget {
  final bool isTracking;
  final String? trackingMessage;
  final LiveLocationSnapshot? snapshot;
  final DateTime? lastSentAt;
  final int updateCount;

  const _LiveTrackingCard({
    required this.isTracking,
    required this.trackingMessage,
    required this.snapshot,
    required this.lastSentAt,
    required this.updateCount,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = isTracking ? Colors.green : Theme.of(context).colorScheme.primary;
    final statusText = trackingMessage ??
        (isTracking ? 'Live location is active.' : 'Live location is not active.');

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isTracking ? Icons.my_location : Icons.location_disabled,
                  color: statusColor,
                ),
                const SizedBox(width: 8),
                Text(
                  'Live Location',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              statusText,
              style: TextStyle(color: statusColor),
            ),
            const SizedBox(height: 6),
            Text(
              'Updates sent: $updateCount. Next update runs every 30 seconds while this screen is open.',
              style: const TextStyle(fontSize: 12),
            ),
            if (snapshot != null) ...[
              const SizedBox(height: 8),
              Text(
                'Last sent: ${snapshot!.latitude.toStringAsFixed(5)}, ${snapshot!.longitude.toStringAsFixed(5)}',
                style: const TextStyle(fontSize: 12),
              ),
              if (snapshot!.accuracy != null)
                Text(
                  'Accuracy: ${snapshot!.accuracy!.toStringAsFixed(1)} m',
                  style: const TextStyle(fontSize: 12),
                ),
            ],
            if (lastSentAt != null) ...[
              const SizedBox(height: 4),
              Text(
                'Updated at ${_formatTimestamp(lastSentAt!)}',
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ],
        ),
      ),
    );
  }

  static String _formatTimestamp(DateTime timestamp) {
    final hour = timestamp.hour.toString().padLeft(2, '0');
    final minute = timestamp.minute.toString().padLeft(2, '0');
    final second = timestamp.second.toString().padLeft(2, '0');
    return '$hour:$minute:$second';
  }
}

class _PackageSummaryCard extends StatelessWidget {
  final PackageCatalogEntry packageEntry;
  final String packageName;

  const _PackageSummaryCard({
    required this.packageEntry,
    required this.packageName,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$packageName Package',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            Text(
              packageEntry.subtitle,
              style: const TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 10),
            ...packageEntry.highlights.take(4).map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text('• $item'),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}
