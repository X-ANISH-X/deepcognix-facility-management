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

  // Apartment type is selected ON this screen, not passed from HomeScreen
  final _apartmentTypes = ["Studio", "1 BHK", "2 BHK", "3 BHK"];
  String _selectedApartment = "1 BHK";

  // Service title passed as route argument from HomeScreen
  String get _serviceTitle =>
      (Get.arguments?['serviceTitle'] as String?) ?? "Service";

  @override
  void initState() {
    super.initState();
    // Packages are already loading — triggered by HomeScreen before navigation
    // No need to call loadPackages() again here
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _serviceTitle,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        elevation: 0,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Apartment type selector ──────────────────────────────────
          _ApartmentSelector(
            types: _apartmentTypes,
            selected: _selectedApartment,
            onSelected: (type) =>
                setState(() => _selectedApartment = type),
          ),

          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              "Choose a Package",
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),

          // ── Package list ─────────────────────────────────────────────
          Expanded(
            child: Obx(() {
              if (_pkgCtrl.isLoading.value) {
                return const Center(child: CircularProgressIndicator());
              }

              if (_pkgCtrl.packages.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.inbox, size: 48, color: Colors.grey),
                      const SizedBox(height: 12),
                      const Text("No packages available"),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => _pkgCtrl
                            .loadPackages(_bookingCtrl.serviceId.value),
                        child: const Text("Retry"),
                      ),
                    ],
                  ),
                );
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
    // selectPackage() already syncs packageId + price into BookingController
    _pkgCtrl.selectPackage(pkg);

    // Also store the checklist in BookingController for the status screen
    _bookingCtrl.checklist.value = List<String>.from(pkg.checklist);

    Get.toNamed('/checklist', arguments: {
      'package':       pkg,
      'apartmentType': _selectedApartment,
    });
  }
}

// ====================================================================== //
//  APARTMENT TYPE SELECTOR
// ====================================================================== //
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
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Apartment Type",
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 40,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: types.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final type = types[index];
                final isSelected = type == selected;
                return ChoiceChip(
                  label: Text(type),
                  selected: isSelected,
                  onSelected: (_) => onSelected(type),
                  selectedColor:
                      Theme.of(context).primaryColor.withOpacity(0.2),
                  labelStyle: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: isSelected
                        ? Theme.of(context).primaryColor
                        : null,
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ====================================================================== //
//  PACKAGE CARD
// ====================================================================== //
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
    final pkg      = widget.package;
    final duration =
        pkg.durationByApartment[widget.apartmentType] ?? "N/A";
    final isDark   =
        Theme.of(context).brightness == Brightness.dark;

    // Show 3 items collapsed, all when expanded
    final visibleItems =
        _expanded ? pkg.checklist : pkg.checklist.take(3).toList();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Title + price ────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                pkg.name,
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w600),
              ),
              Text(
                '\$${pkg.price.toInt()}',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).primaryColor,
                    ),
              ),
            ],
          ),

          const SizedBox(height: 6),
          Text(pkg.description,
              style: Theme.of(context).textTheme.bodySmall),

          const SizedBox(height: 10),

          // ── Duration ─────────────────────────────────────────────────
          Row(
            children: [
              const Icon(Icons.access_time, size: 16),
              const SizedBox(width: 6),
              Text(
                "Est. time: $duration",
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),

          const SizedBox(height: 14),

          // ── Checklist items ──────────────────────────────────────────
          ...visibleItems.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Icon(Icons.check_circle,
                      size: 16,
                      color: Theme.of(context).primaryColor),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(item,
                        style: Theme.of(context).textTheme.bodySmall),
                  ),
                ],
              ),
            ),
          ),

          // ── Expand / Collapse toggle ─────────────────────────────────
          if (pkg.checklist.length > 3)
            GestureDetector(
              onTap: () => setState(() => _expanded = !_expanded),
              child: Padding(
                padding: const EdgeInsets.only(top: 4, bottom: 12),
                child: Row(
                  children: [
                    Icon(
                      _expanded
                          ? Icons.keyboard_arrow_up
                          : Icons.keyboard_arrow_down,
                      size: 18,
                      color: Theme.of(context).primaryColor,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _expanded
                          ? "Show less"
                          : "View all ${pkg.checklist.length} items",
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context).primaryColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          const SizedBox(height: 4),

          // ── Continue button ──────────────────────────────────────────
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: widget.onContinue,
              style: ElevatedButton.styleFrom(
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text(
                "Continue",
                style: TextStyle(fontSize: 15),
              ),
            ),
          ),
        ],
      ),
    );
  }
}