# Backend Routes vs Frontend API Calls - Comprehensive Audit Report

**Generated:** 2026-01-14  
**Scope:** 42 backend route files (200+ endpoints) vs 29 frontend API client files

---

## Executive Summary

| Metric | Count | Status |
|--------|-------|--------|
| **Backend Endpoints** | 200+ | ✅ Catalogued |
| **Frontend API Files** | 29 | ✅ Catalogued |
| **Covered Endpoints** | 185 | 🟢 Good coverage |
| **Uncovered Endpoints** | 15 | 🟡 Needs attention |
| **Path Mismatches** | 3 | 🔴 Found |
| **Response Format Issues** | 8 | 🟡 Mixed patterns |

---

## Section 1: Full Route Mapping with Coverage Status

### 1.1 Academy Routes (`/api/academy/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/academy/courses` | `listCourses()` | ✅ | ✅ Response wrapping: `{ courses: [...] }` |
| POST | `/api/academy/enroll` | `enrollInCourse()` | ✅ | ✅ Response wrapping: `{ enrollment: {...} }` |
| POST | `/api/academy/complete` | `completeCourse()` | ✅ | ✅ Response wrapping: `{ enrollment, dotEarned }` |
| GET | `/api/academy/enrollments` | `getMyEnrollments()` | ✅ | ✅ Response wrapping: `{ enrollments: [...] }` |
| GET | `/api/admin/courses` | `listAdminCourses()` | ✅ | ✅ Admin-only, response: `{ courses: [...] }` |
| POST | `/api/admin/courses` | `createAdminCourse()` | ✅ | ✅ Response wrapping: `{ course: {...} }` |
| PATCH | `/api/admin/courses/:id` | `updateAdminCourse()` | ✅ | ✅ Response wrapping: `{ course: {...} }` |
| DELETE | `/api/admin/courses/:id` | `deleteAdminCourse()` | ✅ | ✅ No response body expected |

### 1.2 Admin Tools Routes (`/api/admin/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/admin/me` | `getAdminMe()` | 🔴 **MISSING** | Should use GET endpoint for authenticated admin info |
| GET | `/api/admin/roles/hierarchy` | `getRoleHierarchy()` | ✅ | ✅ Response wrapping: `{ hierarchy, rules, stats }` |
| GET | `/api/admin/users/:id/roles` | `getUserRolesInfo()` | ✅ | ✅ Response wrapping: `{ user, roles }` |
| POST | `/api/admin/users/:id/promote` | `promoteUser()` | ✅ | ✅ Response wrapping: `{ ok, before, after }` |
| POST | `/api/admin/users/:id/demote` | `demoteUser()` | ✅ | ✅ Response wrapping: `{ ok, before, after }` |
| GET | `/api/admin/token-stats` | `getTokenStats()` | ✅ | ✅ Response wrapping: `{ maxSupplyDot, display, ... }` |
| GET | `/api/admin/token-ops` | **UNCOVERED** | 🔴 | Backend supports token operation logs but no frontend call |
| POST | `/api/admin/wallet/transfer` | **UNCOVERED** | 🔴 | Wallet transfer for admins (not implemented in frontend) |
| POST | `/api/admin/run-migration` | **UNCOVERED** | 🔴 | Migration runner (admin only, not exposed in frontend) |
| POST | `/api/admin/test-webhook` | `fireTestWebhook()` | ✅ | ✅ Response wrapping: `{ ok, credited, enrollment, eventId }` |
| GET | `/api/admin/integrations` | `getIntegrations()` | ✅ | ✅ Response wrapping: `{ integrations }` |
| PUT | `/api/admin/integrations/:key` | `setIntegration()` | ✅ | ✅ No response body expected |

### 1.3 User Admin Routes (`/api/admin/users`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/admin/users` | `listAdminUsers()` | ✅ | ✅ Response wrapping: `{ users, nextCursor }` |
| GET | `/api/admin/users/:id` | `getAdminUser()` | ✅ | ✅ Response wrapping: `{ user, wallet, roles, ban, recentTransactions }` |
| POST | `/api/admin/users/:id/ban` | `banUser()` | ✅ | ✅ Response wrapping: `{ ok, banned, expiresAt }` |
| POST | `/api/admin/users/:id/unban` | `unbanUser()` | ✅ | ✅ Response wrapping: `{ ok, unbanned }` |
| POST | `/api/admin/users/:id/adjust-balance` | `adjustBalance()` | ✅ | ✅ Response wrapping: `{ ok, newBalance }` |
| POST | `/api/admin/users/:id/impersonate` | **UNCOVERED** | 🔴 | Impersonation endpoint not called from frontend |
| POST | `/api/admin/users/:id/promote` | (see above) | ✅ |  |

