# Referral System Requirements

## Introduction

The Referral System enables users to earn rewards by referring new users to the DOT platform. Each user receives a unique referral code, and when they refer someone who completes onboarding milestones, both the referrer and referee receive rewards. The system tracks referral status from initial sign-up through completion and provides a dashboard for users to manage their referrals and track earnings.

## Glossary

- **Referrer**: A user who generates a referral code and shares it with potential new users
- **Referee**: A new user who signs up using someone else's referral code
- **Referral Code**: A unique alphanumeric code assigned to each user for sharing (format: 6-8 characters)
- **Vantage Score**: A metric measuring user activity/progress on the platform (milestone-based)
- **Referral Status**: The current state of a referral (pending, completed, rewarded)
- **Milestone**: Achievement point where referee becomes eligible for rewards (e.g., Vantage score >= 100)
- **Referral Dashboard**: User-facing interface showing their referral code, list of referrals, and earnings

## Requirements

### Requirement 1: Generate Unique Referral Codes

**User Story:** As a new user, I want to receive a unique referral code upon account creation, so that I can share it to refer others and earn rewards.

#### Acceptance Criteria

1. WHEN a new user completes account creation, THE Referral_System SHALL assign a unique alphanumeric referral code (6-8 characters, uppercase A-Z and 0-9)
2. WHEN a referral code is generated, THE Referral_System SHALL store it in the users table under referral_code column and ensure uniqueness via database constraint
3. THE referral code SHALL be automatically generated before the user is fully onboarded and SHALL be available immediately for sharing
4. IF a referral code generation fails (rare), THE system SHALL retry up to 3 times; IF all retries fail, log error and mark user for manual code assignment
5. WHEN a user logs in to their dashboard, THE Referral_System SHALL display their referral code prominently on the Referral Dashboard
6. THE referral code SHALL remain constant throughout the user's lifetime on the platform (immutable once assigned)

#### Success Metrics

- Referral codes generated within 500ms of account creation
- 100% uniqueness guarantee (no collisions)
- Code display loads within 200ms
- Zero failures in code generation for valid user accounts

---

### Requirement 2: Sign Up Using Referral Code

**User Story:** As a new user, I want to sign up using someone's referral code, so that both the referrer and I can earn rewards.

#### Acceptance Criteria

1. WHEN a user visits the sign-up page with a referral code query parameter (?ref=CODE), THE Referral_System SHALL validate the code format (6-8 alphanumeric uppercase)
2. IF the referral code is valid and exists in the users table, THE Referral_System SHALL store the code as referred_by in the new user's account during registration
3. WHEN registration completes with a valid referral code, THE Referral_System SHALL create a new record in the referrals table with:
   - referrerId: user ID of the code's owner
   - refereeId: newly created user ID
   - referralCode: the code provided
   - status: "pending"
   - createdAt: current timestamp
4. IF the referral code is invalid or does not exist, THE system SHALL allow registration to proceed but SHALL NOT create a referral record (no error shown to user)
5. IF the user is already logged in and tries to sign up again, THE system SHALL reject with "Already authenticated" message
6. WHEN a referral record is created, THE Referral_System SHALL send a notification to the referrer: "[Referee Name] joined DOT using your referral code"
7. THE referral_count field in the users table for the referrer SHALL be incremented by 1 atomically

#### Success Metrics

- Code validation complete within 100ms
- Referral record creation within 500ms
- Duplicate referrals prevented (same ref cannot sign up twice)
- Notification sent within 2 seconds
- referral_count stays synchronized with actual referrals table records

---

### Requirement 3: Track Referral Status (Pending to Completed)

**User Story:** As a referrer, I want to see the current status of my referrals, so that I understand if they've reached milestones and when I'll receive rewards.

#### Acceptance Criteria

1. THE Referral_System SHALL maintain referral status with values: "pending", "completed", "rewarded"
2. WHEN a referee's Vantage score reaches a milestone (≥100), THE Referral_System SHALL automatically update the referral record status from "pending" to "completed" via background job or trigger
3. WHEN a referral transitions from "pending" to "completed", THE system SHALL record the completedAt timestamp and send a notification to referrer: "[Referee Name] reached Vantage 100! Your referral is complete."
4. WHEN a referral is marked "completed", THE system SHALL calculate the reward amount (defined per platform policy, e.g., 10 DOT per completed referral) and add it to referrer's referral_earnings_dot column
5. IF a referee's Vantage score drops below the milestone threshold after reaching it, THE referral status SHALL remain "completed" (not revert to pending)
6. THE Referral_System SHALL display status on the Referral Dashboard with visual badges: "Pending" (yellow), "Completed" (green), "Rewarded" (blue)
7. WHEN viewing the Referral Dashboard, THE system SHALL show the referee's current Vantage score and milestone progress (e.g., "Vantage: 85/100")

