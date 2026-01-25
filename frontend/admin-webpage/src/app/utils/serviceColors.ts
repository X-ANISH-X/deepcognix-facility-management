/**
 * Service and specialty color mappings
 * Used across Technician Tracking and Services views
 */

export const getServiceColor = (serviceName: string): string => {
  switch (serviceName.toLowerCase()) {
    case 'hvac':
      return 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700';
    case 'plumbing':
      return 'bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700';
    case 'electrical':
      return 'bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700';
    case 'cleaning':
      return 'bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700';
    case 'security':
      return 'bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700';
    case 'lighting':
      return 'bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700';
    default:
      return 'bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-700';
  }
};

/**
 * Get just the background color (for dots, icons, etc)
 */
export const getServiceBgColor = (serviceName: string): string => {
  switch (serviceName.toLowerCase()) {
    case 'hvac':
      return 'bg-blue-500 dark:bg-blue-600';
    case 'plumbing':
      return 'bg-green-500 dark:bg-green-600';
    case 'electrical':
      return 'bg-yellow-500 dark:bg-yellow-600';
    case 'cleaning':
      return 'bg-purple-500 dark:bg-purple-600';
    case 'security':
      return 'bg-red-500 dark:bg-red-600';
    case 'lighting':
      return 'bg-amber-500 dark:bg-amber-600';
    default:
      return 'bg-gray-500 dark:bg-gray-600';
  }
};

export const AVAILABLE_SERVICES = [
  'HVAC',
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Security',
  'Lighting',
];
