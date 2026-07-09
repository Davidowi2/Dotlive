/**
 * Feed API client — social feed for gigs, announcements, updates, funding
 */

import { dotApi } from "./client";

export type FeedPostType = "gig" | "announcement" | "venture_update" | "funding" | "general";

export interface FeedPost {
  id: string;
  type: FeedPostType;
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

export interface FeedComment {
  id: string;
  body: string;
  likesCount: number;
  createdAt: string;
  authorName: string | null;
  authorDotId: string | null;
  authorId: string;
}

export interface FeedResponse {
  posts: FeedPost[];
  hasMore: boolean;
  total: number;
}

export interface TrendingTag {
  tag: string;
  count: number;
}

/**
 * Get feed posts with optional filtering and pagination
 */
export async function getFeed(
  tab: "latest" | "popular" | "trending" = "latest",
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

/**
 * Get a single feed post by ID
 */
export async function getFeedPost(postId: string): Promise<FeedPost> {
  const res = await dotApi.get<{ post: FeedPost }>(`/api/feed/posts/${postId}`);
  return res.post;
}

/**
 * Create a new feed post
 */
export async function createFeedPost(data: {
  type?: FeedPostType;
  title?: string;
  body: string;
  tags?: string[];
  budgetDot?: number;
  gigType?: string;
  fundingGoal?: number;
  fundingRound?: string;
}): Promise<FeedPost> {
  const res = await dotApi.post<{ post: FeedPost }>("/api/feed", data);
  return res.post;
}

/**
 * Toggle like on a feed post
 */
export async function toggleLike(postId: string): Promise<{ liked: boolean; likesCount: number }> {
  return dotApi.post(`/api/feed/${postId}/like`, {});
}

/**
 * Toggle bookmark on a feed post
 */
export async function toggleBookmark(
  postId: string
): Promise<{ bookmarked: boolean; bookmarksCount: number }> {
  return dotApi.post(`/api/feed/${postId}/bookmark`, {});
}

/**
 * Get all comments on a feed post
 */
export async function getPostComments(postId: string): Promise<FeedComment[]> {
  const res = await dotApi.get<{ comments: FeedComment[] }>(`/api/feed/${postId}/comments`);
  return res.comments;
}

/**
 * Add a comment to a feed post
 */
export async function addComment(postId: string, body: string): Promise<FeedComment> {
  const res = await dotApi.post<{ comment: FeedComment }>(`/api/feed/${postId}/comments`, {
    body,
  });
  return res.comment;
}

/**
 * Delete a feed post (own post or admin)
 */
export async function deleteFeedPost(postId: string): Promise<{ ok: boolean }> {
  return dotApi.delete(`/api/feed/${postId}`);
}

/**
 * Get trending tags for the past 7 days
 */
export async function getTrendingTags(): Promise<TrendingTag[]> {
  const res = await dotApi.get<{ tags: TrendingTag[] }>("/api/feed/trending-tags");
  return res.tags;
}
