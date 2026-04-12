import 'package:flutter/material.dart';
import '../jobs/job_detail_screen.dart';

class TaskItem {
  final String title;
  bool completed;
  DateTime? completedAt;

  TaskItem({
    required this.title,
    this.completed = false,
    this.completedAt,
  });
}

class JobItem {
  final String title;
  final String location;
  final String time;
  final String status;
  final List<TaskItem> tasks;

  JobItem({
    required this.title,
    required this.location,
    required this.time,
    required this.status,
    required this.tasks,
  });
}

final List<JobItem> demoJobs = [
  JobItem(
    title: 'Office Cleaning – Koramangala',
    location: '5th Block, Koramangala, Bengaluru',
    time: 'Today • 10:30 AM',
    status: 'active',
    tasks: [
      TaskItem(title: 'Sweep office floor'),
      TaskItem(title: 'Mop common area'),
      TaskItem(title: 'Clean work desks'),
      TaskItem(title: 'Sanitize washrooms'),
      TaskItem(title: 'Dust window blinds'),
      TaskItem(title: 'Empty trash bins'),
      TaskItem(title: 'Clean pantry area'),
      TaskItem(title: 'Disinfect door handles'),
    ],
  ),
  JobItem(
    title: 'Apartment Cleaning – Whitefield',
    location: 'ITPL Main Road, Whitefield, Bengaluru',
    time: 'Today • 3:00 PM',
    status: 'assigned',
    tasks: [
      TaskItem(title: 'Dust living room furniture'),
      TaskItem(title: 'Vacuum carpets'),
      TaskItem(title: 'Mop bedroom floors'),
      TaskItem(title: 'Clean kitchen counters'),
      TaskItem(title: 'Wash balcony area'),
      TaskItem(title: 'Sanitize bathroom fittings'),
      TaskItem(title: 'Clean ceiling fans'),
    ],
  ),
  JobItem(
    title: 'Office Cleaning – Indiranagar',
    location: '100 ft Road, Indiranagar, Bengaluru',
    time: 'Yesterday • 11:00 AM',
    status: 'completed',
    tasks: [
      TaskItem(title: 'Mop reception area', completed: true),
      TaskItem(title: 'Clean glass doors', completed: true),
      TaskItem(title: 'Dust conference room tables', completed: true),
      TaskItem(title: 'Sanitize washroom', completed: true),
      TaskItem(title: 'Empty trash bins', completed: true),
      TaskItem(title: 'Clean office pantry', completed: true),
      TaskItem(title: 'Wipe down switches', completed: true),
    ],
  ),
];

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
class JobsList extends StatelessWidget {
  final String status;

  const JobsList({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final jobs =
    demoJobs.where((job) => job.status == status).toList();

    if (jobs.isEmpty) {
      return const Center(
        child: Text('No jobs available'),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: jobs.length,
      itemBuilder: (context, index) {
        final job = jobs[index];

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: Text(
              job.title,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Text('${job.location}\n${job.time}'),
            trailing: Chip(
              label: Text(
                job.status == 'assigned'
                    ? 'Assigned'
                    : job.status == 'active'
                    ? 'In Progress'
                    : 'Completed',
              ),
            ),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => JobDetailScreen(job: job),
                )
              );
            },
          ),
        );
      },
    );
  }
}
