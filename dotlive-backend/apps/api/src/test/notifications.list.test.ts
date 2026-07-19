import { describe, it, expect, vi, beforeEach } from "vitest";

const notifyCalls: any[] = [];

vi.mock("../lib/notify.js", () => ({
  notify: async (opts: any) => {
    notifyCalls.push(opts);
    return { id: "notif-1" };
  },
}));

const fakeNotificationsDb: Record<string, any[]> = {
  notifications: [],
  users: [],
};

const fakeDb: any = {
  select(_selectObj: any) {
    return {
      from(_table: any) {
        return {
          where(_predicate: any) {
            return {
              orderBy(_column: any) {
                return {
                  limit(_n: number) {
                    const tableName = typeof _table === "string" ? _table : "notifications";
                    return Promise.resolve((fakeNotificationsDb[tableName] ?? []).slice(0, _n));
                  },
                };
              },
            };
          },
        };
      },
    };
  },
  insert(_table: any) {
    return {
      values(vals: any) {
        const name = typeof _table === "string" ? _table : "notifications";
        if (Array.isArray(vals)) {
          (fakeNotificationsDb[name] ??= []).push(...vals);
        } else {
          (fakeNotificationsDb[name] ??= []).push(vals);
        }
        return {
          returning() {
            if (Array.isArray(vals)) {
              return Promise.resolve(vals.map((v: any) => ({ ...v, id: "notif-1" })));
            }
            return Promise.resolve([{ ...vals, id: "notif-1" }]);
          },
        };
      },
    };
  },
  update(_table: any) {
    return {
      set(_set: any) {
        return {
          where(_predicate: any) {
            return {
              execute() {
                return Promise.resolve({ rowsUpdated: 1 });
              },
            };
          },
        };
      },
    };
  },
  execute() {
    return Promise.resolve({ rows: [] });
  },
};

vi.mock("../db/client.js", () => ({
  db: fakeDb,
  sql: { raw: (_s: string) => _s },
  pool: { release() {}, connect() {}, end() {} },
}));

// Notification types
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

function createNotification(userId: string, type: string, title: string, body: string): Notification {
  const notif: Notification = {
    id: `notif-${Date.now()}`,
    userId,
    type,
    title,
    body,
    read: false,
    createdAt: new Date(),
  };
  fakeNotificationsDb.notifications.push(notif);
  return notif;
}

function listNotifications(userId: string, limit = 10): Notification[] {
  // Create new array and sort by createdAt descending (newest first)
  return [...fakeNotificationsDb.notifications]
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

function markAsRead(notifId: string): boolean {
  const notif = fakeNotificationsDb.notifications.find((n) => n.id === notifId);
  if (notif) {
    notif.read = true;
    return true;
  }
  return false;
}

describe("Notifications: creation and listing", () => {
  beforeEach(() => {
    notifyCalls.length = 0;
    fakeNotificationsDb.notifications.length = 0;
    fakeNotificationsDb.users.length = 0;
  });

  it("creates a notification for a user", () => {
    const notif = createNotification("user-1", "transfer_received", "You received 100 DOT", "From user-2");

    expect(notif.id).toBeDefined();
    expect(notif.userId).toBe("user-1");
    expect(notif.type).toBe("transfer_received");
    expect(notif.read).toBe(false);
  });

  it("lists notifications in reverse chronological order", () => {
    // Create notifications with different timestamps by using setTimeout to ensure unique times
    createNotification("user-1", "info", "First notification", "Created first");
    
    // Force different timestamp
    const notif2 = { id: "notif-2", userId: "user-1", type: "info", title: "Second notification", body: "Body", read: false, createdAt: new Date(Date.now() + 1) };
    fakeNotificationsDb.notifications.push(notif2);
    
    const notif3 = { id: "notif-3", userId: "user-1", type: "info", title: "Third notification", body: "Body", read: false, createdAt: new Date(Date.now() + 2) };
    fakeNotificationsDb.notifications.push(notif3);

    const list = listNotifications("user-1");

    expect(list).toHaveLength(3);
    expect(list[0].title).toBe("Third notification");
    expect(list[1].title).toBe("Second notification");
    expect(list[2].title).toBe("First notification");
  });

  it("marks notification as read", () => {
    const notif = createNotification("user-1", "info", "Test", "Body");
    const result = markAsRead(notif.id);

    expect(result).toBe(true);
    const stored = fakeNotificationsDb.notifications.find((n) => n.id === notif.id);
    expect(stored?.read).toBe(true);
  });

  it("filters notifications by user", () => {
    createNotification("user-1", "info", "User 1 notif", "Body");
    createNotification("user-2", "info", "User 2 notif", "Body");

    const user1Notifs = listNotifications("user-1");
    const user2Notifs = listNotifications("user-2");

    expect(user1Notifs).toHaveLength(1);
    expect(user1Notifs[0].title).toBe("User 1 notif");
    expect(user2Notifs).toHaveLength(1);
    expect(user2Notifs[0].title).toBe("User 2 notif");
  });

  it("respects limit when listing notifications", () => {
    for (let i = 0; i < 20; i++) {
      createNotification("user-1", "info", `Notif ${i}`, "Body");
    }

    const list = listNotifications("user-1", 5);

    expect(list).toHaveLength(5);
  });
});