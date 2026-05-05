# WoC Design Stability Guard (Locked UI States)

This document serves as the **Ground Truth** for the platform's UI architecture. Every agent MUST verify current tasks against these rules before modifying any code.

## 🛑 GLOBAL RULES
1. **Standard**: All sub-headers must follow the "Shop" dual-row standard (unless specified).
2. **Standard**: Registration buttons must be minimal `flex` rows integrated into the body, not separate containers.
3. **No Optimization**: Do not "refactor" or "clean up" HTML/CSS if it alters the visual structure.

---

## 🏗️ MODULE-SPECIFIC LOCKS

### 1. Class Module (`src/app/(nation)/class/page.tsx`)
- **Layout**: **STRICTLY LIST-BASED**. Vertical horizontal cards only. No Grids.
- **Sub-header**: 
  - NO Filters.
  - Left: Date Navigation (`< Month, Year >`).
  - Right: Sort Trigger ("By Classes" default).
- **Status**: LOCKED (As of 2026-05-04).

### 2. Shop Module (`src/app/(nation)/shop/page.tsx`)
- **Standard**: The benchmark for all sub-headers.
- **Layout**: Grid-based (2 columns) with premium thumbnails.
- **Status**: LOCKED.

### 3. Rental Module (`src/app/(nation)/rental/page.tsx`)
- **Parity**: Must be 1:1 with Shop sub-header.
- **Stats**: Lowercase label (e.g., "00 spaces").
- **Region**: Automatically linked to header.
- **Status**: LOCKED.

### 4. Resale & Groups
- **Registration**: Integrated Row style (Minimal text + Icon button).
- **Status**: LOCKED.

---

## 🛠️ HOW TO USE
- **Before Edit**: Read the corresponding section above.
- **If Conflict**: Ask the USER for explicit "Structure Change Approval" before proceeding.
- **Verification**: Post-edit diffs must be checked against these locks.
