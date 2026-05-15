# Checkout Integration Plan (Shop, Rental, Stay, Class)

## Overview
This document outlines the standardized checkout flow across all major modules in the WoC platform: Shop, Rental, Stay, and Class (Daily Booking). The goal is to unify the user experience and codebase by leveraging shared components and centralized logic.

## Core Components

### 1. `UnifiedCheckoutModal`
A reusable 3-step modal component (`components/common/UnifiedCheckoutModal.tsx`) that handles the visual flow of the checkout process.
- **Step 1: Summary**
  - Displays item details (Image, Title, Options/Role, Date, Price).
  - Collects additional options if needed (e.g., Leader/Follower for Class, Options for Shop).
  - Triggers the `onCheckout` callback.
- **Step 2: Payment (Bank Transfer)**
  - Displays the bank account details of the host.
  - User confirms they have transferred the amount by clicking "I Have Transferred".
  - Triggers the `onReportPayment` callback.
- **Step 3: Complete**
  - Shows a success message.
  - Explains that the booking/order is now "Waiting Confirmation" until the host verifies the payment.

### 2. `useBookingEngine`
A centralized hook (`hooks/useBookingEngine.ts`) that manages the backend logic for all domains.
- **`createBooking`**: Creates a new record in the `bookings` collection with `status: 'PENDING'`. Sends an initial chat notification to the host. Returns the `bookingId`.
- **`reportPayment`**: Updates the booking status to `WAITING_CONFIRMATION`. Creates notifications for the user and a Todo for the host. Sends a "Payment Reported" chat message to the host.
- **`confirmBooking`**: Called by the host to confirm the booking. Updates status to `CONFIRMED`.

## Domain-Specific Implementation

### A. Class (Daily Booking)
- **Trigger**: "Book Now" button on the class card (only visible if `isDailyBookingOpen` is true).
- **Data Payload**: `role` (Leader/Follower), `classDate`.
- **Pricing**: `dailyClassPrice` or a calculated fallback (`Math.floor(price / 4) + 5000`).
- **Integration**: Uses `UnifiedCheckoutModal` directly within `ClassPortal.tsx`.

### B. Shop (Physical/Digital Goods)
- **Trigger**: "Purchase" or "Buy Now" button on the product page.
- **Data Payload**: Selected `options`, `quantity`, `shippingAddress`.
- **Integration**: Currently uses a slightly separate flow (`PurchaseFlow.tsx`).
- **Action Item**: Migrate `PurchaseFlow.tsx` to use `UnifiedCheckoutModal` to reduce code duplication, or ensure both share the exact same UI structure.

### C. Stay (Accommodation)
- **Trigger**: "Book Now" button after selecting dates and guests.
- **Data Payload**: `checkInDate`, `checkOutDate`, `guests` (adults, children).
- **Pricing**: Calculated based on nights and nightly rate.
- **Integration**: Will invoke `UnifiedCheckoutModal` with Stay-specific summary data.

### D. Rental (Space Rental)
- **Trigger**: "Request to Book" after selecting time slots.
- **Data Payload**: `rentalDate`, `startTime`, `endTime`, `purpose`.
- **Pricing**: Calculated based on total hours and hourly rate.
- **Integration**: Will invoke `UnifiedCheckoutModal` with Rental-specific summary data.

## Next Steps
1. **Verify Class Daily Booking**: Ensure the current implementation in `ClassPortal.tsx` correctly passes the `orderId` between steps and triggers the correct chat notifications.
2. **Migrate Shop**: Refactor the Shop module to utilize `UnifiedCheckoutModal`.
3. **Implement Rental & Stay**: Apply the same `UnifiedCheckoutModal` + `useBookingEngine` pattern to Rental and Stay modules.
