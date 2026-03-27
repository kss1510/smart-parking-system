import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, slotsTable, waitingListTable, priorityScoreLogsTable } from "@workspace/db/schema";
import { asc, desc, eq, isNotNull, and, lt } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (_req, res) => {
  const [users, occupiedSlots] = await Promise.all([
    db
      .select({
        userId: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        registrationId: usersTable.registrationId,
        priorityScore: usersTable.priorityScore,
        points: usersTable.points,
      })
      .from(usersTable)
      .where(eq(usersTable.isAdmin, false))
      .orderBy(asc(usersTable.id)),
    db
      .select({ userId: slotsTable.userId })
      .from(slotsTable)
      .where(eq(slotsTable.status, "OCCUPIED"))
      .then(rows => new Set(rows.map(r => r.userId).filter(Boolean))),
  ]);

  const ranked = users
    .map(u => ({
      userId: u.userId,
      name: u.name ?? null,
      email: u.email,
      registrationId: u.registrationId ?? null,
      points: u.points,
      priorityScore: u.priorityScore + (occupiedSlots.has(u.userId) ? 1 : 0),
      isParked: occupiedSlots.has(u.userId),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore || a.userId - b.userId)
    .map((u, i) => ({ rank: i + 1, ...u }));

  return res.json(ranked);
});

router.get("/:userId/waiting-status", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const now = new Date();

  await db.update(waitingListTable)
    .set({ status: "EXPIRED" })
    .where(and(
      eq(waitingListTable.userId, userId),
      eq(waitingListTable.status, "WAITING"),
      lt(waitingListTable.expiresAt, now),
    ));

  const [entry] = await db.select().from(waitingListTable)
    .where(and(
      eq(waitingListTable.userId, userId),
      eq(waitingListTable.status, "WAITING"),
    ))
    .orderBy(desc(waitingListTable.createdAt))
    .limit(1);

  if (!entry) {
    const [granted] = await db.select().from(waitingListTable)
      .where(and(
        eq(waitingListTable.userId, userId),
        eq(waitingListTable.status, "GRANTED"),
      ))
      .orderBy(desc(waitingListTable.createdAt))
      .limit(1);

    if (granted && granted.grantedSlotId && granted.grantedQrToken) {
      const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.id, granted.grantedSlotId));
      if (slot?.status === "RESERVED") {
        return res.json({
          status: "GRANTED",
          slotId: granted.grantedSlotId,
          qrToken: granted.grantedQrToken,
          slotNumber: slot.slotNumber,
          zoneId: slot.zoneId,
          waitingId: granted.id,
        });
      }
      await db.update(waitingListTable).set({ status: "EXPIRED" }).where(eq(waitingListTable.id, granted.id));
    }
    return res.json({ status: "NONE" });
  }

  const allWaiting = await db.select().from(waitingListTable)
    .where(and(eq(waitingListTable.zoneId, entry.zoneId), eq(waitingListTable.status, "WAITING")))
    .orderBy(asc(waitingListTable.createdAt));
  const position = allWaiting.findIndex(r => r.id === entry.id) + 1;

  return res.json({
    status: "WAITING",
    waitingId: entry.id,
    zoneId: entry.zoneId,
    position,
    total: allWaiting.length,
    expiresAt: entry.expiresAt.toISOString(),
  });
});

router.post("/:userId/leave-waiting", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  await db.update(waitingListTable)
    .set({ status: "EXPIRED" })
    .where(and(eq(waitingListTable.userId, userId), eq(waitingListTable.status, "WAITING")));
  return res.json({ message: "Removed from waiting list" });
});

router.get("/:userId/score-logs", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const logs = await db.select().from(priorityScoreLogsTable)
    .where(eq(priorityScoreLogsTable.userId, userId))
    .orderBy(desc(priorityScoreLogsTable.createdAt))
    .limit(30);
  return res.json(logs);
});

export default router;
