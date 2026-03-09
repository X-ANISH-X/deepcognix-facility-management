class PackageModel {
  final String id;
  final String name;
  final String description;

  /// Example: ["Dusting furniture", "Mopping floors"]
  final List<String> checklist;

  /// Duration depending on apartment type
  /// Example:
  /// {
  ///   "Studio": "2-3 hours",
  ///   "1 BHK": "3-4 hours",
  ///   "2 BHK": "4-5 hours",
  ///   "3 BHK": "5-6 hours"
  /// }
  final Map<String, String> durationByApartment;

  /// Base price (can change later depending on apartment type)
  final double price;

  PackageModel({
    required this.id,
    required this.name,
    required this.description,
    required this.checklist,
    required this.durationByApartment,
    required this.price,
  });
}