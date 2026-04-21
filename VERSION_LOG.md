# WoC Project Version Log

This log tracks stable versions for the 4.18 Venture Round sprint.
Rollback Goal: Under 10 minutes (Git Tag + Vercel Promote).

| Version | Date | Status | Git Tag | Description | Vercel URL |
|---------|------|--------|---------|-------------|------------|
| **v2.1.1** | 2026-04-21 | ✅ Stable | `v2.1.1` | Baseline: Rules & Env Sync | https://www.woc.today |
| **v2.0.0** | 2026-04-17 | ✅ Stable | `v2.0.0` | Major UI: Space (ex-Town) & Navigation restructure, Events stacking fix | https://www.woc.today |
| **v1.1.0** | 2026-04-16 | ✅ Stable | `v1.1.0` | Venues: City filter & Editorial Map | https://www.woc.today |
| **v1.0.0** | 2026-04-16 | ✅ Stable | `v1.0.0` | Initial production baseline | https://www.woc.today |

---

## 🛡️ Rollback Protocol
1. **Source Rollback**: `git checkout vX.X.0`
2. **Production Rollback**: Use Vercel Dashboard to "Promote" the previous stable deployment ID.
3. **Emergency**: Contact Antigravity with "Rollback to version X.X.0" command.
