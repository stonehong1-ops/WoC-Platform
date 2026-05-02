# Resale UI & Process Updates

## Overview
This document tracks the updates made to the Resale module to maintain 0% design deviation and align its behavior and user experience with the Shop module.

## 1. List & Navigation (`ResalePage`)
- **Tab Menu Text:** Changed filter label from "all items" to "All".
- **Sort/Filter Line alignment:** Removed unnecessary icons from the sort dropdown and aligned the layout to match the shop list. Displayed the total count as "00 items" (e.g., `12 items`).
- **Wishlist/Add Tray (`ResaleWishlistTray`):** 
  - Integrated the Add button directly into the Wishlist Tray FAB.
  - Changed the simple `+` icon to an `ADD+` button (Text "ADD" alongside the plus icon).
  - Standardized the tray's state indicators to uppercase (e.g., `1 IN PROGRESS, 0 PENDING, 3 LIKED ITEMS`).

## 2. Item Detail Page (`ResaleItemDetail`)
- **Location Formatting:** Hardcoded display of "Gangnam" or "Seoul, Gangnam-gu" to universally display as "Seoul, Korea" matching the shop aesthetic.
- **Title Font Size:** Reduced the primary item title font size (`text-xl` -> `text-lg`) to match the visual scale of the `ProductDetail` from the Shop module.
- **Seller Profile Integration:** Wrapped the seller's name and icon with the `UserProfileClickable` component. Clicking now opens the global user profile popup.
- **Chat Process:** Unified the chat initiation process with the Shop:
  - Updates the product status to `pending`.
  - Automatically sends a predefined message containing the product name, price, and direct link.
  - Immediately opens the full-screen `ChatRoom` popup instead of an inline interface.

## 3. Purchase Flow (`ResalePurchaseFlow`)
- **Contact Number Input:** Changed the phone number field from an editable input to a read-only display field that pulls the verified phone number directly from the user's profile context.
- **Completion Actions:** Updated the post-purchase button text from "Go to Shopping" to "Go to Resale" to maintain module context.

## Design & Data Binding Principles
- **Zero Design Deviation:** Maintained original layouts and HTML hierarchies verbatim.
- **Data Binding Only:** Bound real-time Firestore data correctly to existing layouts without refactoring structure.
- **Functional Integrity:** Ensured full functionality of toggles, popups, and the chat feature without compromising the aesthetic.
