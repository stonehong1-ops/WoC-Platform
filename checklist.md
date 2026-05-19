# 📋 Venues Map & Component Page Localization Checklist

## 1. Dictionary Extension in LanguageContext
- [x] Add translation keys for the venues map UI to the EN dictionary in `src/contexts/LanguageContext.tsx`.
- [x] Add translation keys for the venues map UI to the KR dictionary in `src/contexts/LanguageContext.tsx`.

## 2. Venues Page Localization Hook Integration
- [x] Inject `useLanguage` hook and dynamic `t` function into `src/app/venues/page.tsx`.
- [x] Replace hardcoded text strings in `src/app/venues/page.tsx` (`confirm`, `alert`, `loadError`) with `t()`.

## 3. MapComponent Localization Hook Integration
- [x] Inject `useLanguage` hook and dynamic `t` function into `src/components/venues/MapComponent.tsx`.
- [x] Update static categories array rendering using `t('venues.cat_' + cat.toLowerCase())` (with fallback logic for `All`).
- [x] Replace hardcoded map controls, brand filter panels, and venue list elements (`IN VIEW`, `Filter by Brand`, `Search venue..`, `no social today`, `No venues in this area`) with localized translation calls.

## 4. Build & Local Verification
- [ ] Run `npm run build` locally in the workspace to confirm zero TypeScript compilation errors.
- [ ] Verify that all UI elements render beautifully with zero design deviation.

## 5. Production Deployment & Live Report
- [ ] Deploy the validated codebase to Vercel production using `npx -y vercel --prod --yes`.
- [ ] Capture the deployment ID, exit code, and live URL.
- [ ] Report the production link to Stony for final testing.
