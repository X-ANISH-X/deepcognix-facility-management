// SAME IMPORTS — untouched
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:user_a/src/controllers/package_controller.dart';
import 'package:user_a/src/controllers/booking_controller.dart';
import 'package:user_a/src/models/package_model.dart';
import 'package:user_a/src/screens/checklist_preview_screen.dart';

class PackageSelectionScreen extends StatefulWidget {
  const PackageSelectionScreen({super.key});

  @override
  State<PackageSelectionScreen> createState() =>
      _PackageSelectionScreenState();
}

class _PackageSelectionScreenState
    extends State<PackageSelectionScreen> {
  final PackageController _pkgCtrl     = Get.find();
  final BookingController _bookingCtrl = Get.find();

  final _apartmentTypes = ["Studio", "1 BHK", "2 BHK", "3 BHK"];
  String _selectedApartment = "1 BHK";

  String get _serviceTitle =>
      (Get.arguments?['serviceTitle'] as String?) ?? "Service";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FB), // 🔥 soft background
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          _serviceTitle,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          _ApartmentSelector(
            types: _apartmentTypes,
            selected: _selectedApartment,
            onSelected: (type) =>
                setState(() => _selectedApartment = type),
          ),

          const Padding(
            padding: EdgeInsets.fromLTRB(16, 20, 16, 10),
            child: Text(
              "Choose a Package",
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),

          Expanded(
            child: Obx(() {
              if (_pkgCtrl.isLoading.value) {
                return const Center(child: CircularProgressIndicator());
              }

              if (_pkgCtrl.packages.isEmpty) {
                return const Center(child: Text("No packages available"));
              }

              return ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                itemCount: _pkgCtrl.packages.length,
                separatorBuilder: (_, __) => const SizedBox(height: 16),
                itemBuilder: (context, index) {
                  final pkg = _pkgCtrl.packages[index];
                  return _PackageCard(
                    package: pkg,
                    apartmentType: _selectedApartment,
                    onContinue: () => _onContinue(pkg),
                  );
                },
              );
            }),
          ),
        ],
      ),
    );
  }

  void _onContinue(PackageModel pkg) {
    _pkgCtrl.selectPackage(pkg);
    _bookingCtrl.checklist.value = List<String>.from(pkg.checklist);

    Get.toNamed('/checklist', arguments: {
      'package': pkg,
      'apartmentType': _selectedApartment,
    });
  }
}

// =======================================================
// APARTMENT SELECTOR (clean pill UI)
// =======================================================
class _ApartmentSelector extends StatelessWidget {
  final List<String> types;
  final String selected;
  final ValueChanged<String> onSelected;

  const _ApartmentSelector({
    required this.types,
    required this.selected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
      child: Wrap(
        spacing: 10,
        children: types.map((type) {
          final isSelected = type == selected;

          return ChoiceChip(
            label: Text(type),
            selected: isSelected,
            onSelected: (_) => onSelected(type),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            selectedColor: const Color(0xFFE6F4F1),
            backgroundColor: Colors.white,
            labelStyle: TextStyle(
              fontWeight: FontWeight.w600,
              color: isSelected
                  ? const Color(0xFF0F9D8A)
                  : Colors.black87,
            ),
          );
        }).toList(),
      ),
    );
  }
}

// =======================================================
// PACKAGE CARD (THIS IS THE REAL GLOW UP)
// =======================================================
class _PackageCard extends StatefulWidget {
  final PackageModel package;
  final String apartmentType;
  final VoidCallback onContinue;

  const _PackageCard({
    required this.package,
    required this.apartmentType,
    required this.onContinue,
  });

  @override
  State<_PackageCard> createState() => _PackageCardState();
}

class _PackageCardState extends State<_PackageCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final pkg = widget.package;
    final duration =
        pkg.durationByApartment[widget.apartmentType] ?? "N/A";

    final visibleItems =
        _expanded ? pkg.checklist : pkg.checklist.take(3).toList();

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: Colors.grey.shade200,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),

      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          /// TITLE + PRICE
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                pkg.name,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                '\$${pkg.price.toInt()}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F9D8A),
                  fontSize: 16,
                ),
              ),
            ],
          ),

          const SizedBox(height: 6),

          Text(
            pkg.description,
            style: const TextStyle(
              fontSize: 13,
              color: Colors.black54,
            ),
          ),

          const SizedBox(height: 10),

          /// DURATION
          Row(
            children: [
              const Icon(Icons.access_time, size: 15),
              const SizedBox(width: 6),
              Text(
                "Est. time: $duration",
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ),

          const SizedBox(height: 12),

          /// CHECKLIST
          ...visibleItems.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                children: [
                  const Icon(Icons.check, size: 16, color: Color(0xFF0F9D8A)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      item,
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ),

          if (pkg.checklist.length > 3)
            GestureDetector(
              onTap: () => setState(() => _expanded = !_expanded),
              child: Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  _expanded
                      ? "Show less"
                      : "View all ${pkg.checklist.length} items",
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF0F9D8A),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),

          const SizedBox(height: 14),

          /// BUTTON
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: widget.onContinue,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F9D8A),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text(
                "Continue",
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}