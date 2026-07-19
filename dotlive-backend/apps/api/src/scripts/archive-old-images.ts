import { db } from "../db/client.js";
import { feedPosts } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { and, isNotNull, lt, eq } from "drizzle-orm";

export async function archiveOldFeedImages() {
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  const oldPosts = await db
    .select()
    .from(feedPosts)
    .where(and(isNotNull(feedPosts.imageUrl), lt(feedPosts.createdAt, sixMonthsAgo)));

  for (const post of oldPosts) {
    if (!post.imageUrl) continue;
    const updated = post.imageUrl.replace("/upload/", "/upload/fl_archived/");
    await db
      .update(feedPosts)
      .set({ imageUrl: updated })
      .where(eq(feedPosts.id, post.id));
  }

  return { archived: oldPosts.length };
}
