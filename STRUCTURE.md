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
- **Social (`/social`)**: Milongas, Practicas, and social gatherings.
- **Class (`/class`)**: Lessons, workshops, and educational programs.
- **Events (`/events`)**: Festivals, marathons, and special one-off events.
- **Shop (`/shop`)**: Commerce and marketplace for community items.
- **Stay (`/stay`)**: Accommodations and lodging for community members.
- **Service (`/service`)**: Community-specific services and support.

### C. Town
Focuses on the secondary community utility and economy.
- **Resale (`/resale`)**: Second-hand market for gear and apparel.
- **Lost (`/lost`)**: Lost and found service.
- **Arcade (`/arcade`)**: Interactive games and community engagement features.

---

## 2. Directory Structure Mapping

The following folders in `src/app/(nation)` correspond to the routes above:

| Route Path | Folder Name | Section | Status |
| :--- | :--- | :--- | :--- |
| `/home` | `home` | Tango World | Active |
| `/plaza` | `plaza` | Tango World | Active |
| `/venues` | `venues` | Tango World | Active (Renamed from `map`) |
| `/groups` | `groups` | Tango World | Active (Renamed from `community`) |
| `/social` | `social` | Activity | Active |
| `/class` | `class` | Activity | Active |
| `/events` | `events` | Activity | Active |
| `/shop` | `shop` | Activity | Active |
| `/stay` | `stay` | Activity | Active |
| `/service` | `service` | Activity | New |
| `/resale` | `resale` | Town | Active |
| `/lost` | `lost` | Town | Active |
| `/arcade` | `arcade` | Town | Active |

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