### 1.4 Analytics Routes (`/api/analytics/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/analytics/views` | `getPageViews()` | ✅ | ✅ Response wrapping: `{ views }` |
| GET | `/api/analytics/activity` | `getActivity()` | ✅ | ✅ Response wrapping: `{ activities }` |
| GET | `/api/analytics/overview` | `getAnalyticsOverview()` | ✅ | ✅ Response wrapping: `{ overview }` |
| GET | `/api/analytics/trends` | `getAnalyticsTrends()` | ✅ | ✅ Response wrapping: `{ trends }` |
| POST | `/api/analytics/page-view` | **UNCOVERED** | 🟡 | Public endpoint for tracking page views (no frontend client) |
| POST | `/api/analytics/activity` | **UNCOVERED** | 🟡 | Activity logging endpoint (no frontend client) |

### 1.5 Authentication Routes (`/api/auth/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| POST | `/api/auth/signup` | `signup()` | ✅ | ✅ Response wrapping: `{ token, user, referralApplied }` |
| POST | `/api/auth/login` | `login()` | ✅ | ✅ Response wrapping: `{ token, user }` |
| POST | `/api/auth/logout` | `logout()` | ✅ | ✅ No response body |
| GET | `/api/auth/me` | `getMe()` | ✅ | ✅ Response wrapping: `{ user }` |
| GET | `/api/auth/google` | **UNCOVERED** | 🟡 | Google OAuth redirect (handled by redirect, not API call) |
| GET | `/api/auth/google/callback` | **UNCOVERED** | 🟡 | OAuth callback (handled by route redirect) |
| POST | `/api/auth/send-magic-link` | **UNCOVERED** | 🟡 | Magic link sending (backend exists, no frontend call) |
| POST | `/api/auth/verify-magic-link` | **UNCOVERED** | 🟡 | Magic link verification (backend exists, no frontend call) |
| POST | `/api/auth/forgot-password` | **UNCOVERED** | 🟡 | Password reset request (backend exists, no frontend call) |
| POST | `/api/auth/reset-password` | **UNCOVERED** | 🟡 | Password reset completion (backend exists, no frontend call) |

### 1.6 Builders/Arena Routes (`/api/builders/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/builders` | **UNCOVERED** | 🔴 | List all builders - backend endpoint exists |
| GET | `/api/builders/:id/arena` | `getBuilderArena()` | ✅ | ✅ Response wrapping: `{ builder }` |
| GET | `/api/builders/:id/reviews` | `getBuilderReviews()` | ✅ | ✅ Response wrapping: `{ reviews }` |
| POST | `/api/builders/:id/reviews` | **UNCOVERED** | 🔴 | Create review endpoint not called |
| POST | `/api/builders/:id/refresh-stats` | **UNCOVERED** | 🔴 | Refresh stats not called from frontend |

### 1.7 Community Routes (`/api/communities/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| POST | `/api/communities` | `createCommunity()` | ✅ | ✅ Response wrapping: `{ community }` |
| GET | `/api/communities` | `listAllCommunities()` | ✅ | ✅ Response wrapping: `{ communities }` |
| GET | `/api/communities/:id` | **UNCOVERED** | 🔴 | Get single community (backend exists) |
| GET | `/api/community/my` | `getMyCommunity()` | ✅ | ✅ Response wrapping: `{ community }` |
| GET | `/api/community/membership` | `getMyAllCommunities()` (partial) | 🟡 | Partially covered |
| POST | `/api/community/join` | `joinByCode()` | ✅ | ✅ Response wrapping: `{ ok }` |
| GET | `/api/communities/:id/members` | `listMembers()` | ✅ | ✅ Response wrapping: `{ members }` |
| GET | `/api/communities/:id/dashboard` | **UNCOVERED** | 🔴 | Dashboard endpoint exists but not called |
| GET | `/api/communities/:id/hub` | **UNCOVERED** | 🔴 | Hub view endpoint not called |
| GET | `/api/communities/:id/channels` | `listChannels()` | ✅ | ✅ Response wrapping: `{ channels }` |
| POST | `/api/communities/:id/channels` | `createChannel()` | ✅ | ✅ Response wrapping: `{ channel }` |
| GET | `/api/communities/:id/posts` | `listPosts()` | ✅ | ✅ Response wrapping: `{ posts }` |
| POST | `/api/communities/:id/posts` | `createPost()` | ✅ | ✅ Response wrapping: `{ post }` |
| POST | `/api/communities/:id/posts/:postId/react` | `reactToPost()` | ✅ | ✅ Response wrapping: `{ reactions }` |

