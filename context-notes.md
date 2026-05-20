# 📝 Class Portal Modal Localization Context Notes

## Architecture Decision & Context
1. **Goal**: Align the daily/special class reservation checkout modal in `ClassPortal.tsx` with the platform's multi-language toggle system.
   - Maintain 0% design deviation on the UI layouts.
   - Inject localized language bindings for both English and Korean seamlessly.
   - Allow dynamic switching of the date formatter inside the subtitle based on the user's selected language setting.

2. **State Integration Strategy**:
   - `LanguageContext` already provides the custom dictionaries (`EN` & `KR`) with dedicated `class.booking_*` entries.
   - By updating `useLanguage()` inside `ClassPortal.tsx` to export `{ t, language }`, we gain instant access to the active locale value (`'EN'` or `'KR'`).
   - Using standard browser `toLocaleDateString` dynamic switching preserves structural alignment while delivering native localization.

3. **Verbatim Styling Retention**:
   - All nested layouts, icon elements (`material-symbols-outlined`), flex alignments, and dark mode classes remain unchanged to ensure absolute pixel-perfect visual stability.
