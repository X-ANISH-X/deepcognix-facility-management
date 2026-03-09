import 'package:flutter/material.dart';
import 'package:get/get.dart';

class UserController extends GetxController {
  var name = ''.obs;
  var email = ''.obs;
  var phone = ''.obs;

  var addresses = <String>[].obs;

  /// load from backend/storage
  void loadProfile({String? n, String? e, String? p}) {
    if (n != null) name.value = n;
    if (e != null) email.value = e;
    if (p != null) phone.value = p;
  }

  void updateProfile({String? n, String? e, String? p}) {
    if (n != null) name.value = n;
    if (e != null) email.value = e;
    if (p != null) phone.value = p;
    // call backend to persist
  }

  void addAddress(String addr) {
    addresses.add(addr);
  }

  void editAddress(int idx, String addr) {
    if (idx >= 0 && idx < addresses.length) {
      addresses[idx] = addr;
    }
  }

  void deleteAddress(int idx) {
    if (idx >= 0 && idx < addresses.length) {
      addresses.removeAt(idx);
    }
  }
}
