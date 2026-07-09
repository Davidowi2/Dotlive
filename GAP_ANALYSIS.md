# Frontend API Gap Analysis & Implementation Priority

**Status:** Generated comprehensive gap analysis for 6 priority groups covering 45+ endpoints
**Total Scope:** P1 (9 endpoints) + P2 (6 endpoints) + P3 (10+ endpoints) + P4 (10 endpoints) + P5 (5 endpoints) + P6 (5 endpoints)

---

## P1: Feed System - 9 endpoints ⭐ HIGH PRIORITY (User-facing)

**Impact:** Core social feed experience - user engagement driver

### Backend Endpoints
- `POST /api/feed` | Auth required | Create a post (gig, announcement, venture_update, funding, general)
- `GET /api/feed` | Public | Get feed with pagination (tab: latest|popular|trending, page, limit)
- `GET /api/feed/posts/:id` | Public | Single post lookup with engagement state
- `POST /api/feed/:id/like` | Auth required | Toggle like on post
- `POST /api/feed/:id/bookmark` | Auth required | Toggle bookmark on post
- `GET /api/feed/:id/comments` | Public | List comments on post
- `POST /api/feed/:id/comments` | Auth required | Add a comment
- `DELETE /api/feed/:id` | Auth required | Delete own post (or admin any)
- `GET /api/feed/trending-tags` | Public | Get trending tags for last 7 days

### Frontend File: `src/api/feed.ts`
### Status: **MISSING** ❌

### Interfaces Needed
```typescript
interface FeedPost {
  id: string;
  type: 'gig' | 'announcement' | 'venture_update' | 'funding' | 'general';
  title?: string;
  body: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  budgetDot?: number;
  gigType?: string;
  fundingGoal?: number;
  fundingRound?: string;
  createdAt: string;
  authorId: string;
  authorName: string | null;
  authorDotId: string | null;
  authorAvatar: string | null;
}

interface FeedComment {
  id: string;
  body: string;
  likesCount: number;
  createdAt: string;
  authorName: string | null;
  authorDotId: string | null;
}

interface FeedResponse {
  posts: FeedPost[];
  hasMore: boolean;
  total: number;
}

interface TrendingTag {
  tag: string;
  count: number;
}
```

### Implementation Examples

```typescript
export async function getFeed(
  tab: 'latest' | 'popular' | 'trending' = 'latest',
  page: number = 1,
  limit: number = 20
): Promise<FeedResponse> {
  const params = new URLSearchParams({
    tab,
    page: String(page),
    limit: String(limit),
  });
  return dotApi.get<FeedResponse>(`/api/feed?${params.toString()}`);
}

export async function createFeedPost(data: {
  type?: 'gig' | 'announcement' | 'venture_update' | 'funding' | 'general';
  title?: string;
  body: string;
  tags?: string[];
  budgetDot?: number;
  gigType?: string;
  fundingGoal?: number;
  fundingRound?: string;
}): Promise<FeedPost> {
  const res = await dotApi.post<{ post: FeedPost }>('/api/feed', data);
  return res.post;
}

export async function toggleLike(postId: string): Promise<{ liked: boolean; likesCount: number }> {
  return dotApi.post(`/api/feed/${postId}/like`, {});
}

export async function getPostComments(postId: string): Promise<FeedComment[]> {
  const res = await dotApi.get<{ comments: FeedComment[] }>(`/api/feed/${postId}/comments`);
  return res.comments;
}

export async function addComment(postId: string, body: string): Promise<FeedComment> {
  const res = await dotApi.post<{ comment: FeedComment }>(`/api/feed/${postId}/comments`, { body });
  return res.comment;
}

export async function getTrendingTags(): Promise<TrendingTag[]> {
  const res = await dotApi.get<{ tags: TrendingTag[] }>('/api/feed/trending-tags');
  return res.tags;
}
```

---

## P2: Investor Features - 6 endpoints

**Impact:** Investor workflow - save founders, request/manage meetings

### Backend Endpoints
- `GET /api/investor/saves` | Auth required | List saved founders
- `POST /api/investor/saves` | Auth required | Save a founder
- `DELETE /api/investor/saves/:founderId` | Auth required | Unsave founder
- `GET /api/investor/meetings` | Auth required | List requested meetings
- `POST /api/investor/meetings` | Auth required | Request meeting with founder
- `PATCH /api/investor/meetings/:id` | Auth required | Accept/decline meeting (creates connection)

