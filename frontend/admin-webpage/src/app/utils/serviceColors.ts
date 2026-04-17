/**
 * Service and specialty color mappings.
 * Falls back to a deterministic palette for custom categories.
 */

const serviceColorMap: Record<string, { badge: string; background: string }> = {
  hvac: {
    badge: 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700',
    background: 'bg-blue-500 dark:bg-blue-600',
  },
  plumbing: {
    badge: 'bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700',
    background: 'bg-green-500 dark:bg-green-600',
  },
  electrical: {
    badge: 'bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700',
    background: 'bg-yellow-500 dark:bg-yellow-600',
  },
  cleaning: {
    badge: 'bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700',
    background: 'bg-purple-500 dark:bg-purple-600',
  },
  security: {
    badge: 'bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700',
    background: 'bg-red-500 dark:bg-red-600',
  },
  lighting: {
    badge: 'bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700',
    background: 'bg-amber-500 dark:bg-amber-600',
  },
  'general cleaning': {
    badge: 'bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-600 dark:hover:bg-teal-700',
    background: 'bg-teal-600 dark:bg-teal-600',
  },
  'kitchen cleaning': {
    badge: 'bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700',
    background: 'bg-orange-500 dark:bg-orange-600',
  },
  'bathroom care': {
    badge: 'bg-sky-500 hover:bg-sky-600 text-white dark:bg-sky-600 dark:hover:bg-sky-700',
    background: 'bg-sky-500 dark:bg-sky-600',
  },
  'windows & balcony': {
    badge: 'bg-indigo-500 hover:bg-indigo-600 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700',
    background: 'bg-indigo-500 dark:bg-indigo-600',
  },
  'upholstery & fabrics': {
    badge: 'bg-pink-600 hover:bg-pink-700 text-white dark:bg-pink-600 dark:hover:bg-pink-700',
    background: 'bg-pink-600 dark:bg-pink-600',
  },
  sanitization: {
    badge: 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700',
    background: 'bg-emerald-600 dark:bg-emerald-600',
  },
  'premium detailing': {
    badge: 'bg-slate-600 hover:bg-slate-700 text-white dark:bg-slate-600 dark:hover:bg-slate-700',
    background: 'bg-slate-600 dark:bg-slate-600',
  },
  'add-on services': {
    badge: 'bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-600 dark:hover:bg-orange-700',
    background: 'bg-orange-600 dark:bg-orange-600',
  },
};

const fallbackPalette = [
  {
    badge: 'bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-600 dark:hover:bg-cyan-700',
    background: 'bg-cyan-600 dark:bg-cyan-600',
  },
  {
    badge: 'bg-lime-600 hover:bg-lime-700 text-white dark:bg-lime-600 dark:hover:bg-lime-700',
    background: 'bg-lime-600 dark:bg-lime-600',
  },
  {
    badge: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white dark:bg-fuchsia-600 dark:hover:bg-fuchsia-700',
    background: 'bg-fuchsia-600 dark:bg-fuchsia-600',
  },
  {
    badge: 'bg-stone-600 hover:bg-stone-700 text-white dark:bg-stone-600 dark:hover:bg-stone-700',
    background: 'bg-stone-600 dark:bg-stone-600',
  },
];

const normalizeServiceName = (serviceName: string) => serviceName.trim().toLowerCase();

const hashServiceName = (serviceName: string) =>
  normalizeServiceName(serviceName)
    .split('')
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);

const getServiceTone = (serviceName: string) => {
  const normalized = normalizeServiceName(serviceName);
  return serviceColorMap[normalized] || fallbackPalette[hashServiceName(normalized) % fallbackPalette.length];
};

export const getServiceColor = (serviceName: string): string => getServiceTone(serviceName).badge;

export const getServiceBgColor = (serviceName: string): string => getServiceTone(serviceName).background;
