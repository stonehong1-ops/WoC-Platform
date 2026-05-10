# WoC (World of Community) Information Architecture Map

This document serves as the mandatory system map for the WoC platform. It includes all menus, registration forms, detail views, and popups. Antigravity MUST reference this file before any development task.

---

## 1. Global Navigation & Core Components

| Component | Path | Description |
| :--- | :--- | :--- |
| **Main Menu (Drawer)** | `src/components/layout/NavigationDrawer.tsx` | Slide-out navigation containing all platform modules. |
| **Global Header** | `src/components/layout/Header.tsx` | Sticky top bar with section titles, search, and location selector. |
| **Global Footer** | `src/components/layout/Footer.tsx` | Site-wide footer with quick links and legal information. |
| **Location Selector** | `src/components/layout/LocationSelector.tsx` | Popup to change global/national context (e.g., Global vs. Seoul). |
| **Auth System** | `src/components/auth/AuthModal.tsx` | Fullscreen modal for Login, Signup (Phone/Social), and Profile Setup. |
| **App Settings** | `src/components/layout/AppSettingsPopup.tsx` | Modal for language, notification, and display preferences. |
| **Notifications** | `src/components/layout/NotificationTray.tsx` | Right-side drawer for real-time alerts and activity history. |

---

## 2. Tango World (Core Infrastructure)

| Page / Component | Path | Type | Characteristics |
| :--- | :--- | :--- | :--- |
| **Home** | `/home` | Main Page | Dashboard featuring top banners, quick shortcuts, and community highlights. |
| **Home Popups** | `src/components/home/*Popup.tsx` | Popup | Event banners like `GaviCartoon`, `Music365`, `TangoHistory`. |
| **Plaza** | `/plaza` | Main Page | Public community feed for posts and interactions. |
| **Venues** | `/venues` | Main Page | Map and list view of physical locations (Studios, Clubs, Shops). |
| **Venue Details** | `/venues/[id]` | Full Page | Comprehensive info, photos, and services provided by a venue. |
| **People** | `/people` | Main Page | Directory of community members, instructors, and organizers. |
| **Shop** | `/shop` | Main Page | Official commerce marketplace for tango-related products. |
| **Product Details** | `src/components/shop/ProductDetailView.tsx` | Overlay | Slides in from right/bottom to show product specs and purchase options. |
| **Stay** | `/stay` | Main Page | Lodging and accommodation directory for community travelers. |
| **Stay Details** | `/stay/[id]` | Full Page | Room descriptions, amenities, and booking calendar. |
| **Stay Checkout** | `/stay/[id]/checkout` | Full Page | Multi-step reservation and payment flow. |

---

## 3. Activity (Dynamic Content)

| Page / Component | Path | Type | Characteristics |
| :--- | :--- | :--- | :--- |
| **Social** | `/social` | Main Page | List of Milongas and Practicas with location-based filtering. |
| **Social Register** | `SocialRegister.tsx` | Full Overlay | Registration form for new milongas/practicas (Organizer only). |
| **Social Details** | `SocialDetailView.tsx` | Full Overlay | Event info, DJ list, and entry fee details. |
| **Live** | `/live` | Main Page | Real-time streaming or status feed for community activities. |
| **Events** | `/events` | Main Page | Major events (Festivals, Marathons, Workshops). |
| **Event Register** | `EventRegister.tsx` | Full Overlay | Detailed registration for multi-day events. |
| **Class** | `/class` | Main Page | Educational directory for lessons and workshops. |
| **Class Register** | `ClassRegister.tsx` | Full Overlay | Form for instructors to post new classes or schedules. |
| **Groups** | `/groups` | Main Page | Community hub for clubs, teams, and interest groups. |
| **Group Details** | `GroupHome.tsx` | App-in-App | Standalone ecosystem within a group. See [iagroup.md](./iagroup.md) for detailed IA. |
| **Group Register** | `GroupRegister.tsx` | Full Overlay | Workflow to create a new community group. |
| **Group Editor** | `GroupEditor.tsx` | Full Overlay | Administrative panel for group metadata and settings. |
| **Group Accounts** | `GroupAccountEditor.tsx` | Modal | Financial configuration for group-owned bank accounts. |
| **Hub** | `/hub` | Main Page | Central node for interconnected community services and API links. |

---

## 4. Town (Utility & Economy)

| Page / Component | Path | Type | Characteristics |
| :--- | :--- | :--- | :--- |
| **Resale** | `/resale` | Main Page | P2P marketplace for second-hand tango shoes and clothes. |
| **Resale Register** | `ResaleRegister.tsx` | Full Overlay | Form to list used items with photo upload. |
| **Rental** | `/rental` | Main Page | Shared economy for shoes, clothes, or equipment. |
| **Lost & Found** | `/lost` | Main Page | Reporting system for lost items in venues or events. |
| **Wishlist Trays** | `src/components/*/WishlistTray.tsx` | Drawer | Mini-drawers for tracking items in Resale, Rental, and Shop. |

---

## 5. My Account & Admin

| Page / Component | Path | Type | Characteristics |
| :--- | :--- | :--- | :--- |
| **History** | `/history` | Main Page | User's activity log, including event participation and purchases. |
| **Wallet** | `/wallet` | Main Page | Financial dashboard for points, payments, and balances. |
| **Profile** | `/profile` | Main Page | User settings, bio, and role management (Instructor/Seller/Provider). |
| **Profile Popup** | `UserProfilePopup.tsx` | Modal | Quick view of another user's profile card. |
| **Admin Panel** | `/admin/*` | Admin Page | System management for People, Banners, and content moderation. |

---

## 6. IA Principles & Rules
1. **Full-Page Overlays**: Registration and Details are typically implemented as full-page overlays that hide the Global Header/Footer to maximize focus.
2. **Dynamic Binding**: Every page mapped here must bind to real-time Firebase data without altering the established Stitch design layout.
3. **Location Awareness**: All "Main Page" modules respond to the `LocationSelector` context.