### Frontend File: `src/api/investor.ts`
### Status: **MISSING** ❌

### Interfaces Needed
```typescript
interface InvestorSave {
  id: string;
  investorId: string;
  founderId: string;
  createdAt: string;
  founder?: {
    name: string | null;
    dotId: string;
    email: string;
  };
}

interface MeetingRequest {
  id: string;
  investorId: string;
  founderId: string;
  topic: string;
  message?: string;
  requestedFor?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}
```

### Implementation Examples

```typescript
export async function getSavedFounders(): Promise<InvestorSave[]> {
  const res = await dotApi.get<{ saves: InvestorSave[] }>('/api/investor/saves');
  return res.saves;
}

export async function saveFounder(founderId: string): Promise<InvestorSave> {
  const res = await dotApi.post<{ save: InvestorSave }>('/api/investor/saves', { founderId });
  return res.save;
}

export async function unsaveFounder(founderId: string): Promise<{ ok: boolean }> {
  return dotApi.delete(`/api/investor/saves/${founderId}`);
}

export async function getMeetingRequests(): Promise<MeetingRequest[]> {
  const res = await dotApi.get<{ meetings: MeetingRequest[] }>('/api/investor/meetings');
  return res.meetings;
}

export async function requestMeeting(data: {
  founderId: string;
  topic: string;
  message?: string;
  requestedFor?: string;
}): Promise<MeetingRequest> {
  const res = await dotApi.post<{ meeting: MeetingRequest }>('/api/investor/meetings', data);
  return res.meeting;
}

export async function respondToMeeting(
  meetingId: string,
  status: 'accepted' | 'declined'
): Promise<{ ok: boolean; connectionId?: string }> {
  return dotApi.patch(`/api/investor/meetings/${meetingId}`, { status });
}
```

---

## P3: Vouching System - 10+ endpoints

**Impact:** Trust/reputation mechanics - verification & scoring

### Backend Endpoints
- `POST /api/vouches` | Auth required | Create vouch (with scope: founder|builder|capital)
- `GET /api/vouches/received/:userId` | Public | List vouches received by user
- `GET /api/vouches/given/:userId` | Public | List vouches given by user
- `DELETE /api/vouches/:vouchId` | Auth required | Revoke own vouch
- `GET /api/vouches/stats/:userId` | Public | Aggregate vouch stats & score

### Frontend File: `src/api/vouches.ts`
### Status: **MISSING** ❌

### Interfaces Needed
```typescript
type VouchScope = 'founder' | 'builder' | 'capital';

interface Vouch {
  id: string;
  voucherId: string;
  voucheeId: string;
  scope: VouchScope;
  score: number;
  createdAt: string;
  voucher?: {
    name: string | null;
    dotId: string;
    avatarUrl: string | null;
  };
}

interface VouchStats {
  userId: string;
  receivedCount: number;
  givenCount: number;
  totalScore: number;
  decayedScore: number; // Applied on client (1% / 30 days)
  byScope: Record<VouchScope, { count: number; score: number }>;
}
```

### Implementation Examples

```typescript
export async function createVouch(
  voucheeId: string,
  scope: VouchScope
): Promise<Vouch> {
  const res = await dotApi.post<{ vouch: Vouch }>('/api/vouches', {
    voucheeId,
    scope,
  });
  return res.vouch;
}

export async function getVouchesReceived(userId: string): Promise<Vouch[]> {
  const res = await dotApi.get<{ vouches: Vouch[] }>(`/api/vouches/received/${userId}`);
  return res.vouches;
}

export async function getVouchesGiven(userId: string): Promise<Vouch[]> {
  const res = await dotApi.get<{ vouches: Vouch[] }>(`/api/vouches/given/${userId}`);
  return res.vouches;
}

export async function revokeVouch(vouchId: string): Promise<{ ok: boolean }> {
  return dotApi.delete(`/api/vouches/${vouchId}`);
}
```

---

## P4: Demo Events & Voting - 10 endpoints

**Impact:** Event management & community voting - engagement platform

