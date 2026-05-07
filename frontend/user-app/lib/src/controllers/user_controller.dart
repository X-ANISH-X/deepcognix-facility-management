
import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

import 'package:user_a/src/services/auth_service.dart';
import 'package:user_a/src/services/api_client.dart';

class UserController
    extends GetxController {

  final AuthService _auth =
      Get.find<AuthService>();

  final ApiClient _api =
      ApiClient();

  final GetStorage _storage =
      GetStorage();

  // =====================================================
  // PROFILE DATA
  // =====================================================
  final name = ''.obs;

  final email = ''.obs;

  final phone = ''.obs;

  // =====================================================
  // ADDRESS DATA
  // =====================================================
  final addresses =
      <String>[].obs;

  // =====================================================
  // STATES
  // =====================================================
  final isUpdating =
      false.obs;

  final isLoading =
      false.obs;

  // =====================================================
  // INIT
  // =====================================================
  @override
  void onInit() {
    super.onInit();

    loadUser();
  }

  // =====================================================
  // LOAD USER
  // =====================================================
  Future<void>
      loadUser() async {

    try {

      isLoading.value =
          true;

      _loadFromAuth();

      final saved =
          _storage.read<List>(
        "addresses",
      );

      if (saved != null) {

        addresses.value =
            List<String>.from(
          saved,
        );
      }

    } finally {

      isLoading.value =
          false;
    }
  }

  // =====================================================
  // LOAD AUTH DATA
  // =====================================================
  void _loadFromAuth() {

    name.value =
        _auth.fullName ?? "";

    email.value =
        _auth.email ?? "";

    phone.value =
        _auth.phone ?? "";
  }

  // =====================================================
  // UPDATE PROFILE
  // =====================================================
  Future<void>
      updateProfile({
    String? n,
    String? e,
    String? p,
  }) async {

    try {

      if (isUpdating.value) {
        return;
      }

      isUpdating.value =
          true;

      final body =
          <String, dynamic>{};

      if (n != null &&
          n.trim().isNotEmpty) {

        body["full_name"] =
            n.trim();
      }

      if (e != null &&
          e.trim().isNotEmpty) {

        body["email"] =
            e.trim();
      }

      if (p != null &&
          p.trim().isNotEmpty) {

        body["phone_number"] =
            p.trim();
      }

      if (body.isEmpty) {

        Get.snackbar(
          "Nothing Changed",
          "No profile updates detected.",
        );

        return;
      }

      await _api.put(
        "/users/me",
        body,
      );

      await _auth
          .updateProfile(
        name:
            body["full_name"],
        email:
            body["email"],
        phone:
            body["phone_number"],
      );

      if (body[
              "full_name"] !=
          null) {

        name.value =
            body["full_name"];
      }

      if (body["email"] !=
          null) {

        email.value =
            body["email"];
      }

      if (body[
              "phone_number"] !=
          null) {

        phone.value =
            body[
                "phone_number"];
      }

      Get.snackbar(
        "Profile Updated",
        "Your profile has been updated successfully.",
      );

    } catch (e) {

      debugPrint(
        "PROFILE UPDATE ERROR → $e",
      );

      Get.snackbar(
        "Update Failed",
        _message(e),
      );

    } finally {

      isUpdating.value =
          false;
    }
  }

  // =====================================================
  // ADD ADDRESS
  // =====================================================
  void addAddress(
    String addr,
  ) {

    final normalized =
        addr.trim();

    if (normalized.isEmpty) {
      return;
    }

    if (addresses.contains(
      normalized,
    )) {

      Get.snackbar(
        "Duplicate Address",
        "This address already exists.",
      );

      return;
    }

    addresses.add(
      normalized,
    );

    _saveAddresses();
  }

  // =====================================================
  // EDIT ADDRESS
  // =====================================================
  void editAddress(
    int idx,
    String addr,
  ) {

    final normalized =
        addr.trim();

    if (normalized.isEmpty) {
      return;
    }

    if (idx < 0 ||
        idx >=
            addresses.length) {
      return;
    }

    addresses[idx] =
        normalized;

    _saveAddresses();
  }

  // =====================================================
  // DELETE ADDRESS
  // =====================================================
  void deleteAddress(
    int idx,
  ) {

    if (idx < 0 ||
        idx >=
            addresses.length) {
      return;
    }

    addresses.removeAt(
      idx,
    );

    _saveAddresses();
  }

  // =====================================================
  // SAVE ADDRESSES
  // =====================================================
  void _saveAddresses() {

    _storage.write(
      "addresses",
      addresses.toList(),
    );
  }

  // =====================================================
  // ERROR MESSAGE
  // =====================================================
  String _message(
    Object e,
  ) {

    if (e is ApiException) {
      return e.message;
    }

    final raw =
        e.toString();

    return raw.startsWith(
            "Exception: ")
        ? raw.replaceFirst(
            "Exception: ",
            "",
          )
        : raw;
  }
}

