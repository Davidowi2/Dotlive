# Major Redesign Requirements - Discover & Communities

**Date**: 2026-06-30  
**Status**: REQUIREMENTS DOCUMENTED  
**Priority**: CRITICAL - Affects Platform Architecture  

---

## 🎯 NEW VISION OVERVIEW

The user has clarified two major redesigns that fundamentally change how the platform works:

1. **Discover → Social Feed** (like X/Twitter + Reddit)
2. **Communities → Group Messaging** (like WhatsApp/Discord)

---

## 1. DISCOVER PAGE REDESIGN (X/Twitter + Reddit Style)

### Current State
- `/discover` - Search/browse ventures, investors, communities
- Static listings and cards
- No social interaction
- No content feed

### New Vision: Social Content Feed

**Core Concept**: "you discover stuff" - Feed-based discovery like X (Twitter) or Reddit

**Post Types in Feed:**
1. **Jobs/Gigs** - Founders post work opportunities
2. **Announcements** - Platform updates, community news
3. **Venture updates** - Founder progress posts
4. **Funding opportunities** - Investor posts, capital partners
5. **General posts** - User-generated content

**Social Features (Like Reddit/X):**
- ✅ **Comments** - Users can comment on ANY post
  - Comment to apply for jobs
  - Comment to express funding interest
  - Comment to ask questions
  - Nested replies (Reddit-style)
  
- ✅ **Interactions**
  - Like/upvote posts
  - Share posts
  - Bookmark/save
  - Follow post updates

- ✅ **Post Creation**
  - Rich text editor
  - Image/video attachments
  - Tags/categories
  - Visibility settings (public/community-only)

**Feed Algorithm:**
- Sort by: Latest, Popular, Trending
- Filter by: Jobs, Announcements, Funding, All
- Personalized based on user role (founder sees different feed than investor)

**Example Flow - Job Post:**
```
┌─────────────────────────────────────────────┐
│ 👤 Amara Okafor · Founder · 2h ago         │
│                                             │
│ 🔥 Hiring: Full-stack developer (Remote)   │
│                                             │
│ We're looking for a senior dev to join...  │
│ • React + Node.js                          │
│ • 3-5 years experience                     │
│ • Budget: 5,000 DOT/month                  │
│                                             │
│ 💬 12 comments  ❤️ 24 likes  🔗 Share      │
│                                             │
│ ──────────────────────────────────────────  │
│ 💬 David: "I'm interested! 5 years React   │
│    experience. Portfolio: ..."             │
│    ↳ 👍 2  💬 Reply                        │
│                                             │
│ 💬 Sarah: "What's the tech stack?"         │
│    ↳ Amara: "MERN + TypeScript + Prisma"   │
└─────────────────────────────────────────────┘
```

---

## 2. COMMUNITIES REDESIGN (WhatsApp/Discord Style)

### Current State
- `/community` - Single community page with stats
- `/community/channels` - List of channels
- No messaging functionality
- No group concept

### New Vision: Group Messaging Platform

**Core Concept**: Private/Public Groups with real-time messaging

### Group Types

#### A. **Public Communities**
- Anyone can discover and join
- Visible in community directory
- Open participation
- Examples: "Lagos Founders", "Nigerian Startups", "Edtech Builders"

#### B. **Private Communities** 
- Invite-only or unique join code
- Not visible in public directory
- Vetted membership
- Examples: "YC Alumni Africa", "Series A Club", "Vetted Angels"

### Community Features (Discord/WhatsApp Style)

**1. Group Structure:**
```
Community: "Lagos Founders"
├── #general (text channel)
├── #introductions (text channel)
├── #jobs (text channel)
├── #funding (text channel)
├── #events (text channel)
└── Voice rooms (future)
```

**2. Real-time Messaging:**
- Text messages
- Image/file sharing
- Reactions (emojis)
- Threads/replies
- @mentions
- Read receipts (optional)
- Online status indicators

**3. Member Management:**
- Roles: Owner, Admin, Moderator, Member
- Permissions per role
- Kick/ban members
- Invite system (link or email)
- Member directory

**4. Join Methods:**
- **Public**: Click "Join" button
- **Private**: 
  - Unique invite link (expires)
  - Join code (e.g., "LAGOS2024")
  - Direct invite from admin

### Community Leader Dashboard

**Required Info to Build Community:**
1. Community name
2. Description & purpose
3. Public or Private?
4. Category (Founders, Investors, Industry-specific)
5. Location/region (optional)
6. Rules & guidelines
7. If private: Vetting criteria

**Community Builder Tools:**
- Create channels
- Set permissions
- Invite members
- Moderation tools
- Analytics (engagement, growth)
- Announcement system

**Example Private Community Join Flow:**
```
1. User clicks invite link: dotlive.com/join/ABC123XYZ
2. Shows community preview:
   "Lagos Founders Club"
   "Private community for verified Lagos-based founders"
   
3. Application form:
   - Why do you want to join?
   - Your venture name
   - Stage of venture
   - LinkedIn profile
   
4. Submit application
5. Community admin reviews
6. Accept/reject with notification
```

---

## 3. ARCHITECTURAL IMPLICATIONS

### Database Changes Needed

**New Tables:**
```sql
-- Social posts in Discover
posts (
  id, author_id, type, title, content, 
  media_urls, tags, visibility, 
  likes_count, comments_count,
  created_at, updated_at
)

post_comments (
  id, post_id, user_id, parent_comment_id,
  content, likes_count,
  created_at, updated_at
)

post_likes (id, post_id, user_id, created_at)

-- Communities
communities (
  id, name, description, type (public/private),
  category, owner_id, member_count,
  join_code, invite_link,
  created_at, updated_at
)

community_channels (
  id, community_id, name, description,
  type (text/voice/announcement),
  position, created_at
)

community_members (
  id, community_id, user_id, role,
  joined_at, invited_by
)

community_messages (
  id, channel_id, user_id, content,
  media_urls, reply_to_id,
  created_at, updated_at
)

community_join_requests (
  id, community_id, user_id, 
  answers (JSONB), status (pending/approved/rejected),
  created_at, reviewed_at
)
```

