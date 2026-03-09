import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:user_a/src/controllers/user_controller.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userController = Get.put(UserController());

    return Scaffold(
      appBar: AppBar(
        title: Text(
          "profile".tr,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () => _showEditProfile(context, userController),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Obx(
          () => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Column(
                  children: [
                    const CircleAvatar(
                      radius: 50,
                      backgroundColor: Colors.teal,
                      child: Icon(Icons.person, size: 50, color: Colors.white),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      userController.name.value.isEmpty
                          ? "--"
                          : userController.name.value,
                      style: const TextStyle(
                          fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      userController.email.value.isEmpty
                          ? "--"
                          : userController.email.value,
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),
              Text(
                'addresses'.tr,
                style: Theme.of(context)
                    .textTheme
                    .titleSmall
                    ?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 10),
              ...userController.addresses.asMap().entries.map(
                    (entry) => ListTile(
                      title: Text(entry.value),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.edit),
                            onPressed: () {
                              _showEditAddress(context, userController,
                                  entry.key, entry.value);
                            },
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete),
                            onPressed: () {
                              userController.deleteAddress(entry.key);
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
              ListTile(
                leading: const Icon(Icons.add),
                title: Text('add_new_address'.tr),
                onTap: () {
                  _showAddAddressDialog(context, userController);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showEditProfile(
      BuildContext context, UserController userController) {
    final nameC = TextEditingController(text: userController.name.value);
    final emailC = TextEditingController(text: userController.email.value);
    final phoneC = TextEditingController(text: userController.phone.value);

    Get.defaultDialog(
      title: 'edit_profile'.tr,
      content: Column(
        children: [
          TextField(
            controller: nameC,
            decoration: InputDecoration(labelText: 'name'.tr),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: emailC,
            decoration: InputDecoration(labelText: 'email'.tr),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: phoneC,
            decoration: InputDecoration(labelText: 'phone_number'.tr),
          ),
        ],
      ),
      textConfirm: 'save'.tr,
      textCancel: 'cancel'.tr,
      onConfirm: () {
        userController.updateProfile(
          n: nameC.text.trim(),
          e: emailC.text.trim(),
          p: phoneC.text.trim(),
        );
        Get.back();
      },
    );
  }

  void _showAddAddressDialog(
      BuildContext context, UserController userController) {
    final addrC = TextEditingController();
    Get.defaultDialog(
      title: 'new_address'.tr,
      content: TextField(
        controller: addrC,
        decoration: InputDecoration(hintText: 'enter_address'.tr),
      ),
      textConfirm: 'add'.tr,
      textCancel: 'cancel'.tr,
      onConfirm: () {
        if (addrC.text.trim().isNotEmpty) {
          userController.addAddress(addrC.text.trim());
          Get.back();
        }
      },
    );
  }

  void _showEditAddress(BuildContext context, UserController userController,
      int idx, String current) {
    final addrC = TextEditingController(text: current);
    Get.defaultDialog(
      title: 'edit_address'.tr,
      content: TextField(
        controller: addrC,
        decoration: InputDecoration(hintText: 'enter_address'.tr),
      ),
      textConfirm: 'save'.tr,
      textCancel: 'cancel'.tr,
      onConfirm: () {
        if (addrC.text.trim().isNotEmpty) {
          userController.editAddress(idx, addrC.text.trim());
          Get.back();
        }
      },
    );
  }
}
