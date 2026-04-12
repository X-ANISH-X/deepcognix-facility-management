class PackageCatalogEntry {
  final String name;
  final String subtitle;
  final List<String> highlights;
  final Map<String, String> estimatedDurations;
  final List<String> optionalAddOns;

  const PackageCatalogEntry({
    required this.name,
    required this.subtitle,
    required this.highlights,
    required this.estimatedDurations,
    required this.optionalAddOns,
  });
}

class PackageCatalog {
  static const List<String> commonAddOns = [
    'Carpet shampoo cleaning',
    'Curtain cleaning',
    'Sofa shampoo cleaning',
    'Refrigerator deep cleaning',
    'Oven deep cleaning',
    'AC duct cleaning coordination',
    'Disinfection and sanitization service',
  ];

  static const Map<String, PackageCatalogEntry> entries = {
    'Silver': PackageCatalogEntry(
      name: 'Silver',
      subtitle: 'Basic Cleaning',
      highlights: [
        'Dust furniture, shelves, and surfaces',
        'Sweep and mop floors',
        'Clean kitchen countertop and sink',
        'Clean bathroom basin, mirror, and toilet',
        'Collect garbage and clean internal window frames',
        'Basic balcony sweeping and mopping',
      ],
      estimatedDurations: {
        'Studio': '2-3 hours',
        '1 BHK': '3-4 hours',
        '2 BHK': '4-5 hours',
        '3 BHK': '5-6 hours',
      },
      optionalAddOns: commonAddOns,
    ),
    'Gold': PackageCatalogEntry(
      name: 'Gold',
      subtitle: 'Standard Deep Cleaning',
      highlights: [
        'Includes all Silver services',
        'Deep clean kitchen cabinets inside and outside',
        'Degrease kitchen wall tiles and appliance exteriors',
        'Deep clean bathroom tiles and shower area',
        'Vacuum sofas and cushions',
        'Detailed dusting of frames, wardrobes, and interior glass',
      ],
      estimatedDurations: {
        'Studio': '3-4 hours',
        '1 BHK': '4-5 hours',
        '2 BHK': '5-6 hours',
        '3 BHK': '6-7 hours',
      },
      optionalAddOns: commonAddOns,
    ),
    'Platinum': PackageCatalogEntry(
      name: 'Platinum',
      subtitle: 'Premium Deep Cleaning and Sanitization',
      highlights: [
        'Includes all Gold services',
        'Steam sanitization of bathrooms and kitchen areas',
        'Deep vacuum carpets, sofas, and mattresses',
        'Detailed cleaning behind accessible furniture',
        'Wardrobe internal cleaning and interior fridge cleaning',
        'Premium floor polishing and balcony pressure cleaning',
      ],
      estimatedDurations: {
        'Studio': '4-5 hours',
        '1 BHK': '5-6 hours',
        '2 BHK': '6-7 hours',
        '3 BHK': '7-8 hours',
      },
      optionalAddOns: commonAddOns,
    ),
  };
}