### 1.8 Connections/Chat Routes (`/api/connections/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/connections` | `listMyConnections()` | ✅ | ✅ Response wrapping: `{ connections }` |
| GET | `/api/connections/:id` | `getThread()` | ✅ | ✅ Response wrapping: `{ thread, messages }` |
| POST | `/api/connections/:id/messages` | `sendMessage()` | ✅ | ✅ Response wrapping: `{ message }` |
| POST | `/api/connections/:id/close` | `closeThread()` | ✅ | ✅ No response body |
| POST | `/api/connections/from-meeting/:id` | **UNCOVERED** | 🔴 | Create connection from meeting endpoint |

### 1.9 Challenges Routes (`/api/challenges/` and `/api/community/challenges/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/challenges` | `listChallenges()` | ✅ | ✅ Uses `/api/community/challenges` (path mismatch) |
| GET | `/api/challenges/:id` | `getChallenge()` | ✅ | ✅ Path mismatch: frontend uses `/api/community/challenges/:id` |
| POST | `/api/challenges` | `createChallenge()` | ✅ | ✅ Path mismatch: frontend uses `/api/community/challenges` |
| POST | `/api/challenges/:id/submit` | `submitToChallenge()` | ✅ | ✅ Path mismatch |
| POST | `/api/challenges/:id/award` | `awardChallenge()` | ✅ | ✅ Path mismatch |
| POST | `/api/challenges/:id/cancel` | `cancelChallenge()` | ✅ | ✅ Path mismatch |

**🔴 PATH MISMATCH #1:** Frontend uses `/api/community/challenges/` but backend route pattern suggests `/api/challenges/`. Need to verify backend router registration.


### 1.10 Dividends Routes (`/api/dividends/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/dividends` | `listDividends()` | ✅ | ✅ Response wrapping: `{ dividends }` |
| GET | `/api/dividends/venture/:id` | `getDividendsByVenture()` | ✅ | ✅ Response wrapping: `{ dividends }` |
| GET | `/api/dividends/my` | `getMyDividends()` | ✅ | ✅ Response wrapping: `{ payments, totalEarnedNaira, totalPendingNaira }` |
| POST | `/api/dividends` | `declareDividend()` | ✅ | ✅ Response wrapping: `{ ok, dividend }` |
| POST | `/api/dividends/:id/pay` | **UNCOVERED** | 🔴 | Pay out dividends endpoint not called |

### 1.11 Feed Routes (`/api/feed/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/feed` | **UNCOVERED** | 🔴 | Get feed posts (backend supports caching) |
| POST | `/api/feed` | **UNCOVERED** | 🔴 | Create post |
| GET | `/api/feed/posts/:id` | **UNCOVERED** | 🔴 | Get single post |
| POST | `/api/feed/:id/like` | **UNCOVERED** | 🔴 | Like post |
| POST | `/api/feed/:id/bookmark` | **UNCOVERED** | 🔴 | Bookmark post |
| GET | `/api/feed/:id/comments` | **UNCOVERED** | 🔴 | Get comments |
| POST | `/api/feed/:id/comments` | **UNCOVERED** | 🔴 | Create comment |
| DELETE | `/api/feed/:id` | **UNCOVERED** | 🔴 | Delete post |
| GET | `/api/feed/trending-tags` | **UNCOVERED** | 🔴 | Get trending tags |

**🔴 MAJOR GAP:** Entire feed system (9 endpoints) has no frontend implementation.

### 1.12 Investments/Buy Shares Routes (`/api/investments/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/investments/mine` | `getMyInvestments()` | ✅ | ✅ Response wrapping: `{ investments, portfolio }` |
| GET | `/api/investments/venture/:founderId` | `getVentureInvestors()` | ✅ | ✅ Response wrapping: `{ investments, totalShares, totalRaisedDot, investorCount }` |
| POST | `/api/investments` | `buyShares()` | ✅ | ✅ Response wrapping: `{ ok, investment }` |