#### Success Metrics

- Status updates within 1 second of milestone achievement
- All 50+ completed referrals display correctly per page
- Badge colors consistent across all UI surfaces
- Notifications sent within 2 seconds
- Referral earnings totals match sum of individual referral rewards

---

### Requirement 4: Display Referral Dashboard

**User Story:** As a user, I want to view my referral code, referral list, and earnings, so that I can track my referrals and manage my rewards.

#### Acceptance Criteria

1. WHEN an authenticated user navigates to /referrals, THE Referral_System SHALL display the Referral Dashboard with the following sections:
   - **Referral Code Section**: Large, prominently displayed referral code with copy button and "Link Generated" UI
   - **Referral Stats**: Total referrals count, pending count, completed count, pending rewards, claimed rewards
   - **Referral List**: Table/card layout with referee name, email, Vantage score, status, reward claimed status
   - **Copy Link Button**: Generates shareable link (e.g., https://dotlive.africa/join?ref=CODE) with "Copied!" feedback
   - **Rewards Info**: Clear explanation of reward structure (e.g., "10 DOT per completed referral")
2. WHEN the user clicks "Copy Code", THE system SHALL copy the referral code to clipboard and display brief success toast notification
3. WHEN the user clicks "Copy Link", THE system SHALL copy the full referral URL to clipboard and display brief success toast notification
4. THE Referral Dashboard SHALL display referrals paginated with 50 per page (default), support limit/offset query parameters
5. THE Referral Dashboard SHALL sort referrals by most recent first (createdAt descending)
6. THE dashboard SHALL include filter options: Status (Pending/Completed/Rewarded), Sort by (Date/Vantage/Name)
7. WHEN viewing the dashboard on mobile, THE system SHALL adapt the layout: stack sections vertically, simplify table to card view
8. IF a user has no referrals, THE dashboard SHALL display an empty state: "You haven't referred anyone yet. Share your code to start earning."

#### Success Metrics

- Dashboard loads within 1 second
- Copy-to-clipboard functions within 200ms
- Pagination supports 500+ referrals smoothly
- Responsive layout renders correctly on mobile/tablet/desktop
- Empty state displays gracefully with call-to-action

---

### Requirement 5: Manual Reward Claim

**User Story:** As a referrer, I want to claim my earned rewards from completed referrals, so that I can receive the DOT tokens into my wallet.

#### Acceptance Criteria

1. WHEN a referral reaches "completed" status, THE system SHALL mark it claimable (rewardClaimed flag remains false initially)
2. ON the Referral Dashboard, completed referrals without claimed rewards SHALL display a "Claim Reward" button
3. WHEN a user clicks "Claim Reward", THE Referral_System SHALL show a confirmation dialog: "Claim 10 DOT from this referral?"
4. WHEN the user confirms, THE system SHALL:
   - Update the referral's rewardClaimed flag to true
   - Record claimedAt timestamp (ISO 8601)
   - Add the reward amount to the user's wallet balance (direct credit to wallet.balance)
   - Update the referral status to "rewarded"
5. THE system SHALL ensure idempotency: claiming the same referral multiple times SHALL only credit once (checked via rewardClaimed flag)
6. WHEN reward is claimed, THE system SHALL send notification to referrer: "You claimed 10 DOT from [Referee Name]'s referral!"
7. THE Referral Dashboard SHALL update in real-time to show the reward has been claimed (button removed, status changes to "Rewarded")
8. IF wallet credit fails (rare), THE system SHALL queue the transaction for retry and notify the user of pending state

#### Success Metrics

- Reward claims processed within 1 second
- Wallet balances update correctly within 500ms
- Idempotency guaranteed (no double-crediting)
- Notifications sent within 2 seconds
- Transaction state is consistent (referral and wallet both updated or both reverted)

---

### Requirement 6: View Referral Leaderboard

**User Story:** As a user, I want to see the top referrers on the platform, so that I can understand how I'm performing relative to others.

#### Acceptance Criteria

1. WHEN a user navigates to /referrals/leaderboard (or views leaderboard tab), THE Referral_System SHALL display a ranked list of top referrers:
   - Rank (1, 2, 3, ...)
   - User name
   - Avatar (if available)
   - Total referrals count
   - Completed referrals count
   - Total earned rewards (in DOT)
2. THE leaderboard SHALL be sorted by completed referrals descending, then by earned rewards descending
3. THE leaderboard SHALL display top 100 referrers (limit configurable)
4. WHEN a user views the leaderboard, THE system SHALL highlight the current user's rank/entry with a different background color or badge
5. THE leaderboard SHALL load and paginate within 1 second (cached or indexed queries)
6. IF user data is restricted by privacy settings, THE system SHALL display anonymized entries (e.g., "User #123", no name/avatar)
7. THE leaderboard SHALL refresh every 5 minutes or on-demand when user clicks "Refresh"

#### Success Metrics

- Leaderboard loads within 1 second
- Pagination supports 500+ referrers
- Ranking calculations are accurate to the second
- User can quickly find their own ranking via search or highlighting
- Privacy-restricted users appear anonymized
- Response time <= 500ms for paginated queries

---

### Requirement 7: Prevent Referral Abuse

**User Story:** As the system, I want to prevent referral fraud and abuse, so that rewards are only earned legitimately.

#### Acceptance Criteria

1. THE Referral_System SHALL prevent self-referrals: IF referrer_id == referee_id, the referral record SHALL NOT be created
2. THE system SHALL prevent duplicate referrals: IF a user already has an active referral record with the same referee, reject creation (HTTP 409)
3. THE system SHALL implement rate limiting: Max 10 referral sign-ups per day per referrer (prevents bot spam)
4. WHEN a user attempts to create multiple accounts using the same email, THE system SHALL link only the first account to the referral (others treated as duplicates)
5. WHEN a referee's account is flagged or deleted, the associated referrals SHALL be marked as "cancelled" and rewards forfeited
6. THE system SHALL track referral metrics and flag suspicious patterns (e.g., 100 referrals in 1 hour) for manual review
7. IF a referral is flagged as suspicious, THE reward claim SHALL be frozen pending admin review

#### Success Metrics

- Self-referrals rejected within 100ms
- Duplicate referrals prevented (no race conditions)
- Rate limiting prevents bot referral campaigns
- Suspicious patterns detected within 24 hours
- False positives < 1% (legitimate referrers not incorrectly flagged)

---

### Requirement 8: API Endpoints for Referrals

**User Story:** As a frontend developer, I want to use API endpoints to manage referrals, so that I can integrate the referral system into the UI.

#### Acceptance Criteria

1. GET /api/referrals/my
   - Returns user's referral stats and list of their referrals
   - Response: { referrer: {id, name, code, totalReferrals, completedReferrals, pendingRewards, claimedRewards}, referrals: [{id, refereeId, name, email, vantageScore, status, rewardClaimed, claimedAt, createdAt}], total, hasMore, limit, offset }
   - Supports query params: status (pending/completed/rewarded), limit (1-100, default 50), offset

2. GET /api/referrals/leaderboard
   - Returns top referrers sorted by completed referrals
   - Response: { leaderboard: [{rank, userId, name, avatar, totalReferrals, completedReferrals, earnedRewards}], total, userRank }
   - Supports query params: limit (1-100, default 20), offset, cached

3. GET /api/referrals/:code
   - Validates and returns referral code info (used during sign-up)
   - Response: { code, referrerId, referrerName, isValid }
   - Returns HTTP 404 if code does not exist

4. POST /api/referrals/claim/:id
   - Claim reward for a completed referral
   - Request body: {} (optional)
   - Response: { referralId, status: "rewarded", rewardAmount, claimedAt }
   - Returns HTTP 400 if referral not completed or already claimed
   - Idempotent: claiming same referral twice returns same response

5. POST /api/referrals/generate
   - Force-generate new referral code for user (if lost)
   - Request body: {} (optional)
   - Response: { code, generatedAt }
   - Rate limited: max 1 per user per week

#### Success Metrics

- All endpoints return within 500ms
- Responses include proper pagination metadata
- Error responses include descriptive messages and HTTP status codes
- Authorization checks prevent unauthorized access (403 for non-owners)
- Rate limiting prevents abuse (HTTP 429 for exceeded limits)

---

### Requirement 9: Integrate Referrals with Sign-Up Flow

**User Story:** As a new user, I want a seamless referral sign-up experience, so that I understand the benefit of using a referral code.

#### Acceptance Criteria

1. WHEN a user visits /join?ref=CODE, THE sign-up form SHALL pre-fill or display: "Signing up with [Referrer Name]'s code. You'll both earn rewards!"
2. THE sign-up page SHALL display a prominent note about the referral benefit (e.g., "Both you and [Referrer Name] will earn 10 DOT when you reach Vantage 100")
3. IF the referral code is invalid, THE sign-up form SHALL proceed normally without error (invalid codes silently ignored)
4. WHEN registration completes with valid referral code, THE system SHALL log the referral relationship (as per Requirement 2)
5. THE referral sign-up SHALL NOT block or delay the registration process (referral creation happens asynchronously if needed)
6. AFTER registration completes, IF referral code was used, THE system SHALL display: "Great! You're set up with a referral. Both you and [Referrer] will earn rewards when you reach milestones."

#### Success Metrics

- Sign-up flow with referral code completes within 2 seconds
- Referral relationship established before user completes onboarding
- Invalid codes do not cause errors or delays
- User understands referral benefits from UI messaging
- No increase in registration abandonment rate

---

### Requirement 10: Notifications for Referral Events

**User Story:** As a referrer, I want to receive notifications about my referrals, so that I stay engaged and aware of progress.

#### Acceptance Criteria

1. WHEN a new referee signs up with referrer's code, send notification: "[Referee Name] joined DOT using your referral code!"
2. WHEN a referee reaches a milestone (e.g., Vantage 100), send notification: "[Referee Name] reached Vantage 100! You earned 10 DOT from this referral."
3. WHEN a referrer claims a reward, send notification: "You claimed 10 DOT from [Referee Name]'s referral!"
4. ALL notifications SHALL include a link to the Referral Dashboard or specific referral details
5. WHEN a referrer has opted out of notifications (privacy settings), skip notification send but do not block the underlying action
6. Notifications SHALL be sent via in-app notification system within 2 seconds of triggering event
7. IF notification send fails, queue for retry (up to 3 attempts, exponential backoff)

#### Success Metrics

- Notifications delivered within 2 seconds
- 99% delivery rate (including retries)
- Opt-out preferences respected
- All links functional and traceable
- No duplicate notifications for same event

---

### Requirement 11: Export and Analytics

**User Story:** As a referrer, I want to see my referral analytics and optionally export data, so that I can track my performance.

#### Acceptance Criteria

1. ON the Referral Dashboard, THE system SHALL display referral metrics:
   - Total referrals (all-time)
   - Pending referrals (count and %)
   - Completed referrals (count and %)
   - Total earned (in DOT)
   - Average Vantage of referees
2. THE dashboard SHALL display a chart or timeline showing referral growth over time (last 30/90/365 days)
3. WHEN a user requests export via /api/referrals/export, THE system SHALL generate a CSV file with columns:
   - Referee Name, Email, Sign-up Date, Current Vantage, Referral Status, Reward Amount, Date Claimed, Date Completed
4. THE CSV SHALL include summary row at top: Total Referrals, Completed Count, Total Earned
5. THE export file SHALL be downloadable with name: referral_export_[timestamp].csv (timestamp ISO 8601)
6. THE system SHALL generate export within 2 seconds

#### Success Metrics

- Dashboard metrics load within 1 second
- Charts render smoothly without performance impact
- Export generates within 2 seconds
- CSV format valid and parseable by Excel/Sheets
- Export includes accurate calculations

---

## Common Acceptance Criteria Patterns for Testing

### Property-Based Testing Candidates

1. **Uniqueness Property**
   - Requirement: Every user referral code is unique
   - Property: `allUsers.map(u => u.referralCode) has no duplicates`

2. **Invariant Property (Earnings Consistency)**
   - Requirement: User's referral earnings equals sum of completed referral rewards
   - Property: `user.referralEarningsDot == sum(completed_referrals[user.id].reward)`

3. **Monotonicity Property (Status Progression)**
   - Requirement: Referral status only transitions forward (pending → completed → rewarded)
   - Property: `status_progression.every((curr, next) => PRIORITY[curr] <= PRIORITY[next])`

4. **Idempotence Property (Reward Claims)**
   - Requirement: Claiming the same reward multiple times only credits once
   - Property: `claim(referral) == claim(claim(referral))`

5. **Consistency Property (Audit Trail)**
   - Requirement: Every referral in completed state has a completedAt timestamp
   - Property: `referrals.filter(r => r.status == "completed").every(r => r.completedAt != null)`

### Integration Test Candidates

- Complete referral flow: sign-up with code → milestone achievement → reward claim → wallet credit
- Notification delivery through in-app notification system
- Leaderboard ranking accuracy with concurrent referrals
- Rate limiting effectiveness against spam patterns
- Privacy-restricted user anonymization on leaderboard

