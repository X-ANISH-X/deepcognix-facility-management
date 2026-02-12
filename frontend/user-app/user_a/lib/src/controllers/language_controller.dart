import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:flutter/material.dart';

class LanguageController extends GetxController {
  final box = GetStorage();

  // 🔥 Single source of truth
  final locale = const Locale('en').obs;

  @override
  void onInit() {
    super.onInit();

    final savedLang = box.read('lang');

    if (savedLang != null) {
      locale.value = Locale(savedLang);
    }
  }

  // 🔥 Change language
  void changeLanguage(String langCode) {
    locale.value = Locale(langCode);
    box.write('lang', langCode);
  }
}
