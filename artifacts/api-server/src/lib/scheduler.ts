import { db } from "@workspace/db";
import { slotsTable, usersTable, priorityScoreLogsTable } from "@workspace/db/schema";
import { eq, and, lt, isNotNull } from "drizzle-orm";
import { processWaitingList } from "../routes/slots";

const OVERSTAY_MS = 10 * 60 * 1000;
const today = () => new Date().toISOString().split("T")[0];

async function applyOverstayPenalties() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - OVERSTAY_MS);

  const overstayed = await db.select().from(slotsTable).where(
    and(
      eq(slotsTable.status, "OCCUPIED"),
      eq(slotsTable.penaltyApplied, false),
      isNotNull(slotsTable.entryTime),
      lt(slotsTable.entryTime, cutoff),
    )
  );

  for (const slot of overstayed) {
    if (slot.userId) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, slot.userId));
      if (user) {
        await db.update(usersTable)
          .set({ priorityScore: user.priorityScore - 1 })
          .where(eq(usersTable.id, user.id));

        await db.insert(priorityScoreLogsTable).values({
          userId: user.id,
          date: today(),
          scoreChange: -1,
          reason: "overstay_10min",
        });
      }
    }

    await db.update(slotsTable)
      .set({ penaltyApplied: true })
      .where(eq(slotsTable.id, slot.id));
  }
}

export function startScheduler() {
  setInterval(async () => {
    try {
      await applyOverstayPenalties();
    } catch {}
  }, 60 * 1000);
}
