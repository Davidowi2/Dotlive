import { db } from "../db/client.js";
import { connections, connectionMessages, meetings as meetingsTable, meetingSlots } from "../db/schema.js";
import { and, eq, or, sql } from "drizzle-orm";

type ThreadRow = {
  id: string;
  userAId: string;
  userBId: string;
  status: string;
  meetingId: string | null;
  createdAt: string;
};

function loadExistingThread(userAId: string, userBId: string): Promise<ThreadRow | null> {
  const [a, b] = [userAId, userBId].sort();
  return db
    .select()
    .from(connections)
    .where(
      or(
        and(eq(connections.userAId, a), eq(connections.userBId, b)),
        and(eq(connections.userAId, b), eq(connections.userBId, a)),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export async function migrateMeetingsToThreads() {
  const rows = await db
    .select()
    .from(meetingsTable)
    .where(
      or(
        eq(meetingsTable.status, "confirmed"),
        eq(meetingsTable.status, "completed"),
      ),
    );

  let migrated = 0;

  for (const meeting of rows as any[]) {
    if (!meeting.hostId || !meeting.guestId) continue;

    const thread = await loadExistingThread(meeting.hostId, meeting.guestId);

    if (!thread) {
      const [inserted] = await db
        .insert(connections)
        .values({
          userAId: [meeting.hostId, meeting.guestId].sort()[0],
          userBId: [meeting.hostId, meeting.guestId].sort()[1],
          status: "active",
          meetingId: meeting.id,
          initiatedBy: meeting.hostId,
        } as any)
        .returning();
      await insertMeetingMessages((inserted as ThreadRow).id, meeting);
    } else if (!thread.meetingId) {
      await db
        .update(connections)
        .set({ meetingId: meeting.id } as any)
        .where(eq(connections.id, thread.id));
      await insertMeetingMessages(thread.id, meeting);
    } else {
      const existingSystem = await db
        .select()
        .from(connectionMessages)
        .where(
          and(
            eq(connectionMessages.connectionId, thread.id),
            eq(connectionMessages.senderId, "system"),
            sql`${connectionMessages.body} LIKE ${`Meeting migrated from %`}`,
          ),
        )
        .limit(1);

      if (!existingSystem[0]) {
        await insertMeetingMessages(thread.id, meeting);
      }
    }

    migrated += 1;
  }

  console.log(`Migrated ${migrated} meetings to threads`);
  return migrated;
}

async function insertMeetingMessages(threadId: string, meeting: any) {
  const meetingMsgs = await db
    .select()
    .from(meetingMessages)
    .where(eq(meetingMessages.meetingId, meeting.id));

  if (meetingMsgs.length > 0) {
    await db.insert(connectionMessages).values(
      meetingMsgs.map((m: any) => ({
        connectionId: threadId,
        senderId: m.authorId,
        body: m.body,
        createdAt: m.createdAt,
        readAt: m.createdAt,
      } as any)),
    );
  }

  await db.insert(connectionMessages).values({
    connectionId: threadId,
    senderId: "system",
    body: `Meeting migrated from ${new Date(meeting.scheduledAt).toISOString()}`,
  } as any);
}
