# WoC Deployment & Version Control Workflow

## 🚀 Core Principle
**Web deployment is triggered via GitHub Push to Vercel, NOT Firebase Deploy.**

- **Firebase**: Used ONLY for Firestore database and Storage rules.
- **Vercel**: Used for hosting `woc.today` and automatically builds/deploys on `git push origin master`.

---

## 🛠️ Step-by-Step Workflow

### 1. Local Verification
Before pushing, ALWAYS ensure the project builds successfully.
```powershell
npm run build
```
*If this step fails, Vercel deployment will also fail.*

### 2. Version Control (Git)
1. **Stage Changes**: Support PowerShell path quoting.
   ```powershell
   git add "src/app/(world)/social/page.tsx"
   ```
2. **Commit**: Keep messages descriptive.
   ```bash
   git commit -m "fix: logic for social filtering"
   ```
3. **Deploy**: Push to the master branch.
   ```bash
   git push origin master
   ```

### 3. Monitoring
Check the [Vercel Dashboard](https://vercel.com/stonehong1-ops/woc-platform) to verify the build is progressing.

---

## 🚑 Troubleshooting

### Git Lock Issues (`index.lock`)
If you see `fatal: Unable to create '.../index.lock': File exists`, run:
```powershell
Get-Process git | Stop-Process -Force ; Remove-Item -Force .git\index.lock
```

### Config Protection
- **DO NOT** add `"hosting":` to `firebase.json` unless migrating away from Vercel.
- **DO NOT** set `output: 'export'` in `next.config.js` unless doing a static-only site.

---
*Created by Antigravity - 2026-04-17*