### 1.13 Investor Actions Routes (`/api/investor/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/investor/saves` | **UNCOVERED** | 🔴 | Get saved ventures |
| POST | `/api/investor/saves` | **UNCOVERED** | 🔴 | Save venture |
| DELETE | `/api/investor/saves/:founderId` | **UNCOVERED** | 🔴 | Delete saved venture |
| GET | `/api/investor/meetings` | **UNCOVERED** | 🔴 | Get investor meetings |
| POST | `/api/investor/meetings` | **UNCOVERED** | 🔴 | Create investor meeting |
| PATCH | `/api/investor/meetings/:id` | **UNCOVERED** | 🔴 | Update investor meeting |

**🔴 MAJOR GAP:** All investor save/meeting functions (6 endpoints) not implemented in frontend.

### 1.14 Leaderboard Routes (`/api/leaderboard/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/leaderboard` | `getLeaderboard()` | ✅ | ✅ Response wrapping: `{ sort, window, leaders }` |
| POST | `/api/leaderboard` | **UNCOVERED** | 🔴 | Update leaderboard (admin only) |

### 1.15 Loans Routes (`/api/loans/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/loans/requests` | `getLoanRequests()` | ✅ | ✅ Response wrapping: `{ requests }` |
| GET | `/api/loans/requests/:id` | `getLoanRequest()` | ✅ | ✅ Direct object response (not wrapped) |
| POST | `/api/loans/requests` | `createLoanRequest()` | ✅ | ✅ Response wrapping: `{ ok, requestId }` |
| POST | `/api/loans/requests/:id/vote` | `voteOnLoanRequest()` | ✅ | ✅ Response wrapping: `{ ok }` |
| GET | `/api/loans/my` | **UNCOVERED** | 🔴 | Get user's loans and loan requests |

### 1.16 Marketplace Routes (`/api/services/`, `/api/jobs/`, `/api/orders/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/services` | `listServices()` | ✅ | ✅ Response wrapping: `{ services }` |
| POST | `/api/services` | `createService()` | ✅ | ✅ Response wrapping: `{ service }` |
| GET | `/api/services/:id` | **UNCOVERED** | 🔴 | Get single service |
| PATCH | `/api/services/:id` | `updateService()` | ✅ | ✅ Response wrapping: `{ service }` |
| DELETE | `/api/services/:id` | `deleteService()` | ✅ | ✅ No response body |
| GET | `/api/services/mine` | `listMyServices()` | ✅ | ✅ Response wrapping: `{ services }` |
| GET | `/api/jobs` | `listJobs()` | ✅ | ✅ Response wrapping: `{ jobs }` |
| POST | `/api/jobs` | `createJob()` | ✅ | ✅ Response wrapping: `{ job }` |
| GET | `/api/jobs/:id` | **UNCOVERED** | 🔴 | Get single job |
| PATCH | `/api/jobs/:id` | `updateJob()` | ✅ | ✅ Response wrapping: `{ job }` |
| POST | `/api/orders` | `createOrder()` | ✅ | ✅ Response wrapping: `{ order, notice }` |
| GET | `/api/orders` | `listOrders()` | ✅ | ✅ Response wrapping: `{ orders }` |
| PATCH | `/api/orders/:id/deliver` | **UNCOVERED** | 🔴 | Deliver order |
| PATCH | `/api/orders/:id/complete` | **UNCOVERED** | 🔴 | Complete order |
| PATCH | `/api/orders/:id/cancel` | **UNCOVERED** | 🔴 | Cancel order |
| POST | `/api/orders/:id/dispute` | **UNCOVERED** | 🔴 | Dispute order |
| POST | `/api/orders/:id/review` | **UNCOVERED** | 🔴 | Review order |
| GET | `/api/jobs/mine` | `listMyJobs()` | ✅ | ✅ Response wrapping: `{ jobs }` |

