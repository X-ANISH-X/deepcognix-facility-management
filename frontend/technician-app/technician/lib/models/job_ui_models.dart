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
  final int id;
  final String title;
  final String location;
  final String time;
  final String status;
  final List<TaskItem> tasks;

  JobItem({
    required this.id,
    required this.title,
    required this.location,
    required this.time,
    required this.status,
    required this.tasks,
  });
}
