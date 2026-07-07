# Referral System Implementation Tasks

## Task 1: Validate Existing Database Schema

Verify the referrals table exists in the schema with all required columns and indexes. Ensure users table has referralCode, referredBy, referralCount, and referralEarningsDot fields. Validate type exports (Referral, NewReferral) are available.

## Task 2: Implement Backend API - Referral Stats & List

Create/verify GET /api/referrals/my endpoint that returns user's referral stats, list of referrals with referee info, and pagination metadata. Include status filtering and proper authorization checks. Must return within 500ms.

## Task 3: Implement Backend API - Leaderboard

Create/verify GET /api/referrals/leaderboard endpoint that returns top referrers ranked by completed referrals and earned rewards. Include user's own rank in response. Support pagination with limit/offset params. Cache results for performance.

## Task 4: Implement Backend API - Validate Referral Code

Create/verify GET /api/referrals/:code endpoint that validates and returns referral code info for sign-up flow. Returns 404 if code invalid. Must be public (no auth required) and complete within 100ms.

## Task 5: Implement Backend API - Claim Reward

Create/verify POST /api/referrals/claim/:id endpoint that claims reward for completed referral. Updates referral status to "rewarded", credits wallet, and sends notification. Implements idempotency via rewardClaimed flag. Handle authorization (403) and status validation (409).

## Task 6: Implement Backend API - Generate Referral Code

Create/verify POST /api/referrals/generate endpoint for users to generate replacement referral codes. Implement rate limiting (max 1 per week). Returns new code and generation timestamp.

## Task 7: Implement Sign-Up Integration

Ensure sign-up flow accepts optional ?ref=CODE query parameter. Validate code format and create referral record in referrals table if valid. Increment referrer's referralCount. Send notification to referrer. Display confirmation message after registration.

## Task 8: Implement Frontend API Client

Create/verify src/api/referrals.ts with typed functions for all API endpoints:
- getMyReferrals(status?, limit?, offset?)
- getReferralLeaderboard(limit?, offset?)
- validateReferralCode(code)
- claimReferral(referralId)
- generateReferralCode()

All functions should have proper error handling and TypeScript types.

## Task 9: Implement Frontend Hooks

Create/verify src/hooks/use-referrals.ts with custom hooks:
- useMyReferrals(filters?) - with caching and refetch
- useReferralLeaderboard() - with pagination support
- useClaimReferral(referralId) - handles loading/error states
- useValidateReferralCode(code) - used during sign-up

All hooks should use React Query/SWR for data fetching and caching.

## Task 10: Implement Referral Dashboard - My Referrals Tab

Create/verify src/routes/_authenticated/referrals.tsx with:
- Referral code display section with copy button
- Referral stats cards (total, pending, completed, rewards)
- Referral list table/cards with pagination
- Filter options (status, sort)
- Empty state for new users
- "Claim Reward" buttons for completed referrals
- Loading states and error handling

Use existing components: Card, Badge, Button, Table, Dialog, Input.

## Task 11: Implement Referral Dashboard - Leaderboard Tab

Add leaderboard tab to referrals page with:
- Ranked list of top referrers
- User's own rank highlighted
- Columns: Rank, Name, Total Referrals, Completed, Earned Rewards
- Pagination support (20 per page)
- Responsive layout for mobile/desktop
- Refresh button with last-updated timestamp
- Privacy-aware anonymization for restricted users

## Task 12: Implement Claim Reward Dialog & Flow

Add claim reward confirmation dialog that:
- Shows referral details and reward amount
- Asks user to confirm
- Shows loading state during claim
- Displays success/error messages
- Updates referral status in real-time
- Sends notification on success

## Task 13: Implement Sign-Up Flow Integration

Update sign-up page to:
- Accept and display ?ref=CODE parameter
- Show referrer name and referral benefit message
- Validate code format with useValidateReferralCode hook
- Display "Signing up with [Referrer]'s code" messaging
- Show confirmation after registration completes
- Allow invalid codes to proceed without error

## Task 14: Add Referral Code Copy Functionality

Implement copy-to-clipboard functionality with:
- "Copy Code" button that copies bare referral code
- "Copy Link" button that copies full https://dotlive.africa/join?ref=CODE URL
- Toast notifications showing "Copied!" feedback
- Accessible keyboard support

## Task 15: Integrate Referral Notifications

Ensure notifications are sent for:
- New referral sign-up: "[Referee] joined DOT using your referral code!"
- Milestone completion: "[Referee] reached Vantage 100! You earned 10 DOT."
- Reward claimed: "You claimed 10 DOT from [Referee]'s referral!"
- All notifications link to /referrals dashboard with referralId query param

Integrate with existing notification system (in-app notifications).

## Task 16: Implement Referral Status Tracking & Auto-Completion

Ensure backend automatically updates referral status when referee reaches milestone (Vantage >= 100). Implement via:
- Background job/scheduled task, OR
- Trigger on Vantage score update, OR
- Periodic batch job checking completion criteria

Record completedAt timestamp and send notification when status changes.

## Task 17: Implement Anti-Abuse Measures

Implement fraud prevention:
- Self-referral prevention (referrerId != refereeId)
- Duplicate referral prevention (unique constraint)
- Rate limiting (max 10 referral sign-ups per day per referrer)
- Flag suspicious patterns (100+ referrals in 1 hour) for admin review
- Handle flagged referrals by freezing reward claims

## Task 18: Validate Build & TypeScript Compilation

Run `npm run build` and `cd dotlive-backend && npm run build` to verify:
- No TypeScript compilation errors
- All imports resolve correctly
- No ESLint warnings for new code
- All type exports work correctly
- Build completes within reasonable time

## Task 19: Validate Browser Testing

Test referral system in browser with test account:
1. Navigate to /referrals page
2. Copy referral code and verify it works
3. Copy referral link
4. Create new account with referral code
5. Verify referral appears in list with "pending" status
6. Manually update referee's Vantage to >= 100 (for testing)
7. Verify referral status changes to "completed"
8. Click "Claim Reward" and verify reward is claimed
9. Verify leaderboard displays top referrers
10. Check responsive layout on mobile
11. Verify all notifications appear
12. Test error cases (invalid codes, already claimed, etc.)

## Task 20: Verify Git Commit & Push

Verify implementation is properly committed:
1. Git branch created for referral system (not main/master)
2. All changes committed with message: "feat: implement Referral System (Session 11)"
3. Commit includes schema updates, API routes, frontend components, hooks
4. No secrets or .env files committed
5. Branch pushed to GitHub with proper tracking
6. Keep branch in working state (Lovable connected)

---

## Implicit Dependencies

- Task 2, 3, 4, 5, 6 (Backend) can be done in parallel
- Task 8, 9 depend on Tasks 2-6
- Task 10, 11 depend on Tasks 8, 9
- Task 12 depends on Task 10
- Task 13 depends on Tasks 8, 9
- Task 14, 15, 16, 17 can be done in parallel with Tasks 10-13
- Task 18 depends on all implementation tasks
- Task 19 depends on Task 18
- Task 20 depends on Task 19

## Summary

This spec implements the complete Referral System feature for Session 11, including:
- Database schema validation and type exports
- Backend API endpoints for all referral operations
- Frontend components and hooks
- Sign-up integration with referral codes
- Dashboard with leaderboard
- Reward claiming and wallet credit
- Notification integration
- Anti-abuse measures
- Build verification and browser testing
- Git commit and push
