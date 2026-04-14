import 'package:flutter/material.dart';

class ServiceModel {
  final int id;
  final String name;
  final String description;
  final double basePrice;
  final IconData icon;

  ServiceModel({
    required this.id,
    required this.name,
    required this.description,
    required this.basePrice,
    required this.icon,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      id: json['id'] as int,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      basePrice: (json['base_price'] as num).toDouble(),
      icon: _iconForService(json['name'] as String),
    );
  }

  static IconData _iconForService(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('mall') || lower.contains('store')) return Icons.store_mall_directory;
    if (lower.contains('theater') || lower.contains('cinema')) return Icons.theaters;
    if (lower.contains('glass') || lower.contains('window')) return Icons.window;
    if (lower.contains('deep')) return Icons.cleaning_services;
    if (lower.contains('carpet')) return Icons.layers;
    if (lower.contains('restroom') || lower.contains('sanit')) return Icons.bathroom;
    return Icons.business;
  }
}
