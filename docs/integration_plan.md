# Unified Booking & Inquiry Flow (Shop, Rental, Stay, Class)

## 1. Context and Problem Statement
Currently, the World of Community (WoC) platform features 4 primary transaction/inquiry domains: `Shop`, `Rental`, `Stay`, and `Class`. Due to the lack of an integrated PG (Payment Gateway) for card processing, all transactions on the platform must be processed via manual bank transfers (무통장 입금). 

Previously, each module implemented its own flow:
- **Shop (`PurchaseFlow.tsx`)**: 3-step checkout (Order Summary -> Bank Transfer Instruction with Timer -> Order Completed + Chat Notification).
- **Rental (`RentalRequestFlow.tsx`)**: Form-based request -> Chat Inquiry.
- **Stay (`StayDetail.tsx`)**: Calendar selection -> Chat Inquiry.
- **Class (`ClassPortal.tsx` / `UnifiedCheckoutModal.tsx`)**: Direct request creation, but currently abruptly closes the modal instead of proceeding to the payment instructions.

## 2. The Unified Flow Objective
To standardize the user experience and ensure consistency across the platform, all transactional domains must utilize the **3-Step Unified Checkout Flow**. This flow handles the lack of automated card payments by incorporating a manual bank transfer step directly into the user journey before completing the request.

## 3. The 3-Step Architecture
We will leverage `UnifiedCheckoutModal.tsx` and `useBookingEngine.ts` as the central orchestrators.

### Step 1: Summary & Request (`'summary'`)
- User reviews their selected item (product, rental slot, stay dates, class role).
- User confirms the total price.
- **Action**: Clicking "Order Now" or "Submit Request" triggers the `createBooking` hook. The system creates a `PENDING` booking in Firestore.

### Step 2: Payment Instruction (`'payment'`)
- The modal transitions to the payment step.
- Displays **Bank Transfer Details** (Bank name, Account Number, Account Holder).
- Displays an **Order Number** for reference.
- Starts a **1-Hour Countdown Timer**, indicating urgency.
- **Action**: User manually transfers the money via their banking app, then clicks "I've Transferred the Payment". This triggers `reportPayment`, updating the booking status to `WAITING_CONFIRMATION`.

### Step 3: Notification & Completion (`'complete'`)
- The modal shows a "Request Completed!" success screen.
- **Backend Action**: The `reportPayment` hook automatically sends a notification/todo to the Host/Seller, and optionally triggers a Chat Room injection if direct communication is required (as in the Shop).
- **Action**: User clicks "Done" to close the modal.

## 4. Implementation Details for Class Booking (`ClassPortal.tsx`)
The current bug in `ClassPortal.tsx` is caused by `handleCheckoutSubmit` calling `setCheckoutModalOpen(false)` immediately after `createBooking`, bypassing the 'payment' and 'complete' steps in `UnifiedCheckoutModal.tsx`.

**Fixes Required:**
1. Update `handleCheckoutSubmit` to return the `bookingId` from `createBooking` and **remove** `setCheckoutModalOpen(false)`.
2. Pass `bankDetails` to `UnifiedCheckoutModal`. (Since bank details might be global or host-specific, we'll provide placeholder/global ones if host-specific ones aren't available).
3. Pass `onReportPayment` to `UnifiedCheckoutModal` by importing and using the `reportPayment` function from `useBookingEngine`.
4. Ensure the completion step displays properly and only closes the modal when the user clicks "Done".

This standardization achieves the "Zero Design Deviation" policy while fully resolving the checkout bug and unifying the data pipeline.
