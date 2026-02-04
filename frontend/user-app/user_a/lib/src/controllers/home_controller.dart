import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:user_a/src/models/service_model.dart';

class HomeController extends GetxController {
  final services = <ServiceModel>[
    ServiceModel(
      id: 'office',
      title: 'Office Cleaning',
      subtitle: 'Corporate & workspace',
      icon: Icons.business,
    ),
    ServiceModel(
      id: 'mall',
      title: 'Mall Cleaning',
      subtitle: 'Large retail spaces',
      icon: Icons.store_mall_directory,
    ),
    ServiceModel(
      id: 'theater',
      title: 'Theater Cleaning',
      subtitle: 'Auditorium & lobby',
      icon: Icons.theaters,
    ),
    ServiceModel(
      id: 'glass',
      title: 'Glass Cleaning',
      subtitle: 'Exterior & interior',
      icon: Icons.window,
    ),
  ].obs;
}
