class JobTask {
  final String title;
  bool completed;
  DateTime? completedAt;

  JobTask(this.title, {this.completed = false, this.completedAt});
}

class FakeJob {
  final String title;
  final String location;
  final String time;
  final List<JobTask> tasks;

  FakeJob({
    required this.title,
    required this.location,
    required this.time,
    required this.tasks,
  });
}

FakeJob demoJob = FakeJob(
  title: 'Office Cleaning – Koramangala',
  location: '5th Block, Koramangala, Bengaluru',
  time: '10:30 AM',
  tasks: [
    JobTask('Dust all workstations and desks'),
    JobTask('Vacuum carpets and floor mats'),
    JobTask('Mop common area floors'),
    JobTask('Clean and sanitize restrooms'),
    JobTask('Empty trash bins'),
    JobTask('Sanitize door handles and switches'),
    JobTask('Clean glass partitions'),
    JobTask('Final inspection and handover'),
  ],
);
