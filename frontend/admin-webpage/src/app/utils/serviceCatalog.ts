import type { Service } from '@/app/services/api';

export const NEW_CATEGORY_VALUE = '__new__';

export const DEFAULT_SERVICE_CATEGORIES = [
  'General Cleaning',
  'Kitchen Cleaning',
  'Bathroom Care',
  'Windows & Balcony',
  'Upholstery & Fabrics',
  'Sanitization',
  'Premium Detailing',
  'Add-On Services',
  'HVAC',
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Security',
  'Lighting',
];

export function getServiceCategories(services: Pick<Service, 'category'>[]): string[] {
  return Array.from(
    new Set([
      ...DEFAULT_SERVICE_CATEGORIES,
      ...services.map((service) => service.category.trim()).filter(Boolean),
    ]),
  ).sort((left, right) => left.localeCompare(right));
}

export function resolveServiceCategory(selectedCategory: string, newCategory?: FormDataEntryValue | string | null): string {
  const resolved = selectedCategory === NEW_CATEGORY_VALUE ? newCategory : selectedCategory;
  return String(resolved ?? '').trim();
}