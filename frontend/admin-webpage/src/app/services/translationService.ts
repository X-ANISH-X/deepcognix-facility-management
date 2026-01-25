import translate from 'google-translate-api-x';

// In-memory cache to avoid repeated API calls
const translationCache: { [key: string]: { [key: string]: string } } = {
  ar: {},
  en: {}
};

export interface TranslationResult {
  text: string;
  isCached: boolean;
}

/**
 * Translate a single text using Google Translate API with caching
 */
export async function translateText(
  text: string,
  targetLanguage: string = 'ar',
  sourceLanguage: string = 'en'
): Promise<TranslationResult> {
  // If target is English, return original text
  if (targetLanguage === 'en') {
    return { text, isCached: true };
  }

  const cacheKey = `${sourceLanguage}-${targetLanguage}-${text}`;

  // Check cache first
  if (translationCache[targetLanguage]?.[cacheKey]) {
    return {
      text: translationCache[targetLanguage][cacheKey],
      isCached: true
    };
  }

  try {
    // Call Google Translate API
    const result = await translate({
      text,
      source: sourceLanguage,
      target: targetLanguage
    });

    const translatedText = result.text;

    // Store in cache
    if (!translationCache[targetLanguage]) {
      translationCache[targetLanguage] = {};
    }
    translationCache[targetLanguage][cacheKey] = translatedText;

    return {
      text: translatedText,
      isCached: false
    };
  } catch (error) {
    console.error(`Translation error for "${text}":`, error);
    // Return original text if translation fails
    return { text, isCached: false };
  }
}

/**
 * Translate multiple texts in batch (more efficient than individual calls)
 */
export async function translateTexts(
  texts: string[],
  targetLanguage: string = 'ar',
  sourceLanguage: string = 'en'
): Promise<TranslationResult[]> {
  // Filter out empty strings and English target language
  if (targetLanguage === 'en') {
    return texts.map(text => ({ text, isCached: true }));
  }

  try {
    const results = await Promise.all(
      texts.map(text => translateText(text, targetLanguage, sourceLanguage))
    );
    return results;
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts.map(text => ({ text, isCached: false }));
  }
}

/**
 * Clear translation cache (useful for testing or refreshing)
 */
export function clearCache(language?: string) {
  if (language) {
    translationCache[language] = {};
  } else {
    Object.keys(translationCache).forEach(lang => {
      translationCache[lang] = {};
    });
  }
}

/**
 * Pre-translate common UI strings when switching language
 */
export async function prefetchCommonTranslations(targetLanguage: string = 'ar') {
  if (targetLanguage === 'en') return;

  const commonStrings = [
    'Dashboard',
    'Settings',
    'Technician Tracking',
    'Work Orders',
    'Services & Pricing',
    'Reports',
    'Mission Control',
    'Real-time facility management overview',
    'Active Orders',
    'Completed This Week',
    'Active Technicians',
    'Weekly Revenue',
    'Customer Satisfaction',
    'Avg. Resolution Time',
    'Language',
    'Theme',
    'Dark Mode',
    'Light Mode',
    'Loading',
    'System Online',
    'Logout'
  ];

  console.log(`Prefetching ${commonStrings.length} translations to Arabic...`);
  await translateTexts(commonStrings, targetLanguage);
  console.log('Prefetch complete!');
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats() {
  const stats = {
    totalCached: 0,
    byLanguage: {} as { [key: string]: number }
  };

  Object.entries(translationCache).forEach(([lang, cache]) => {
    const count = Object.keys(cache).length;
    stats.byLanguage[lang] = count;
    stats.totalCached += count;
  });

  return stats;
}