### Real-time Features (WebSocket/Supabase Realtime)
- Live message updates
- Typing indicators
- Online status
- Real-time notifications
- Live post engagement (likes, comments)

### API Endpoints Needed

**Discover Feed:**
- `GET /api/discover/feed` - Paginated feed
- `POST /api/discover/posts` - Create post
- `GET /api/discover/posts/:id` - Get single post
- `POST /api/discover/posts/:id/comments` - Add comment
- `POST /api/discover/posts/:id/like` - Like post
- `DELETE /api/discover/posts/:id/like` - Unlike post

**Communities:**
- `GET /api/communities` - List public communities
- `POST /api/communities` - Create community (community leader only)
- `GET /api/communities/:id` - Get community details
- `POST /api/communities/:id/join` - Join public community
- `POST /api/communities/:id/request-join` - Request to join private
- `GET /api/communities/:id/channels` - List channels
- `GET /api/communities/:id/channels/:channelId/messages` - Get messages
- `POST /api/communities/:id/channels/:channelId/messages` - Send message
- `POST /api/communities/:id/members/:userId/role` - Update member role
- `DELETE /api/communities/:id/members/:userId` - Remove member

---

## 4. UI/UX CHANGES

### Discover Page Redesign
**Before**: Grid of cards with filters  
**After**: Twitter/Reddit-style feed with infinite scroll

**New Components Needed:**
- `<PostCard>` - Individual post in feed
- `<PostComposer>` - Create new post modal
- `<CommentThread>` - Nested comments
- `<PostEngagement>` - Like, comment, share buttons
- `<FeedFilters>` - Sort and filter options

### Communities Redesign
**Before**: Static community info page  
**After**: Discord/Slack-style messaging interface

**New Components Needed:**
- `<CommunityList>` - Left sidebar with joined communities
- `<ChannelList>` - Channel list for selected community
- `<MessageFeed>` - Real-time message display
- `<MessageComposer>` - Send message input
- `<MemberList>` - Right sidebar with online members
- `<CommunitySettings>` - Admin dashboard
- `<JoinRequestModal>` - Private community join form

---

## 5. ROLE-BASED ACCESS

### Who Can Post in Discover?
- **Founders**: All post types (especially jobs, announcements)
- **Investors**: Funding opportunities, advice
- **Builders**: Available for work, showcase projects
- **Community Leaders**: Announcements, events
- **Everyone**: Comments on any post

### Who Can Create Communities?
- **Community Leaders** (special role)
- **Admins**
- Must fill out community builder application form

### Community Leader Requirements
User must provide:
1. Full name & LinkedIn
2. Track record (previous communities managed)
3. Community plan (purpose, target members, engagement strategy)
4. Why you want to build this community
5. Estimated member count & growth plan

---

## 6. IMPLEMENTATION PRIORITY

### Phase 1: Foundation (Do First)
1. ✅ Fix current critical bugs (in progress)
2. Create database schema for posts + communities
3. Build basic API endpoints
4. Set up real-time infrastructure (Supabase Realtime)

### Phase 2: Discover Feed (Week 1)
1. Build post feed UI
2. Post creation modal
3. Comment system
4. Like/engagement features
5. Feed filtering & sorting

### Phase 3: Communities (Week 2)
1. Community creation flow (community leaders only)
2. Public community join
3. Private community with join codes
4. Channel structure
5. Basic messaging (text only)

### Phase 4: Real-time & Polish (Week 3)
1. Real-time message updates
2. Typing indicators
3. Online status
4. Notifications
5. Member management UI
6. Moderation tools

---

## 7. QUESTIONS TO CLARIFY

Before starting this redesign, need to confirm:

1. **Discover Feed**:
   - Should it replace current `/discover` completely?
   - Or should it be `/feed` and keep `/discover` for search?
   - Should job posts ONLY appear in feed, or also in DOT Work?

2. **Communities**:
   - Keep current `/community` page or replace entirely?
   - Should every user auto-join a "Global" community?
   - Max number of communities a user can join?
   - Message retention (keep all messages forever or archive old ones)?

3. **Community Leaders**:
   - How do users become community leaders?
   - Application process required?
   - DOT cost to create community?
   - Monetization: Can community leaders charge to join?

4. **Moderation**:
   - Report system for posts/messages?
   - Auto-moderation rules?
   - Admin oversight of all communities?

5. **Notifications**:
   - Email notifications for mentions/replies?
   - Push notifications (if mobile app)?
   - Notification preferences per community?

---

## 8. ESTIMATED EFFORT

**Database + API**: 3-4 days  
**Discover Feed UI**: 2-3 days  
**Communities UI**: 4-5 days  
**Real-time Features**: 2-3 days  
**Testing + Polish**: 2-3 days  

**Total**: ~2-3 weeks for complete redesign

---

## IMMEDIATE NEXT STEPS

**For now**: 
1. ✅ Document requirements (this file)
2. Continue with systematic bug fixes
3. Prepare redesign plan after fixes complete

**After fixes**:
1. Present detailed redesign spec for approval
2. Create UI mockups
3. Get user confirmation on flows
4. Start implementation

---

## STATUS

📋 **Requirements captured**  
⏳ **Awaiting user confirmation before redesign starts**  
🔧 **Continuing with systematic bug fixes first**

---

