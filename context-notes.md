# 📝 Group Member Management & Permission Localization Context Notes

## Architecture Decision & Context
1. **Existing Translation Mechanism**:
   - `LanguageContext.tsx` uses a centralized `dictionary` for `EN` and `KR` namespaces.
   - If a translation key does not exist inside the dictionary, the `t()` function safely falls back to outputting the key name itself.
   - The UI components (`GroupMemberManager.tsx` and associated sub-components) are already integrated with appropriate `t('group.stats')` invocations.
   - Thus, adding the missing translation keys inside `LanguageContext.tsx` is completely non-intrusive (0% risk of breaking UI layouts or React state logic).

2. **Keys Implemented**:
   - Tab Titles: `group.stats`, `group.owner`, `group.staff`, `group.instructor`, `group.member`
   - Sorting buttons: `group.recent_joined`, `group.recent_visit`
   - List helpers: `group.load_more_members`, `group.end_of_list`
   - Existing keys (Reused): `group.loading_members`, `group.no_members`

3. **Debugging Duplicate Properties**:
   - Issue: The TypeScript compiler failed during Next.js build due to duplicated keys (`group.loading_members` and `group.no_members`) inside the `LanguageContext.tsx` dictionaries.
   - Resolution: Searched the file using shell tools, identified the original declarations, and surgical-removed the duplicate property definitions from the newly added block. This resolved the compile error without breaking any existing usage of those terms.

4. **Deployment Strategy**:
   - Always run verification checks local builds before calling Vercel deployment.
   - Deploy to Vercel production with `npx -y vercel --prod --yes` immediately after successful verification, conforming to rules.
   - Verified that the deployment succeeded with exit code 0.
