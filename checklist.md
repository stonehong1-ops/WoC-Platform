# 📋 Class Portal Modal Localization Checklist

## 1. Context Localization State Integration
- [x] Verify new translation keys inside `src/contexts/LanguageContext.tsx`.
  - [x] Confirm `class.booking_special_title`, `class.booking_daily_title`, `class.select_role`, `class.booking_notice_title`, `class.booking_notice_desc`, `class.submit_request` keys exist.
- [x] Update `src/components/class/ClassPortal.tsx` to retrieve the `language` value from `useLanguage()`.

## 2. Modal Verbatim Translation Binding
- [x] Bind dynamic dictionary values to elements in `UnifiedCheckoutModal` within `ClassPortal.tsx`.
  - [x] Replace `title` field mapping with `booking_special_title` and `booking_daily_title`.
  - [x] Replace `subtitle` date formatter locale with `language === 'KR' ? 'ko-KR' : 'en-US'`.
  - [x] Replace `buttonText` with `class.submit_request`.
  - [x] Replace "Select Role" heading text with `class.select_role`.
  - [x] Replace "Notice" title with `class.booking_notice_title`.
  - [x] Replace notice paragraph text with `class.booking_notice_desc`.

## 3. Pre-Flight Verification & Quality Control
- [x] Perform local compilation check (`npm run build`).
- [x] Confirm no trailing colons (`:`) exist in Korean translation mappings or logs.

## 4. Production Deployment & Live Report
- [x] Deploy updated code to live production using Vercel (`npx -y vercel --prod --yes`).
- [x] Verify live site functionality and retrieve the deployment credentials.
- [x] Deliver the Deployment ID, exit code, and live URL to Stony.
