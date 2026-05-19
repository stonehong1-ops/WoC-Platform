# 📋 Plaza (Feed) UI & Functional Cleanups Checklist

## 1. Plaza Feed Post Nickname & User Identification
- [x] Update `FeedPostCard.tsx`'s UserBadge invocation: remove the `hidden` class from `nativeClassName` and add elegant spacing styling.
- [x] Update `FeedPostCard.tsx` Standard/Image Style: remove the redundant username `<span>` in the post content description paragraph.

## 2. Layout Alignment & Card Separation
- [x] Update `FeedPostCard.tsx`'s `<article>` root classes for standard, announcement, and short-text/quote layouts to include horizontal margins `mx-4` and bottom separation margins `mb-4`.
- [x] Wrap post cards in elegant borders (`border border-outline-variant/30`) with rounded corners (`rounded-2xl`) and shadow (`shadow-sm`) to match the compose bar styling exactly.

## 3. Inline Counters & Stats Integration
- [x] Modify Action Bar in `FeedPostCard.tsx` to render real-time like counts directly next to the Like (reaction) button inside the button label.
- [x] Modify Action Bar in `FeedPostCard.tsx` to render comment counts directly next to the Chat/Comment button inside the button label.
- [x] Remove the redundant secondary statistics counts container row from all standard, announcement, and short-text/quote templates.

## 4. Text Readability & "more" Folding
- [x] Implement local state `isExpanded` and a robust string-truncation helper inside `FeedPostCard.tsx`.
- [x] Truncate posts longer than 180 characters or 5 lines of text, rendering a clickable English inline `...more` button to expand post contents dynamically.
- [x] Increase post body text font size to `text-[16px]` (previously `text-[15px]`) inside both standard and announcement layouts for enhanced readability.

## 5. Robust Bookmark & UI Flow Fixes
- [x] Modify `feedService.ts`'s `togglePinPost` to use `setDoc(..., { merge: true })` instead of `updateDoc` to allow creation of user documents dynamically.
- [x] Modify `feedService.ts`'s `togglePinUser` to use `setDoc(..., { merge: true })` instead of `updateDoc`.
- [x] Update `AuthProvider.tsx` to initialize empty arrays for `pinnedPostIds`, `interactedUserIds`, and `pinnedUserIds` inside the fallback auth state object.
- [x] Prevent 2-line wrapping for like/comment inline counts in `FeedPostCard.tsx` by applying `whitespace-nowrap`.
- [x] Add non-logged-in user error guard for bookmark clicks in `FeedPostCard.tsx` showing a prompt alert.

## 6. Build and Deploy Verification
- [ ] Run `npm run build` locally to verify TypeScript types, lint standards, and build stability.
- [ ] Deploy to Vercel production environment (`npx -y vercel --prod --yes`).
- [ ] Confirm deployment URL, deployment ID, and exit status to the user.

