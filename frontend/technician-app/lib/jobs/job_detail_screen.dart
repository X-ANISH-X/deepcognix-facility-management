import 'dart:async';
import 'package:flutter/material.dart';
import '../models/job_ui_models.dart';

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
  bool completionRequested = false;
  bool locationSent = false;
  late Timer _timer;
  Duration elapsed = Duration.zero;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() {
        elapsed += const Duration(seconds: 1);
      });
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  double get progress {
    if (widget.job.tasks.isEmpty) {
      return 0;
    }
    final completed =
        widget.job.tasks.where((task) => task.completed).length;
    return completed / widget.job.tasks.length;
  }

  @override
  Widget build(BuildContext context) {
    final completedCount =
        widget.job.tasks.where((task) => task.completed).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Details'),
        actions: [
          if (completionRequested)
            const Padding(
              padding: EdgeInsets.only(right: 16),
              child: Chip(
                label: Text('Awaiting Approval'),
              ),
            ),
        ],
      ),
      body: widget.job.status == 'assigned'
          ? _assignedView(context)
          : Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                // Header
                Text(
                  widget.job.title,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${widget.job.location} • ${widget.job.time}',
                  style: const TextStyle(color: Colors.grey),
                ),

                const SizedBox(height: 16),

                // Progress summary
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$completedCount of ${widget.job.tasks.length} tasks completed',
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

                // Checklist
                const Text(
                  'Checklist',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),

                const SizedBox(height: 8),

                Expanded(
                  child: widget.job.tasks.isEmpty
                      ? const Center(
                          child: Text('Task details will be connected next.'),
                        )
                      : ListView.builder(
                          itemCount: widget.job.tasks.length,
                          itemBuilder: (context, index) {
                            final task = widget.job.tasks[index];

                            return ListTile(
                              leading: AnimatedSwitcher(
                                duration: const Duration(milliseconds: 300),
                                child: task.completed
                                    ? const Icon(
                                        Icons.check_circle,
                                        color: Colors.green,
                                        key: ValueKey(true),
                                      )
                                    : const Icon(
                                        Icons.radio_button_unchecked,
                                        key: ValueKey(false),
                                      ),
                              ),
                              title: Text(
                                task.title,
                                style: TextStyle(
                                  color: task.completed
                                      ? Theme.of(context).disabledColor
                                      : Theme.of(context).colorScheme.onSurface,
                                ),
                              ),
                              subtitle: task.completed && task.completedAt != null
                                  ? Text(
                                      'Completed at ${task.completedAt!.hour}:${task.completedAt!.minute.toString().padLeft(2, '0')}',
                                      style: const TextStyle(fontSize: 12),
                                    )
                                  : null,
                              onTap: completionRequested || widget.job.status == 'completed'
                                  ? null
                                  : () {
                                      setState(() {
                                        task.completed = !task.completed;
                                        task.completedAt =
                                            task.completed ? DateTime.now() : null;
                                      });
                                    },
                            );
                          },
                        ),
                ),

                if (!completionRequested && widget.job.status == 'active')
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: progress == 1.0
                            ? () {
                          setState(() {
                            completionRequested = true;
                          });

                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Completion requested. Waiting for client approval.',
                              ),
                            ),
                          );
                        }
                            : null,
                        child: const Text('Request Completion'),
                      ),
                    ),
                  ),

              ],
            ),
          )
    );
  }

  Widget _assignedView(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.assignment, size: 48),
          const SizedBox(height: 12),
          const Text(
            'New Job Assigned',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Please accept or reject this job to proceed.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
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
                    builder: (_) => JobDetailScreen(
                      job: JobItem(
                        id: widget.job.id,
                        title: widget.job.title,
                        location: widget.job.location,
                        time: widget.job.time,
                        status: 'active',
                        tasks: widget.job.tasks,
                      ),
                    ),
                  ),
                );
              },
              child: const Text('Accept Job'),
            ),
          ),

          const SizedBox(height: 12),

          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Job rejected. Admin has been notified.',
                    ),
                  ),
                );
                Navigator.pop(context);
              },
              child: const Text('Reject Job'),
            ),
          ),
        ],
      ),
    );
  }
}
