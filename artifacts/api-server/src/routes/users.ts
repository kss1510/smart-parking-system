import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { asc, desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (_req, res) => {
  const users = await db
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
    .orderBy(desc(usersTable.priorityScore), asc(usersTable.id));

  return res.json(
    users.map((u, i) => ({
      rank: i + 1,
      userId: u.userId,
      name: u.name ?? null,
      email: u.email,
      registrationId: u.registrationId ?? null,
      priorityScore: u.priorityScore,
      points: u.points,
    }))
  );
});

export default router;