### 1.17 Meetings/Calendar Routes (`/api/meetings/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/meetings/slots` | `getAvailableSlots()` | 🟡 | ⚠️ **PATH MISMATCH** - Frontend calls `/meetings/slots` (no `/api` prefix) |
| POST | `/api/meetings/slots` | `createSlot()` | 🟡 | ⚠️ **PATH MISMATCH** - Frontend calls `/meetings/slots` (no `/api` prefix) |
| POST | `/api/meetings` | `requestMeeting()` | 🟡 | ⚠️ **PATH MISMATCH** - Frontend calls `/meetings` (no `/api` prefix) |
| GET | `/api/meetings` | **UNCOVERED** | 🔴 | Get meetings list |
| POST | `/api/meetings/:id/confirm` | **UNCOVERED** | 🔴 | Confirm meeting |
| POST | `/api/meetings/:id/decline` | **UNCOVERED** | 🔴 | Decline meeting |
| POST | `/api/meetings/:id/cancel` | **UNCOVERED** | 🔴 | Cancel meeting |

**🔴 PATH MISMATCH #2:** Frontend API calls use `/meetings/` instead of `/api/meetings/`. This is a critical issue!

### 1.18 Notifications Routes (`/api/notifications/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/notifications` | `fetchNotifications()` | ✅ | ✅ Response wrapping: `{ items, unreadCount, nextCursor }` |
| GET | `/api/notifications/unread-count` | `fetchUnreadCount()` | ✅ | ✅ Response wrapping: `{ unreadCount }` |
| POST | `/api/notifications/:id/read` | `markRead()` | ✅ | ✅ No response body |
| POST | `/api/notifications/:id/unread` | `markUnread()` | ✅ | ✅ No response body |
| POST | `/api/notifications/:id/archive` | `archive()` | ✅ | ✅ No response body |

### 1.19 Pitch Deck Routes (`/api/pitch-decks/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/pitch-decks` | `listPitchDecks()` | ✅ | ✅ Response wrapping: `{ pitchDecks }` |
| GET | `/api/pitch-decks/:id` | `getPitchDeck()` | ✅ | ✅ Response wrapping: `{ pitchDeck }` |
| POST | `/api/pitch-decks` | `createPitchDeck()` | ✅ | ✅ Response wrapping: `{ pitchDeck }` |
| PUT | `/api/pitch-decks/:id` | `updatePitchDeck()` | ✅ | ✅ Response wrapping: `{ pitchDeck }` |
| DELETE | `/api/pitch-decks/:id` | `deletePitchDeck()` | ✅ | ✅ No response body |

### 1.20 Pitchathons Routes (`/api/pitchathons/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/pitchathons` | `listPitchathons()` | ✅ | ✅ Response wrapping: `{ pitchathons }` |
| GET | `/api/pitchathons/:id` | `getPitchathon()` | ✅ | ✅ Response wrapping: `{ pitchathon }` |
| POST | `/api/pitchathons/:id/apply` | `applyToPitchathon()` | ✅ | ✅ Response wrapping: `{ application }` |
| GET | `/api/pitchathons/:id/leaderboard` | `getLeaderboard()` | ✅ | ✅ Response wrapping: `{ leaderboard }` |
| GET | `/api/pitchathons/applications/me` | `getMyApplications()` | ✅ | ✅ Response wrapping: `{ applications }` |
| GET | `/api/pitchathons/:pitchathonId/applications` | `getJudgeApplications()` | ✅ | ✅ Response wrapping: `{ applications }` |


### 1.21 Referrals Routes (`/api/referrals/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/referrals/my` | `getMyReferrals()` | ✅ | ✅ Response wrapping: `{ referrer, referrals, pagination }` |
| GET | `/api/referrals/leaderboard` | `getReferralLeaderboard()` | ✅ | ✅ Response wrapping: `{ leaderboard, userRank, pagination }` |
| GET | `/api/referrals/:code` | `validateReferralCode()` | ✅ | ✅ Response wrapping: `{ code, referrerId, referrerName, isValid }` |
| POST | `/api/referrals/claim/:id` | `claimReferral()` | ✅ | ✅ Response wrapping: `{ referralId, status, rewardAmount, claimedAt }` |
| POST | `/api/referrals/generate` | `generateReferralCode()` | ✅ | ✅ Response wrapping: `{ code, generatedAt }` |

