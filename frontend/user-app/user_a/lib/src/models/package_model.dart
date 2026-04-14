class PackageModel {
  final int id;
  final String name;
  final double price;
  final String description;
  final List<String> checklist;

  PackageModel({
    required this.id,
    required this.name,
    required this.price,
    required this.description,
    this.checklist = const [],
  });

  factory PackageModel.fromJson(Map<String, dynamic> json) {
    return PackageModel(
      id: json['id'] as int,
      name: json['name'] as String,
      price: (json['price'] as num).toDouble(),
      description: json['description'] as String? ?? '',
    );
  }

  PackageModel withChecklist(List<String> tasks) {
    return PackageModel(
      id: id,
      name: name,
      price: price,
      description: description,
      checklist: tasks,
    );
  }
}