### Backend Endpoints
- `GET /api/demo/events` | Public | List all events (paginated)
- `GET /api/demo/events/:slug` | Public | Get single event with vote counts
- `POST /api/demo/events` | Admin only | Create event
- `PUT /api/demo/events/:slug` | Admin only | Update event
- `POST /api/votes` | Auth required | Cast vote on venture/builder/challenge/community
- `GET /api/votes/:eventSlug/leaderboard` | Public | Get ranked results by vote weight
- `GET /api/votes/me` | Auth required | List my votes
- `GET /api/votes/:eventSlug/results` | Public | Aggregate results (including fraud detection)

### Frontend File: `src/api/demoEvents.ts`
### Status: **MISSING** ❌

### Interfaces Needed
```typescript
interface DemoEvent {
  id: string;
  slug: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  votingOpensAt?: string;
  votingClosesAt?: string;
  tracks: ('open' | 'invitational')[];
  status: 'upcoming' | 'registration_open' | 'voting_open' | 'live' | 'completed';
  prizePoolDot?: number;
  livestreamUrl?: string;
  registrationFeeDot: number;
  featuredVentures: string[];
  createdAt: string;
}

interface Vote {
  id: string;
  voterId: string;
  eventSlug: string;
  targetType: 'venture' | 'challenge' | 'builder' | 'community';
  targetId: string;
  weight: string; // "1.00"
  reputationAtVote: string;
  createdAt: string;
}

interface VoteLeaderboardEntry {
  rank: number;
  targetId: string;
  targetType: string;
  totalVotes: number;
  totalWeight: number;
  targetName?: string;
}
```

### Implementation Examples

```typescript
export async function listEvents(): Promise<DemoEvent[]> {
  const res = await dotApi.get<{ events: DemoEvent[] }>('/api/demo/events');
  return res.events;
}

export async function getEventBySlug(slug: string): Promise<DemoEvent> {
  const res = await dotApi.get<{ event: DemoEvent; voteCounts: any }>(`/api/demo/events/${slug}`);
  return res.event;
}

export async function createEvent(data: Partial<DemoEvent>): Promise<DemoEvent> {
  const res = await dotApi.post<{ event: DemoEvent }>('/api/demo/events', data);
  return res.event;
}

export async function castVote(
  eventSlug: string,
  targetType: 'venture' | 'challenge' | 'builder' | 'community',
  targetId: string
): Promise<Vote> {
  const res = await dotApi.post<{ vote: Vote }>('/api/votes', {
    eventSlug,
    targetType,
    targetId,
  });
  return res.vote;
}

export async function getLeaderboard(
  eventSlug: string
): Promise<VoteLeaderboardEntry[]> {
  const res = await dotApi.get<{ leaderboard: VoteLeaderboardEntry[] }>(
    `/api/votes/${eventSlug}/leaderboard`
  );
  return res.leaderboard;
}
```

---

## P5: Marketplace Order Workflows - 5 endpoints

**Impact:** Gig/service economy - core transaction flow

### Backend Endpoints
- `GET /api/marketplace/orders` | Auth required | List my orders (buyer & seller views)
- `POST /api/marketplace/orders` | Auth required | Create order for a service
- `PATCH /api/marketplace/orders/:id` | Auth required | Update order status (start, complete, cancel)
- `POST /api/marketplace/orders/:id/deliver` | Auth required | Mark complete + payment release
- `POST /api/marketplace/orders/:id/review` | Auth required | Leave review after completion

### Frontend File: `src/api/marketplace.ts`
### Status: **PARTIAL** ⚠️ (missing order workflow endpoints)

### Interfaces Needed
```typescript
type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

interface ServiceOrder {
  id: string;
  buyerId: string;
  sellerId: string;
  serviceId: string;
  status: OrderStatus;
  priceDot: string;
  deliveryDays: number;
  deliveryDeadline: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  buyer?: { name: string; dotId: string };
  seller?: { name: string; dotId: string };
  service?: { title: string };
}

interface ServiceReview {
  id: string;
  orderId: string;
  authorId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}
```

### Implementation Examples

```typescript
export async function getMyOrders(): Promise<ServiceOrder[]> {
  const res = await dotApi.get<{ orders: ServiceOrder[] }>('/api/marketplace/orders');
  return res.orders;
}

export async function createOrder(serviceId: string): Promise<ServiceOrder> {
  const res = await dotApi.post<{ order: ServiceOrder }>('/api/marketplace/orders', {
    serviceId,
  });
  return res.order;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<ServiceOrder> {
  const res = await dotApi.patch<{ order: ServiceOrder }>(`/api/marketplace/orders/${orderId}`, {
    status,
  });
  return res.order;
}

export async function completeOrder(orderId: string): Promise<{ ok: boolean }> {
  return dotApi.post(`/api/marketplace/orders/${orderId}/deliver`, {});
}

export async function reviewOrder(
  orderId: string,
  data: { rating: number; comment: string }
): Promise<ServiceReview> {
  const res = await dotApi.post<{ review: ServiceReview }>(
    `/api/marketplace/orders/${orderId}/review`,
    data
  );
  return res.review;
}
```

