import 'package:flutter/material.dart';

class ServiceModel {
  final int id;
  final String title;
  final String subtitle;
  final double price;
  final IconData icon;

  ServiceModel({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.price,
    required this.icon,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      id: json['id'],
      title: json['name'] ?? "",
      subtitle: json['description'] ?? "",
      price: (json['base_price'] ?? 0).toDouble(),
      icon: Icons.cleaning_services,
    );
  }
}