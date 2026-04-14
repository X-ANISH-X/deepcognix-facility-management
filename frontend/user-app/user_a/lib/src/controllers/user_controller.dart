import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:user_a/src/services/auth_service.dart';
import 'package:user_a/src/services/api_client.dart';

class UserController extends GetxController {
  final AuthService _auth = Get.find<AuthService>();
  final ApiClient _api = ApiClient();
  final GetStorage _storage = GetStorage();

  // ── Observable profile fields ────────────────────────────────────────
  final name = ''.obs;
  final email = ''.obs;
  final phone = ''.obs;

  // ── Address list (local only)
  final addresses = <String>[].obs;

  final isUpdating = false.obs;

  // ================================================================== //
  // INIT
  // ================================================================== //
  @override
  void onInit() {
    super.onInit();
    _loadFromAuthService();
  }

  /// 🔥 REQUIRED (used by ProfileScreen)
  Future<void> loadUser() async {
    _loadFromAuthService();
  }

  void _loadFromAuthService() {
    name.value = _auth.fullName ?? "";
    email.value = _auth.email ?? "";
    phone.value = _auth.phone ?? "";

    final saved = _storage.read<List>("addresses");
    if (saved != null) {
      addresses.value = List<String>.from(saved);
    }
  }

  // ================================================================== //
  // UPDATE PROFILE
  // ================================================================== //
  Future<void> updateProfile({String? n, String? e, String? p}) async {
    try {
      isUpdating.value = true;

      final body = <String, dynamic>{};
      if (n != null && n.trim().isNotEmpty) body["full_name"] = n.trim();
      if (e != null && e.trim().isNotEmpty) body["email"] = e.trim();
      if (p != null && p.trim().isNotEmpty) body["phone_number"] = p.trim();

      if (body.isEmpty) {
        Get.snackbar("Nothing changed", "No fields were updated.");
        return;
      }

      await _api.put("/users/me", body);

      _auth.updateProfile(
        name: body["full_name"],
        email: body["email"],
        phone: body["phone_number"],
      );

      if (body["full_name"] != null) name.value = body["full_name"];
      if (body["email"] != null) email.value = body["email"];
      if (body["phone_number"] != null) phone.value = body["phone_number"];

      Get.snackbar(
        "Profile Updated",
        "Your details have been saved.",
        snackPosition: SnackPosition.BOTTOM,
      );

    } catch (e) {
      debugPrint("Profile update failed → $e");
      Get.snackbar(
        "Update Failed",
        _message(e),
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isUpdating.value = false;
    }
  }

  // ================================================================== //
  // ADDRESS MANAGEMENT
  // ================================================================== //
  void addAddress(String addr) {
    if (addr.trim().isEmpty) return;
    if (!addresses.contains(addr.trim())) {
      addresses.add(addr.trim());
      _saveAddresses();
    }
  }

  void editAddress(int idx, String addr) {
    if (addr.trim().isEmpty) return;
    if (idx >= 0 && idx < addresses.length) {
      addresses[idx] = addr.trim();
      _saveAddresses();
    }
  }

  void deleteAddress(int idx) {
    if (idx >= 0 && idx < addresses.length) {
      addresses.removeAt(idx);
      _saveAddresses();
    }
  }

  void _saveAddresses() {
    _storage.write("addresses", addresses.toList());
  }

  // ================================================================== //
  // HELPER
  // ================================================================== //
  String _message(Object e) {
    if (e is ApiException) return e.message;
    final raw = e.toString();
    return raw.startsWith("Exception: ")
        ? raw.replaceFirst("Exception: ", "")
        : raw;
  }
}