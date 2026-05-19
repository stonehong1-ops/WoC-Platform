# 📝 Venues Map & Component Page Localization Context Notes

## Architecture Decision & Context
1. **Goal**: Resolve the missing localization issue where map features and dashboard elements within the Venues section render untranslated hardcoded English text.
   - Maintain 0% design deviation on Stitch design tokens and map layouts.
   - Inject the central `useLanguage` hook robustly into `src/app/venues/page.tsx` and `src/components/venues/MapComponent.tsx`.

2. **Root Cause**:
   - Both `page.tsx` (alert, delete confirm messages, error states) and `MapComponent.tsx` (categories filter, search box placeholders, brand labels, empty states) did not utilize the internationalization hook `useLanguage` or the translation mapping function `t()`.
   - Consequently, when switching languages (e.g. to Korean), the entire map dashboard retained its English hardcoded strings.

3. **Proposed Fix**:
   - Extend the core dictionaries in `src/contexts/LanguageContext.tsx` to incorporate necessary dictionary mapping keys for the venues section.
   - Introduce `useLanguage` into both the root page component and the Google Map layout component.
   - Map keys gracefully, incorporating a custom fallback logic for dynamically rendered elements (like Categories list and active brand names).

4. **Implementation Details**:
   - For lists using dynamic keys like `categoriesList`, strings are converted into standardized format `t('venues.cat_' + cat.toLowerCase())` to dynamically select dictionaries.
   - Built fallback mechanisms so that unmapped categories or custom strings degrade gracefully to their raw English formats.
