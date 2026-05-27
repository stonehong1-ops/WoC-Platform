<!-- 여백 및 패딩 불일치 페이지 전수조사 보고서 -->
# 📐 Spacing & Padding Consistency Audit Report

This audit report documents all padding and spacing deviations found across page components within the `src/app/` directory. The primary objective of this audit is to identify layout inconsistencies to align the codebase with the design standards of **World of Community (WoC)**.

## 📋 Standard Architecture References
- **Mobile Horizontal Padding Standard**: `px-4` (Standard layout boundary spacing)
- **Top Spacing Principle**: Consistent top padding/margin (`pt-`, `py-`, `mt-`) to prevent content overlap with the fixed headers or floating navigation bars.

---

## 🔍 Executive Summary of Deviations

### 1. Horizontal Spacing (`px-`) Deviations
Our scanning detected several pages that deviate from the standard `px-4` horizontal padding, causing horizontal grid misalignment.
- **`px-6` (Over-padded containers)**: Common in Admin panels, Profile page, Wallet, and Privacy Policy page.
- **`px-5` (Inconsistent grid margins)**: Found in Rental and Lost & Found register forms, Search results, and Review submission pages.
- **`px-3` (Too narrow margin)**: Mostly used in category chips, horizontal scroll zones, and lost item lists.

### 2. Header Top Spacing Discrepancies
Top paddings and margins relative to headers lack standard structure, which can cause content overlap or unnecessary blank space:
- **Zero top padding (`pt-0`)**: Used in immersive detail pages (e.g. Profile details, stay checkout completion) which is structurally intentional but requires cautious header overlay bindings.
- **Micro top padding (`pt-4`)**: Found in Banners, Admin panels, and Explore pages. Might hide text content under fixed layouts.
- **Heavy top padding (`pt-20` / `pt-12`)**: Used in others admin panel and wallet pages to push down content.

---

## 📂 Detailed File Breakdown

### Category A: Horizontal Spacing (`px-`) Mismatches

#### 1. Admin Features (Using `px-6` instead of `px-4`)
- **`src/app/admin/banners/page.tsx`** (Line 137)
  ```tsx
  <main className="max-w-[896px] mx-auto px-6 pt-4 pb-24 space-y-6">
  ```
  *Impact*: Over-padded boundary on mobile. Admin screens should align with the global wrapper width or standard padding.
  
- **`src/app/admin/others/page.tsx`** (Line 117)
  ```tsx
  <main className="pt-20 pb-12 px-6">
  ```
  *Impact*: Misaligned with standard mobile views.

- **`src/app/admin/people/page.tsx`** (Line 111)
  ```tsx
  <main className="max-w-[896px] mx-auto px-6 pt-4 pb-24 space-y-element-gap">
  ```
  *Impact*: Margin misalignment with standard user list containers.

#### 2. Registration & Submission Pages (Using `px-5` instead of `px-4`)
- **`src/app/groups/[id]/review/page.tsx`** (Line 78 & Line 124)
  ```tsx
  Line 78: <main className="flex-1 px-5 md:px-16 pt-8 pb-40 max-w-2xl mx-auto w-full">
  Line 124: <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-surface-variant/20 px-5 md:px-16 py-4">
  ```
  *Impact*: Horizontal grid jumps slightly when navigating to the review page or when looking at the bottom action bar.

- **`src/app/lost/register/page.tsx`** (Line 145)
  ```tsx
  <form onSubmit={handleSubmit} className="px-5 mt-4 space-y-6">
  ```
  *Impact*: The form container uses `px-5`, causing visual jump compared to header wrapper (`px-4`).

- **`src/app/rental/register/page.tsx`** (Line 148)
  ```tsx
  <form onSubmit={handleSubmit} className="px-5 mt-4 space-y-6">
  ```
  *Impact*: Same layout jump as the Lost & Found registration form.

#### 3. Core Directory & Dashboard Pages
- **`src/app/hub/page.tsx`** (Lines 21, 39, 88, 102)
  ```tsx
  Line 21: <div className="container mx-auto px-6 relative z-10">
  Line 39: <section className="py-24 container mx-auto px-6">
  Line 88: <div className="container mx-auto px-6 mb-12 flex justify-between items-end">
  Line 102: <div className="flex gap-6 px-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
  ```
  *Impact*: The Hub screen uses `px-6` throughout the page, causing a visual widening shift compared to the header and standard pages.