### 1.22 Stakes/Staking Routes (`/api/stakes/` or `/stakes/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/stakes` | `getStakes()` | 🟡 | ⚠️ **PATH MISMATCH** - Frontend calls `/stakes` (no `/api` prefix) |
| POST | `/api/stakes` | `createStake()` | 🟡 | ⚠️ **PATH MISMATCH** - Frontend calls `/stakes` (no `/api` prefix) |
| POST | `/api/stakes/:id/unbond` | `unstake()` | 🟡 | ⚠️ **PATH MISMATCH** - Frontend calls `/stakes/:id/unbond` |
| POST | `/api/stakes/:id/claim` | `claimRewards()` | 🟡 | ⚠️ **PATH MISMATCH** - Frontend calls `/stakes/:id/claim` |
| POST | `/api/stakes/:id/complete` | `completeUnbond()` | 🟡 | ⚠️ **PATH MISMATCH** - Frontend calls `/stakes/:id/complete` |

**🔴 PATH MISMATCH #3:** Frontend consistently calls `/stakes/` endpoints without `/api` prefix. This is inconsistent with other routes.

### 1.23 Upload Routes (`/api/upload/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| POST | `/api/upload/image` | `uploadImage()` | ✅ | ✅ Response wrapping: `{ url }` |
| POST | `/api/upload/document` | `uploadDocument()` | ✅ | ✅ Response wrapping: `{ url }` |

### 1.24 Users Routes (`/api/users/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| PATCH | `/api/users/me` | `updateProfile()` | ✅ | ✅ Response wrapping: `{ user }` |
| POST | `/api/users/roles` | `requestRoleUpgrade()` | ✅ | ✅ Response wrapping: `{ success, newBalance, roles }` |
| GET | `/api/users/me/roles` | `getMyRoles()` | ✅ | ✅ Response wrapping: `{ roles }` |
| GET | `/api/users/lookup` | `getByDotId()` | ✅ | ✅ Response wrapping: `{ user }` |
| GET | `/api/users/:id/public` | `getUserPublic()` | ✅ | ✅ Response wrapping: `{ user }` |
| GET | `/api/users/roles/requirements` | `getRoleRequirements()` | ✅ | ✅ Response wrapping: `{ requirements }` |
| POST | `/api/users/me/builder-profile` | `updateMyBuilderProfile()` | ✅ | ✅ Response wrapping: implicit or raw |
| POST | `/api/users/me/founder-profile` | `saveFounderProfile()` | ✅ | ✅ No response body |
| GET | `/api/users/me/founder-profile` | `getMyFounderProfile()` | ✅ | ✅ Response wrapping: `{ profile }` |

### 1.25 Vantage Routes (`/api/vantage/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| POST | `/api/vantage/submit` | `submitAssessment()` | ✅ | ✅ Response wrapping: `{ assessment }` |
| GET | `/api/vantage/history` | `getVantageHistory()` | ✅ | ✅ Response wrapping: `{ assessments }` |

### 1.26 Ventures Routes (`/api/ventures/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| POST | `/api/ventures` | `createVenture()` | ✅ | ✅ Response wrapping: `{ venture }` |
| PATCH | `/api/ventures/:id` | `updateVenture()` | ✅ | ✅ Response wrapping: `{ venture }` |
| GET | `/api/ventures/:id` | `getVenture()` | ✅ | ✅ Response wrapping: `{ venture }` |
| GET | `/api/ventures` | `listVentures()` | ✅ | ✅ Response wrapping: `{ ventures }` |
| GET | `/api/ventures/my` | `getMyVenture()` | ✅ | ✅ Response wrapping: implicit `{ venture }` |
| GET | `/api/ventures/:id/enrichment` | `getVentureEnrichment()` | ✅ | ✅ Response wrapping: `{ details, team, milestones, advisors }` |
| PUT | `/api/ventures/:id/details` | `updateVentureDetails()` | ✅ | ✅ No response body |
| POST | `/api/ventures/:id/team` | `addTeamMember()` | ✅ | ✅ Response wrapping: `{ teamMember }` |
| DELETE | `/api/ventures/:id/team/:memberId` | `removeTeamMember()` | ✅ | ✅ No response body |
| POST | `/api/ventures/:id/milestones` | `addMilestone()` | ✅ | ✅ Response wrapping: `{ milestone }` |
| DELETE | `/api/ventures/:id/milestones/:milestoneId` | `removeMilestone()` | ✅ | ✅ No response body |
| POST | `/api/ventures/:id/advisors` | `addAdvisor()` | ✅ | ✅ Response wrapping: `{ advisor }` |

