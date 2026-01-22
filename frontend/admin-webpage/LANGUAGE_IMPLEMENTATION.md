# Language & Settings Implementation Guide

## Overview
A complete language switching system has been added to the DeepCognix Facility Management Dashboard, allowing users to switch between English and Arabic with automatic UI translation.

## Components Created

### 1. **LanguageContext.tsx** (`src/app/context/LanguageContext.tsx`)
- Manages global language state (English/Arabic)
- Provides `useLanguage()` hook for accessing translations
- Uses React Context API for state management
- Includes `toggleLanguage()` function to switch between languages

### 2. **translations.ts** (`src/app/utils/translations.ts`)
- Centralized translation object containing English and Arabic translations
- Structure: `translations[language][translationKey]`
- Covers all major UI sections:
  - Navigation items
  - Dashboard elements
  - Settings
  - Common UI elements
  - KPI cards and charts

### 3. **SettingsView.tsx** (`src/app/components/SettingsView.tsx`)
- New settings page in the dashboard
- Features:
  - **Language Toggle Button**: Switch between English and Arabic
  - **Theme Settings**: Dark/Light mode toggle
  - **Information Card**: Explains language support and RTL handling

### 4. **Updated App.tsx**
Changes made:
- Added `LanguageProvider` wrapper around the app
- Imported `LanguageContext` and `SettingsView` component
- Added 'settings' to the View type
- Added Settings button to sidebar with active state styling
- Integrated `SettingsView` component rendering
- Updated date formatting to support Arabic locale

## How It Works

### Text Translation
```tsx
import { useLanguage } from '@/app/context/LanguageContext';

function MyComponent() {
  const { t } = useLanguage();
  
  return <h1>{t('dashboard.title')}</h1>; // Automatically translates
}
```

### Language State
```tsx
const { language, toggleLanguage } = useLanguage();

// language: 'en' or 'ar'
// toggleLanguage(): switches language
```

## Text-to-Arabic Conversion

The system uses a **dictionary-based approach** rather than automatic conversion:

### Why Dictionary-Based?
- **More Accurate**: Professional translations instead of machine conversion
- **Context-Aware**: Different English words can have different Arabic equivalents
- **Consistent**: Same terms always translate the same way
- **Maintainable**: Easy to update and audit translations

### Adding New Translations

1. Open `src/app/utils/translations.ts`
2. Add your translation key to both `en` and `ar` objects:
```tsx
export const translations = {
  en: {
    'new.key': 'English text',
    // ...
  },
  ar: {
    'new.key': 'النص العربي',
    // ...
  }
};
```

3. Use in components:
```tsx
const { t } = useLanguage();
<span>{t('new.key')}</span>
```

## Alternative: Automatic Translation Libraries

If you need automatic English-to-Arabic conversion, consider these npm packages:

1. **`translate-api`** - Simple API-based translation
```bash
npm install translate-api
```

2. **`google-translate-api-x`** - Google Translate API wrapper
```bash
npm install google-translate-api-x
```

3. **`bing-translate-api`** - Microsoft Bing translation
```bash
npm install bing-translate-api
```

Example usage:
```tsx
import translate from 'translate-api';

const arabicText = await translate({
  text: 'Hello World',
  from: 'en',
  to: 'ar'
});
```

## Features Included

✅ **Language Switching**: English ↔ Arabic toggle button
✅ **Persistent State**: Language choice maintained during session
✅ **RTL Support Ready**: Layout structure supports right-to-left text
✅ **Date Localization**: Dates automatically format in selected language
✅ **Comprehensive Translations**: 40+ UI elements translated
✅ **Easy to Extend**: Simple dictionary structure for adding more translations

## Using the Settings Section

1. **Access Settings**: Click the "Settings" button in the sidebar
2. **Change Language**: Click "Switch to العربية" or "Switch to English"
3. **Toggle Theme**: Switch between Light and Dark modes
4. **All text updates automatically**

## RTL Support

The current implementation is prepared for RTL (Right-to-Left) layout. To enable full RTL:

Add to your HTML element when Arabic is selected:
```tsx
<div dir={language === 'ar' ? 'rtl' : 'ltr'}>
  {/* Content */}
</div>
```

Or add a global style in your CSS:
```css
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}
```

## Future Enhancements

- [ ] Add RTL layout support for full Arabic experience
- [ ] Add more languages (French, Spanish, etc.)
- [ ] Persist language preference to localStorage
- [ ] Add language support to date/number formatting
- [ ] Implement automatic translation API integration
- [ ] Add language selector to login page
