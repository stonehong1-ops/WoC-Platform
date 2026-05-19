# 📝 Group Shell Header Switch & Leave Group Modal Localization Context Notes

## Architecture Decision & Context
1. **Goal**: Resolve the hardcoded English texts in the Group Shell Header dropdown menu and the Group Exit (Leave Group) Modal in order to support multi-language translation.
   - Maintain 0% design deviation on Stitch design tokens and gradient shell layouts.
   - Inject the central `useLanguage` hook robustly into `src/components/groups/shell/GroupShellHeader.tsx` and `src/components/groups/GroupHome.tsx`.

2. **Root Cause**:
   - The dropdown menu elements in the navigation shell header and the confirmation popup rendered when a user attempts to leave a group were both implemented with hardcoded English string literals.
   - They did not utilize the internationalization hook `useLanguage` or the translation mapping function `t()`.

3. **Proposed Fix**:
   - Extend the core dictionaries in `src/contexts/LanguageContext.tsx` to incorporate necessary dictionary mapping keys for both the group shell header ("Exit", "Current Group", "Switch to", "Leave Group") and the exit modal ("Leave Group", "Are you sure you want to leave this group?", "Stay", "Leave").
   - Replace the static text labels with `t()` calls in the target JSX trees.

4. **Implementation Details**:
   - Ensure the `useLanguage` hook is correctly declared in each file.
   - Verify that all visual structures, styles, and click handlers remain identical.

5. **Deployment & Verification**:
   - Local Next.js build completed with Exit Code 0.
   - Production deployment successfully published on Vercel.
   - Live URL: https://www.woc.today / https://woc-platform-j52vds150-stonehong1-8062s-projects.vercel.app
   - Deployment ID: dpl_7zE4BtvqG65bVfVoJRPfgNRJ6mpN