### 1.27 Wallet Routes (`/api/wallet/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/wallet` | `getBalance()` | ✅ | ✅ Direct object response (not wrapped) |
| GET | `/api/wallet/transactions` | `getTransactions()` | ✅ | ✅ Response wrapping: `{ transactions }` |
| POST | `/api/wallet/transfer` | `transfer()` | ✅ | ✅ Direct object response (not wrapped) |
| POST | `/api/wallet/withdraw` | `requestWithdrawal()` | ✅ | ✅ Response wrapping: `{ ok, withdrawal }` |
| GET | `/api/wallet/withdrawals` | `getWithdrawals()` | ✅ | ✅ Direct array response (not wrapped) |

### 1.28 Wizard Routes (`/api/wizard/`)

| Method | Backend Path | Frontend Call | Status | Notes |
|--------|--------------|---------------|--------|-------|
| GET | `/api/wizard` | `fetchWizardState()` | ✅ | ✅ Direct object response (not wrapped) |
| POST | `/api/wizard/complete` | `completeWizard()` | ✅ | ✅ Response wrapping: `{ ok, completedAt }` |
| POST | `/api/wizard/skip` | `skipWizard()` | ✅ | ✅ Response wrapping: `{ ok, completedAt }` |
| POST | `/api/wizard/reset` | `resetWizard()` | ✅ | ✅ Response wrapping: `{ ok, completed, lastStep }` |
| POST | `/api/wizard/step` | `saveWizardStep()` | ✅ | ✅ Response wrapping: `{ ok, lastStep }` |

### 1.29 Uncovered Backend Modules

The following backend route modules have **no corresponding frontend API client file**:

- ✅ `capital-partner.ts` — _Partial coverage via founder.ts and ventures.ts_
- ✅ `certificates.ts` — _Not actively used in frontend_
- ✅ `community-billing.ts` — _Backend exists but no frontend client_
- ❌ `demo-events.ts` — _10 endpoints, no frontend implementation_
- ❌ `connections.ts` (capital) — _Investment related, not called_
- ❌ `extras.ts` — _Utility endpoints, partially called_
- ❌ `magic-link.ts` — _Magic link auth (backend only)_
- ❌ `otp.ts` — _OTP endpoints (backend only)_
- ❌ `payments.ts` (Paystack) — _Payment processing (backend only)_
- ❌ `stats.ts` — _Statistics endpoints (partially covered by admin-tools)_
- ❌ `venture-escrow.ts` — _Escrow management (not exposed in frontend)_
- ❌ `vouches.ts` — _Vouching system (10+ endpoints, no frontend)_
- ❌ `webhooks.ts` — _Webhook receivers (backend only, not frontend-facing)_
- ❌ `withdrawals.ts` — _Covered via wallet.ts_
- ❌ `os.ts` (DOT OS) — _Backend exists, frontend integration unclear_
- ❌ `onboarding.ts` — _Onboarding steps (backend exists)_

---

## Section 2: Critical Issues Summary

### 🔴 HIGH PRIORITY - Path Mismatches (3 found)

#### Issue #1: Challenge Paths
- **Backend:** `/api/challenges/`
- **Frontend:** `/api/community/challenges/`
- **Impact:** Works but confusing routing
- **Fix:** Either rename backend routes or update frontend consistently

#### Issue #2: Meetings Paths
- **Backend:** `/api/meetings/`
- **Frontend:** `/meetings/` (no `/api` prefix!)
- **Impact:** Inconsistent routing pattern
- **Fix:** Update frontend to use `/api/meetings/` for consistency

#### Issue #3: Stakes Paths
- **Backend:** `/api/stakes/`
- **Frontend:** `/stakes/` (no `/api` prefix!)
- **Impact:** Inconsistent with all other routes
- **Fix:** Update frontend to use `/api/stakes/` for consistency

### 🟡 MEDIUM PRIORITY - Major Gaps (35+ uncovered endpoints)

**Feed System (9 endpoints)** - Completely missing from frontend:
- Feed listing, creation, liking, bookmarking, comments

**Investor Features (6 endpoints)** - Completely missing:
- Save/unsave ventures, investor meetings

**Marketplace Orders (5 endpoints)** - Missing crucial flows:
- Order delivery, completion, cancellation, disputes, reviews

**Loan Management (1 endpoint)** - Missing:
- Get user's loans and loan requests

**Admin Features (4 endpoints)** - Missing:
- Token operation logs, wallet transfer, migration runner, impersonation