- **`src/app/profile/page.tsx`** (Line 43 & Line 58)
  ```tsx
  Line 43: <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
  Line 58: <main className="max-w-3xl mx-auto px-6 py-6 md:py-8">
  ```
  *Impact*: User profiles stand out visually with `px-6` padding, breaking standard screen margins.

- **`src/app/search/page.tsx`** (Lines 43, 68, 86, 95, 112, 121, 141, 150)
  ```tsx
  Line 43: <div className="px-5 pt-4 pb-4 bg-surface z-40 border-b border-on-surface/5 shrink-0">
  Line 68: <div className="px-5 mt-6 mb-8">
  Line 150: <div className="flex flex-col gap-3 px-5">
  ```
  *Impact*: The search dashboard implements `px-5` uniformly for all components, creating a visual discrepancy where other sections align to `px-4`.

- **`src/app/wallet/page.tsx`** (Line 104 & Line 134)
  ```tsx
  Line 104: <div className="px-6 pt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
  Line 134: <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 snap-x">
  ```
  *Impact*: Using `px-6` and negative margin `-mx-6` shifts the container border outward on mobile.

#### 4. Narrow Spacing (Using `px-3`)
- **`src/app/lost/page.tsx`** (Line 148)
  ```tsx
  <div className="w-full bg-white border-b border-slate-100/50 px-3 py-2 flex flex-col gap-3">
  ```
- **`src/app/people/page.tsx`** (Lines 35 & 94)
  ```tsx
  Line 35: <div className="w-full px-3 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
  Line 94: <div className="mx-4 my-3 px-5 py-3 flex items-center justify-between bg-white rounded-xl border border-slate-100 shadow-sm">
  ```
- **`src/app/plaza/page.tsx`** (Lines 82 & 102)
  ```tsx
  Line 82: <div className="w-full px-3 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
  Line 102: <div className="w-full py-2.5 px-3 flex items-center gap-4 overflow-x-auto no-scrollbar bg-[#FAF8FF]/50">
  ```
  *Impact*: Mostly used inside lists or horizontal scrolling filters. While scroll indicators are allowed to bleed out, inner card layouts should be reviewed.

---

### Category B: Header Top Spacing (`pt-` / `py-` / `mt-`) Mismatches

#### 1. Pages with Dangerously Low Spacing (`pt-4` or `pt-2`)
These pages risk colliding with the main floating/fixed header layout if a global wrapper does not reserve space:
- **`src/app/admin/banners/page.tsx`** (Line 137) - `pt-4`
- **`src/app/admin/people/page.tsx`** (Line 111) - `pt-4`
- **`src/app/explore/page.tsx`** (Line 17 & Line 19) - Main wrapper uses `pt-4`, Header uses `pt-2`
- **`src/app/search/page.tsx`** (Line 43) - Search header has `pt-4`

#### 2. Pages with Generous Spacing (`pt-20` or `pt-12`)
These pages intentionally offset the content below a fixed global header:
- **`src/app/admin/others/page.tsx`** (Line 117) - `pt-20`
- **`src/app/wallet/page.tsx`** (Line 104) - `pt-12`

#### 3. Pages with Zero Top Spacing (`pt-0`)
Designed for an immersive cover image layout (header overlaps the background):
- **`src/app/people/[id]/page.tsx`** (Line 79) - `pt-0`
- **`src/app/pics/page.tsx`** (Line 119) - `pt-0`

---

## 💡 Recommendations for Harmonization

1. **Horizontal Alignment (`px-4`)**:
   - Update `px-6` containers to `px-4` on core user-facing flows (Profile, Wallet, Hub) to create uniform boundaries.
   - Standardize `px-5` on forms (Lost Register, Rental Register, Reviews, Search page) to `px-4` to match standard typography lines.
   - Keep `px-3` or custom margin parameters ONLY for card inner elements or edge-to-edge scrolling slider chips.

2. **Top Spacing Layout Class**:
   - Establish a standard class helper or constant header-safe spacing variable (e.g. `pt-[56px]` or `pt-[64px]` based on standard header height) for any layouts using fixed headers.
   - Standardize admin panels to use identical layouts (`pt-20` or `pt-16`).

---

*Note: As per strict instructions, no modifications have been made to any source files listed in this report. This report is for planning and audit review only.*
