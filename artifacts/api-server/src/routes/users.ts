import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, slotsTable } from "@workspace/db/schema";
import { asc, desc, eq, isNotNull } from "drizzle-orm";

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

export default router;