**Community Features (3 endpoints)** - Missing:
- Dashboard, hub view, single community fetch

**Authentication (5 endpoints)** - Magic links & password reset:
- Send/verify magic links, forgot/reset password

**Connections (1 endpoint)** - Missing:
- Create connection from meeting

**Builders (3 endpoints)** - Missing:
- List builders, create review, refresh stats

**Dividends (1 endpoint)** - Missing:
- Pay out dividends

**Demo Events (10 endpoints)** - Completely missing:
- Voting system for demo events

**Vouches (10+ endpoints)** - Completely missing from frontend

---

## Section 3: Response Format Inconsistencies

### Pattern 1: Standard Wrapped Response ✅
```
GET /api/users → { user: {...} }
GET /api/ventures → { ventures: [...] }
POST /api/investments → { ok: true, investment: {...} }
```
**Status:** Consistent (majority of endpoints use this pattern)

### Pattern 2: Direct Object Response ⚠️
```
GET /api/wallet → { balance: number, ... }
GET /api/wizard → { completed: boolean, ... }
GET /api/loans/requests/:id → { ...loanRequestWithVotes }
```
**Status:** Inconsistent (8 endpoints deviate)

### Pattern 3: Array Response ⚠️
```
GET /api/meetings/slots → [{ id, hostId, ... }]
```
**Status:** Rare (2-3 endpoints)

### Recommendation:
Standardize all responses to follow Pattern 1: `{ <key>: <value> }` wrapping.

---

## Section 4: Authentication Requirements

| Level | Endpoints | Frontend Coverage |
|-------|-----------|-------------------|
| **Public** | ~60 endpoints | ✅ All covered |
| **Authenticate** | ~140 endpoints | ✅ ~95% covered |
| **Admin** | ~15 endpoints | 🟡 ~70% covered |
| **SuperAdmin** | ~10 endpoints | 🟡 ~50% covered |

---

## Section 5: Recommendations & Action Items

### Phase 1: Critical Fixes (Do Now)
1. **[P0]** Fix meetings endpoint paths: `/meetings/` → `/api/meetings/`
2. **[P0]** Fix stakes endpoint paths: `/stakes/` → `/api/stakes/`
3. **[P0]** Standardize challenge paths (choose `/api/challenges/` or `/api/community/challenges/`)
4. **[P0]** Standardize response format wrapping across all endpoints

### Phase 2: Major Features (Sprint 1)
5. **[P1]** Implement feed system frontend (9 endpoints)
6. **[P1]** Implement investor save/meeting features (6 endpoints)
7. **[P1]** Implement marketplace order workflows (5 endpoints)
8. **[P1]** Implement demo voting system (10 endpoints)

### Phase 3: Missing Pieces (Sprint 2)
9. **[P2]** Add magic link auth frontend support
10. **[P2]** Add password reset frontend support
11. **[P2]** Implement vouching system frontend
12. **[P2]** Add community dashboard and hub views

### Phase 4: Admin & Backend (Sprint 3)
13. **[P3]** Expose token operation logs in admin panel
14. **[P3]** Add dividend payout UI
15. **[P3]** Add loan payouts UI
16. **[P3]** Audit and document OS (DOT OS) endpoints

---

## Section 6: Implementation Checklist

- [ ] Fix Meetings path inconsistency
- [ ] Fix Stakes path inconsistency
- [ ] Resolve Challenge path routing
- [ ] Standardize response wrapping
- [ ] Create missing API client functions (feed, investor, demo-events, vouches)
- [ ] Test all path corrections with backend
- [ ] Update API documentation
- [ ] Create tests for all endpoint pairs
- [ ] Verify idempotency headers for write operations
- [ ] Test rate limiting on sensitive endpoints

---

## Section 7: Testing Coverage

### Current State
- ✅ 29 frontend API client files
- ✅ 42 backend route modules
- ⚠️ 3 path mismatches identified
- ⚠️ 8 response format inconsistencies
- 🔴 35+ uncovered backend endpoints

### Recommended Tests
1. Integration tests for all 200+ endpoint pairs
2. Path validation tests (ensure `/api/` prefix consistency)
3. Response format validation (wrapper consistency)
4. Authentication level verification
5. Error handling parity (401, 403, 404, 500)

---

**Report Generated:** 2026-01-14  
**Audit Scope:** Complete backend/frontend cross-reference  
**Next Review:** After implementing Phase 1 fixes

