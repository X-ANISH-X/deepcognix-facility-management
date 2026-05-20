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
  Timer? _refreshTimer;
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
  int _locationIntervalSeconds = 10;

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
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted && !_isLoading) {
        unawaited(_loadBooking(silentRefresh: true));
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    _refreshTimer?.cancel();
    _tasksScrollController.dispose();
    _locationTrackingService.stop();
    super.dispose();
  }

  Future<void> _loadBooking({bool silentRefresh = false}) async {
    if (!silentRefresh) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

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
      if (!silentRefresh) {
        setState(() {
          _errorMessage = error.message;
        });
      }
    } catch (_) {
      if (!mounted) {
        return;
      }
      if (!silentRefresh) {
        setState(() {
          _errorMessage = 'Unable to load booking details.';
        });
      }
    } finally {
      if (mounted && !silentRefresh) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _syncLocationTracking(BookingSummary booking) {
    if (const {
      'assigned',
      'on_the_way',
      'arrival_approval_pending',
      'in_progress',
    }.contains(booking.status)) {
      _startLocationTracking(
        booking.id,
        interval: _trackingIntervalForStatus(booking.status),
      );
      return;
    }

    _stopLocationTracking(clearMessage: booking.status == 'completed');
  }

  Duration _trackingIntervalForStatus(String status) {
    return status == 'in_progress'
        ? const Duration(seconds: 10)
        : const Duration(seconds: 5);
  }

  Future<void> _startLocationTracking(
    int bookingId, {
    required Duration interval,
  }) async {
    setState(() {
      _isTrackingLocation = true;
      _locationIntervalSeconds = interval.inSeconds;
      _trackingMessage = 'Starting live location sharing...';
    });

    await _locationTrackingService.start(
      bookingId: bookingId,
      interval: interval,
      onSent: (snapshot) {
        if (!mounted) {
          return;
        }
        setState(() {
          _isTrackingLocation = true;
          _locationIntervalSeconds = interval.inSeconds;
          _lastLocationSnapshot = snapshot;
          _lastLocationSentAt = DateTime.now();
          _locationUpdateCount += 1;
          _trackingMessage = interval.inSeconds <= 5
              ? 'High-frequency live tracking is active.'
              : 'Live location is being shared while the job is in progress.';
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
        _locationIntervalSeconds = 10;
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

  Future<void> _markOnTheWay() async {
    setState(() {
      _isSubmitting = true;
    });

    try {
      await _bookingService.markOnTheWay(widget.job.id);
      await _loadBooking();
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Job accepted. You are now marked as on the way.')),
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

  Future<void> _markArrival() async {
    setState(() {
      _isSubmitting = true;
    });

    try {
      await _bookingService.markArrival(widget.job.id);
      await _loadBooking();
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Arrival marked. You can start the job now.')),
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

      await _bookingService.completeJob(widget.job.id, notes: notes);
      _stopLocationTracking(clearMessage: true);
      await _loadBooking();
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Completion approval request sent to customer.')),
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
                'Request Completion Approval',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              const Text(
                'This sends the completed job to the customer for review first. After the customer approves, admin will receive the final completion approval request.',
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
                  labelText: 'Completion notes',
                  hintText: 'Example: All rooms completed and final walkthrough done',
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Send To Customer'),
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
      body: const {
            'assigned',
            'on_the_way',
            'arrival_approval_pending',
          }.contains(booking.status)
          ? _AssignedView(
              booking: booking,
              packageEntry: packageEntry,
              isSubmitting: _isSubmitting,
              onAccept: _markOnTheWay,
              onMarkArrival: _markArrival,
              onStart: _startJob,
              onReject: () => _openRejectJobSheet(booking),
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
                  if (_hasOperationalNotes(booking)) ...[
                    const SizedBox(height: 16),
                    _OperationalNotesCard(booking: booking),
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
                  const SizedBox(height: 16),
                  if (packageEntry != null) ...[
                    _PackageSummaryCard(
                      packageEntry: packageEntry,
                      packageName: booking.packageName ?? packageEntry.name,
                    ),
                    const SizedBox(height: 16),
                  ],
                  if (booking.additionalServices.isNotEmpty) ...[
                    _AdditionalServicesCard(
                      additionalServices: booking.additionalServices,
                      actualCost: booking.actualCost ?? booking.finalPrice,
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
                              : Text(
                                  booking.status == 'customer_review_pending'
                                      ? 'Awaiting Customer Approval'
                                      : booking.status == 'admin_review_pending'
                                          ? 'Awaiting Admin Approval'
                                          : 'Request Completion Approval',
                                ),
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
  final Future<void> Function() onAccept;
  final Future<void> Function() onMarkArrival;
  final Future<void> Function() onStart;
  final Future<void> Function() onReject;

  const _AssignedView({
    required this.booking,
    required this.packageEntry,
    required this.isSubmitting,
    required this.onAccept,
    required this.onMarkArrival,
    required this.onStart,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    final String title;
    final String subtitle;
    final String primaryLabel;
    final Future<void> Function() primaryAction;

    switch (booking.status) {
      case 'on_the_way':
        title = 'Travel In Progress';
        subtitle = 'You accepted this job. Mark it when you reach the customer location.';
        primaryLabel = 'Reached Location';
        primaryAction = onMarkArrival;
        break;
      case 'arrival_approval_pending':
        title = 'Ready To Start';
        subtitle = 'You are at the location. Start the job when you are ready to begin the work.';
        primaryLabel = 'Start Job';
        primaryAction = onStart;
        break;
      default:
        title = 'New Job Assigned';
        subtitle = 'Review the package scope, then accept the job and head to the location.';
        primaryLabel = 'Accept Job';
        primaryAction = onAccept;
        break;
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.assignment, size: 48),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 24),
          if (packageEntry != null) ...[
            _PackageSummaryCard(
              packageEntry: packageEntry!,
              packageName: booking.packageName ?? packageEntry!.name,
            ),
            const SizedBox(height: 24),
          ],
          if (booking.additionalServices.isNotEmpty) ...[
            _AdditionalServicesCard(
              additionalServices: booking.additionalServices,
              actualCost: booking.actualCost ?? booking.finalPrice,
            ),
            const SizedBox(height: 24),
          ],
          if (_hasOperationalNotes(booking)) ...[
            _OperationalNotesCard(booking: booking),
            const SizedBox(height: 24),
          ],
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: isSubmitting ? null : () => primaryAction(),
              child: isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(primaryLabel),
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

bool _hasOperationalNotes(BookingSummary booking) {
  return (booking.customerNotes?.trim().isNotEmpty ?? false) ||
      (booking.preferredTechnician?.trim().isNotEmpty ?? false) ||
      (booking.parkingInstructions?.trim().isNotEmpty ?? false) ||
      (booking.petWarning?.trim().isNotEmpty ?? false) ||
      booking.callBeforeArrival;
}

class _OperationalNotesCard extends StatelessWidget {
  final BookingSummary booking;

  const _OperationalNotesCard({
    required this.booking,
  });

  @override
  Widget build(BuildContext context) {
    final details = <MapEntry<String, String>>[
      if (booking.customerNotes?.trim().isNotEmpty ?? false)
        MapEntry('Special instructions', booking.customerNotes!.trim()),
      if (booking.preferredTechnician?.trim().isNotEmpty ?? false)
        MapEntry('Preferred technician', booking.preferredTechnician!.trim()),
      if (booking.parkingInstructions?.trim().isNotEmpty ?? false)
        MapEntry('Parking instructions', booking.parkingInstructions!.trim()),
      if (booking.petWarning?.trim().isNotEmpty ?? false)
        MapEntry('Pet warning', booking.petWarning!.trim()),
      if (booking.callBeforeArrival)
        const MapEntry('Call before arrival', 'Customer requested a call before the visit.'),
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Customer Notes',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 10),
            ...details.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.key,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(item.value),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AdditionalServicesCard extends StatelessWidget {
  final List<BookingAdditionalService> additionalServices;
  final double? actualCost;

  const _AdditionalServicesCard({
    required this.additionalServices,
    required this.actualCost,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Additional service',
              style: TextStyle(fontWeight: FontWeight.w600, color: Colors.green),
            ),
            const SizedBox(height: 10),
            ...additionalServices.map(
              (service) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            service.serviceName,
                            style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.green),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            service.isIncluded ? 'Included in actual cost' : 'Not included',
                            style: const TextStyle(fontSize: 12, color: Colors.green),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Text(
                      'AED ${service.servicePrice.toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.green),
                    ),
                  ],
                ),
              ),
            ),
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Actual cost',
                  style: TextStyle(fontWeight: FontWeight.w600, color: Colors.green),
                ),
                Text(
                  'AED ${(actualCost ?? 0).toStringAsFixed(2)}',
                  style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.green),
                ),
              ],
            ),
          ],
        ),
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
  final int intervalSeconds;

  const _LiveTrackingCard({
    required this.isTracking,
    required this.trackingMessage,
    required this.snapshot,
    required this.lastSentAt,
    required this.updateCount,
    required this.intervalSeconds,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = isTracking ? Colors.green : Theme.of(context).colorScheme.primary;
    final statusText = trackingMessage ??
        (isTracking ? 'Live location is active.' : 'Live location is not active.');
    final cadenceLabel = intervalSeconds <= 5 ? 'Travel mode' : 'Work mode';
    final cadenceDescription = intervalSeconds <= 5
        ? 'Admin receives your location every 5 seconds while you are heading to the job.'
        : 'Admin receives your location every 10 seconds while you are actively working.';

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(
          color: isTracking
              ? statusColor.withOpacity(0.25)
              : Theme.of(context).dividerColor,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    isTracking ? Icons.my_location : Icons.location_disabled,
                    color: statusColor,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Live Location',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        statusText,
                        style: TextStyle(color: statusColor),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '${intervalSeconds}s',
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _TrackingStatChip(
                    label: 'Updates Sent',
                    value: '$updateCount',
                    icon: Icons.send_rounded,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _TrackingStatChip(
                    label: cadenceLabel,
                    value: 'Every ${intervalSeconds}s',
                    icon: intervalSeconds <= 5
                        ? Icons.route_outlined
                        : Icons.cleaning_services_outlined,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.08),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    intervalSeconds <= 5
                        ? Icons.navigation_outlined
                        : Icons.schedule_outlined,
                    size: 18,
                    color: statusColor,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      cadenceDescription,
                      style: const TextStyle(fontSize: 12.5, height: 1.35),
                    ),
                  ),
                ],
              ),
            ),
            if (snapshot != null) ...[
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Last sent: ${snapshot!.latitude.toStringAsFixed(5)}, ${snapshot!.longitude.toStringAsFixed(5)}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    if (snapshot!.accuracy != null) ...[
                      const SizedBox(height: 4),
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

class _TrackingStatChip extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _TrackingStatChip({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.35),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            size: 18,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Colors.grey,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
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
