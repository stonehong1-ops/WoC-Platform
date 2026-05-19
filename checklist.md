# 📋 Group Shell Header Switch & Leave Group Modal Localization Checklist

## 1. Dictionary Extension in LanguageContext
- [x] Add translation keys for the Group Shell Header (dropdown items) and Leave Group Modal to the EN dictionary in `src/contexts/LanguageContext.tsx`.
- [x] Add translation keys for the Group Shell Header (dropdown items) and Leave Group Modal to the KR dictionary in `src/contexts/LanguageContext.tsx`.

## 2. Group Shell Header Localization
- [x] Inspect existing `useLanguage` integration in `src/components/groups/shell/GroupShellHeader.tsx`.
- [x] Map hardcoded texts "Exit", "Current Group", "Switch to", and "Leave Group" in `src/components/groups/shell/GroupShellHeader.tsx` to `t()`.

## 3. Leave Group Modal Localization
- [x] Inspect existing `useLanguage` integration in `src/components/groups/GroupHome.tsx`.
- [x] Map hardcoded texts "Leave Group" (title), "Are you sure you want to leave this group?" (body), "Stay" (button), and "Leave" (button) in the modal rendering block of `src/components/groups/GroupHome.tsx` to `t()`.

## 4. Build & Local Verification
- [x] Run the project's build locally to confirm zero TypeScript compilation errors.
- [x] Verify that all UI elements render perfectly with 0% design deviation.

## 5. Production Deployment & Live Report
- [x] Deploy the validated codebase to Vercel production using `npx -y vercel --prod --yes`.
- [x] Capture the deployment ID, exit code, and live URL.
- [x] Report the production link to Stony for final testing.