---

## P6: Auth Alternatives (Magic Links & Password Reset) - 5 endpoints

**Impact:** Authentication alternatives - accessibility & security

### Backend Endpoints
- `POST /api/auth/send-magic-link` | Public | Send magic link (signup/signin/verify-email)
- `POST /api/auth/verify-magic-link` | Public | Verify token + return session
- `POST /api/auth/request-password-reset` | Public | Send password reset email
- `POST /api/auth/verify-reset-token` | Public | Verify reset token validity
- `POST /api/auth/reset-password` | Public | Complete password reset

### Frontend File: `src/api/authAlternatives.ts`
### Status: **MISSING** ❌

### Interfaces Needed
```typescript
interface MagicLinkResponse {
  token?: string; // JWT for signin/verify
  signupToken?: string; // For signup flow  
  user?: any;
}

interface PasswordResetRequest {
  email: string;
  sentAt: string;
}

interface PasswordResetVerify {
  valid: boolean;
  expiresAt?: string;
}

interface PasswordResetComplete {
  ok: boolean;
  message: string;
}
```

### Implementation Examples

```typescript
export async function sendMagicLink(
  email: string,
  purpose: 'signup' | 'verify-email' | 'signin' = 'signup'
): Promise<{ ok: boolean }> {
  return dotApi.post('/api/auth/send-magic-link', { email, purpose });
}

export async function verifyMagicLink(token: string): Promise<MagicLinkResponse> {
  return dotApi.post('/api/auth/verify-magic-link', { token });
}

export async function requestPasswordReset(email: string): Promise<PasswordResetRequest> {
  const res = await dotApi.post<PasswordResetRequest>(
    '/api/auth/request-password-reset',
    { email }
  );
  return res;
}

export async function verifyResetToken(token: string): Promise<PasswordResetVerify> {
  return dotApi.post('/api/auth/verify-reset-token', { token });
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<PasswordResetComplete> {
  return dotApi.post('/api/auth/reset-password', { token, newPassword });
}
```

---

## Summary Table

| Priority | Feature Group | Status | Endpoints | Files Needed | Est. LOC |
|----------|---------------|--------|-----------|--------------|---------|
| **P1** | Feed System | ❌ Missing | 9 | `feed.ts` | ~250 |
| **P2** | Investor Features | ❌ Missing | 6 | `investor.ts` | ~150 |
| **P3** | Vouching System | ❌ Missing | 4+ | `vouches.ts` | ~120 |
| **P4** | Demo Events & Voting | ❌ Missing | 8 | `demoEvents.ts` | ~180 |
| **P5** | Marketplace Orders | ⚠️ Partial | 5 | Update `marketplace.ts` | ~100 |
| **P6** | Auth Alternatives | ❌ Missing | 5 | `authAlternatives.ts` | ~120 |
| | **TOTAL** | | **37+** | **6 files** | **~920** |

---

## Implementation Order Recommendation

1. **P1 (Feed)** → Core engagement feature, highest user impact
2. **P2 (Investor)** → Validates pitch/founder discovery value prop
3. **P4 (Events & Voting)** → Community engagement platform
4. **P6 (Auth)** → Auth flows unlock new user acquisition
5. **P3 (Vouching)** → Trust layer - depends on user base
6. **P5 (Marketplace)** → Build on top of P2 investor features

---

## Creation Checklist

### For Each File (`src/api/[name].ts`):
- [ ] Define all TypeScript interfaces based on backend schema
- [ ] Implement all wrapper functions with proper error handling
- [ ] Add JSDoc comments for function parameters & return types
- [ ] Import `{ dotApi }` from `@/api/client`
- [ ] Use consistent naming: `get*`, `create*`, `update*`, `delete*` patterns
- [ ] Handle pagination where applicable (limit, offset, hasMore)
- [ ] Type promise returns with generic types
- [ ] Test functions with existing frontend components
- [ ] Verify auth guards match backend requirements
