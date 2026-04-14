import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:flutter/material.dart';

class LanguageController extends GetxController {
  final box = GetStorage();

  Rx<Locale> locale = const Locale('en').obs;

  @override
  void onInit() {
    final savedLang = box.read('lang') ?? 'en';
    locale.value = Locale(savedLang);
    Get.updateLocale(locale.value);
    super.onInit();
  }

  void changeLanguage(String langCode) {
    locale.value = Locale(langCode);
    box.write('lang', langCode);
    Get.updateLocale(locale.value);
  }
}
