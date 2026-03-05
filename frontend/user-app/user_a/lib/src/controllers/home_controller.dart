import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:user_a/src/models/service_model.dart';

class HomeController extends GetxController {
  final services = <ServiceModel>[
    ServiceModel(
      id: 'office',
      title: 'service_office',
      subtitle: 'service_office_desc',
      icon: Icons.business,
    ),
    ServiceModel(
      id: 'mall',
      title: 'service_mall',
      subtitle: 'service_mall_desc',
      icon: Icons.store_mall_directory,
    ),
    ServiceModel(
      id: 'theater',
      title: 'service_theater',
      subtitle: 'service_theater_desc',
      icon: Icons.theaters,
    ),
    ServiceModel(
      id: 'glass',
      title: 'service_glass',
      subtitle: 'service_glass_desc',
      icon: Icons.window,
    ),
  ].obs;
}
