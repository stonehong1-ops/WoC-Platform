# WoC Platform Structure & Taxonomy Guide

This document outlines the finalized structure and taxonomy for the WoC (World of Community) platform.

## 1. Core Taxonomy Sections

The platform is organized into three primary high-level sections, as defined in our header and navigation systems.

### A. Tango World
Focuses on the core community infrastructure and news.
- **Home (`/home`)**: Dashboard and featured content.
- **Plaza (`/plaza`)**: Public square for broad interaction.
- **Venues (`/venues`)**: Physical locations (Shops, Studios, Academies, Clubs, Services).
  - *Management*: Includes an integrated management overlay for high-end editorial editing and deletion of community spaces.
- **Groups (`/groups`)**: Online community groups and forums.

### B. Activity
Focuses on dynamic social and educational experiences.
- **Events (`/events`)**: Festivals, marathons, and special one-off events.
- **Social (`/social`)**: Milongas, Practicas, and social gatherings.
- **Gallery (`/gallery`)**: Community photo gallery and media.
- **Class (`/class`)**: Lessons, workshops, and educational programs.

### C. Space (formerly Town)
Focuses on the secondary community utility and economy.
- **Shop (`/shop`)**: Commerce and marketplace for community items.
- **Resale (`/resale`)**: Second-hand market for gear and apparel.
- **Stay (`/stay`)**: Accommodations and lodging for community members.
- **Lost (`/lost`)**: Lost and found service.
- **Arcade (`/arcade`)**: Interactive games and community engagement features.

---

## 2. Directory Structure Mapping

The following folders in `src/app/(nation)` correspond to the routes above:

| Route Path | Folder Name | Section | Status |
| :--- | :--- | :--- | :--- |
| `/home` | `home` | Tango World | Active |
| `/plaza` | `plaza` | Tango World | Active |
| `/venues` | `venues` | Tango World | Active |
| `/groups` | `groups` | Tango World | Active |
| `/events` | `events` | Activity | Active |
| `/social` | `social` | Activity | Active |
| `/gallery` | `gallery` | Activity | New |
| `/class` | `class` | Activity | Active |
| `/shop` | `shop` | Space | Moved |
| `/resale` | `resale` | Space | Active |
| `/stay` | `stay` | Space | Moved |
| `/lost` | `lost` | Space | Active |
| `/arcade` | `arcade` | Space | Active |

---

## 3. UI Navigation Logic

### Header (`Header.tsx`)
- Uses a kinetic headline format: `Headline | Section`.
- Dynamically identifies the section based on the current path.
- Integrates the Global/National Location Selector.

### Navigation Drawer (`NavigationDrawer.tsx`)
- Groups links into the three core sections.
- Adheres to the "Tango Minimalist" design system.

### Footer (`Footer.tsx`)
- Provides quick access partitions for all key routes.
- Styled with tonal layering for visual hierarchy.

---

## 4. Design Rules
- **No-Line Rule**: Avoid using borders for separation. Use background shifts, shadows, and tonal depth.
- **Typography**: 
  - Headlines: `Manrope` (Next.js local font)
  - Body: `Inter` (Next.js local font)
- **Aesthetic**: "The Kinetic Gallery" - Minimalist, editorial, and premium.
