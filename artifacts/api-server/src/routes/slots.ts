import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  slotsTable, zonesTable, historyTable, usersTable,
  priorityScoreLogsTable, waitingListTable,
} from "@workspace/db/schema";
import { eq, and, asc, lt, isNotNull } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const OVERSTAY_MINUTES = 10;
const WAIT_EXPIRY_MINUTES = 30;
const today = () => new Date().toISOString().split("T")[0];

function slotToJson(s: typeof slotsTable.$inferSelect, zoneName: string) {
  return {
    id: s.id,
    zoneId: s.zoneId,
    zoneName,
    slotNumber: s.slotNumber,
    status: s.status,
    slotType: s.slotType,
    vehicleNumber: s.vehicleNumber ?? null,
    userId: s.userId ?? null,
    entryTime: s.entryTime?.toISOString() ?? null,
    reservedUntil: s.reservedUntil?.toISOString() ?? null,
    qrToken: s.qrToken ?? null,
  };
}

async function logScore(userId: number, scoreChange: number, reason: string) {
  await db.insert(priorityScoreLogsTable).values({
    userId,
    date: today(),
    scoreChange,
    reason,
  });
}

export async function processWaitingList(zoneId: number) {
  const now = new Date();

  await db.update(waitingListTable).set({ status: "EXPIRED" }).where(
    and(eq(waitingListTable.zoneId, zoneId), eq(waitingListTable.status, "WAITING"), lt(waitingListTable.expiresAt, now))
  );

  const freeSlots = await db.select().from(slotsTable).where(
    and(eq(slotsTable.zoneId, zoneId), eq(slotsTable.status, "FREE"))
  ).orderBy(asc(slotsTable.slotNumber));

  if (freeSlots.length === 0) return;

  const waiting = await db.select({ w: waitingListTable, u: usersTable })
    .from(waitingListTable)
    .innerJoin(usersTable, eq(usersTable.id, waitingListTable.userId))
    .where(and(eq(waitingListTable.zoneId, zoneId), eq(waitingListTable.status, "WAITING")))
    .orderBy(asc(waitingListTable.createdAt));

  if (waiting.length === 0) return;

  const positive = waiting.filter(r => r.w.userScore >= 0);
  const negative = waiting.filter(r => r.w.userScore < 0);
  const ordered = [...positive, ...negative];

  for (let i = 0; i < Math.min(freeSlots.length, ordered.length); i++) {
    const slot = freeSlots[i];
    const { w: entry } = ordered[i];
    const qrToken = randomUUID();
    const reservedUntil = new Date(now.getTime() + 5 * 60 * 1000);

    await db.update(slotsTable).set({
      status: "RESERVED",
      vehicleNumber: entry.vehicleNumber,
      userId: entry.userId,
      reservedUntil,
      qrToken,
      entryTime: null,
      penaltyApplied: false,
    }).where(eq(slotsTable.id, slot.id));

    await db.update(waitingListTable).set({
      status: "GRANTED",
      grantedSlotId: slot.id,
      grantedQrToken: qrToken,
    }).where(eq(waitingListTable.id, entry.id));
  }
}

router.get("/suggest", async (_req, res) => {
  const zones = await db.select().from(zonesTable).orderBy(zonesTable.name);

  let bestSlot: (typeof slotsTable.$inferSelect & { zoneName: string }) | null = null;
  let minOccupied = Infinity;

  for (const zone of zones) {
    const allSlots = await db.select().from(slotsTable).where(eq(slotsTable.zoneId, zone.id));
    const freeSlots = allSlots.filter(s => s.status === "FREE" && s.slotType !== "FACULTY");
    const occupiedCount = allSlots.filter(s => s.status === "OCCUPIED").length;

    if (freeSlots.length > 0 && occupiedCount < minOccupied) {
      minOccupied = occupiedCount;
      bestSlot = { ...freeSlots[0], zoneName: zone.name };
    }
  }

  if (!bestSlot) {
    return res.status(404).json({ error: "No available slots" });
  }

  return res.json(slotToJson(bestSlot, bestSlot.zoneName));
});

router.get("/zone/:zoneId", async (req, res) => {
  const zoneId = parseInt(req.params.zoneId, 10);
  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, zoneId));

  const now = new Date();
  const expiredReserved = await db.select().from(slotsTable).where(
    and(eq(slotsTable.zoneId, zoneId), eq(slotsTable.status, "RESERVED"))
  );
  for (const slot of expiredReserved) {
    if (slot.reservedUntil && slot.reservedUntil < now) {
      await db.update(slotsTable).set({
        status: "FREE",
        vehicleNumber: null,
        userId: null,
        reservedUntil: null,
        qrToken: null,
        penaltyApplied: false,
      }).where(eq(slotsTable.id, slot.id));
    }
  }

  const slots = await db.select().from(slotsTable)
    .where(eq(slotsTable.zoneId, zoneId))
    .orderBy(asc(slotsTable.slotNumber));

  return res.json(slots.map(s => slotToJson(s, zone?.name ?? "")));
});

router.post("/:slotId/reserve", async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);
  const { vehicleNumber, userId } = req.body;

  if (!vehicleNumber || !String(vehicleNumber).trim()) {
    return res.status(400).json({ error: "vehicleNumber is required" });
  }

  const now = new Date();
  const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.id, slotId));

  if (!slot) return res.status(404).json({ error: "Slot not found" });

  if (slot.status === "RESERVED" && slot.reservedUntil && slot.reservedUntil > now) {
    return res.status(409).json({ error: "Slot is already reserved" });
  }
  if (slot.status === "OCCUPIED") {
    return res.status(409).json({ error: "Slot is occupied" });
  }

  let user: typeof usersTable.$inferSelect | null = null;
  if (userId) {
    const uid = parseInt(String(userId), 10);
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, uid));
    if (u?.isBlockedUntil && u.isBlockedUntil > now) {
      return res.status(403).json({ error: "Your account is blocked. Contact admin." });
    }
    user = u ?? null;
  }

  const userEffectiveScore = (user?.priorityScore ?? 0);

  if (userEffectiveScore < 0 && user) {
    const highPriorityWaiting = await db.select().from(waitingListTable).where(
      and(
        eq(waitingListTable.zoneId, slot.zoneId),
        eq(waitingListTable.status, "WAITING"),
      )
    ).then(rows => rows.filter(r => r.userScore >= 0));

    if (highPriorityWaiting.length > 0) {
      const expiresAt = new Date(now.getTime() + WAIT_EXPIRY_MINUTES * 60 * 1000);
      const [entry] = await db.insert(waitingListTable).values({
        userId: user.id,
        zoneId: slot.zoneId,
        vehicleNumber: String(vehicleNumber).trim().toUpperCase(),
        userScore: userEffectiveScore,
        status: "WAITING",
        expiresAt,
      }).returning();

      const allWaiting = await db.select().from(waitingListTable).where(
        and(eq(waitingListTable.zoneId, slot.zoneId), eq(waitingListTable.status, "WAITING"))
      );
      const position = allWaiting.findIndex(r => r.id === entry.id) + 1;

      return res.json({
        status: "WAITING",
        waitingId: entry.id,
        position,
        zoneId: slot.zoneId,
        message: `You're #${position} in the queue. Higher-priority users are ahead. We'll auto-reserve a slot for you.`,
      });
    }
  }

  const reservedUntil = new Date(now.getTime() + 5 * 60 * 1000);
  const qrToken = randomUUID();

  const [updated] = await db.update(slotsTable).set({
    status: "RESERVED",
    reservedUntil,
    vehicleNumber: String(vehicleNumber).trim().toUpperCase(),
    userId: userId ? parseInt(String(userId), 10) : null,
    entryTime: null,
    qrToken,
    penaltyApplied: false,
  }).where(eq(slotsTable.id, slotId)).returning();

  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, updated.zoneId));

  return res.json({ status: "RESERVED", ...slotToJson(updated, zone?.name ?? "") });
});

router.post("/:slotId/cancel", async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);
  const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.id, slotId));

  if (!slot) return res.status(404).json({ error: "Slot not found" });
  if (slot.status !== "RESERVED") {
    return res.json({ message: "Slot already free" });
  }

  await db.update(slotsTable).set({
    status: "FREE",
    reservedUntil: null,
    qrToken: null,
    vehicleNumber: null,
    userId: null,
    penaltyApplied: false,
  }).where(eq(slotsTable.id, slotId));

  await processWaitingList(slot.zoneId);

  return res.json({ message: "Reservation cancelled" });
});

router.post("/:slotId/confirm", async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);
  const { vehicleNumber } = req.body;

  if (!vehicleNumber) {
    return res.status(400).json({ error: "vehicleNumber required" });
  }

  const now = new Date();
  const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.id, slotId));

  if (!slot) return res.status(404).json({ error: "Slot not found" });
  if (slot.status !== "RESERVED") {
    return res.status(409).json({ error: "Slot is not reserved. Reserve it first." });
  }
  if (slot.reservedUntil && slot.reservedUntil < now) {
    await db.update(slotsTable).set({
      status: "FREE", reservedUntil: null, qrToken: null, userId: null, penaltyApplied: false,
    }).where(eq(slotsTable.id, slotId));
    return res.status(409).json({ error: "Reservation expired" });
  }

  const [updated] = await db.update(slotsTable).set({
    status: "OCCUPIED",
    vehicleNumber,
    entryTime: now,
    reservedUntil: null,
    qrToken: null,
    penaltyApplied: false,
  }).where(eq(slotsTable.id, slotId)).returning();

  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, updated.zoneId));

  return res.json({
    slotId: updated.id,
    slotNumber: updated.slotNumber,
    zoneName: zone?.name ?? "",
    vehicleNumber: updated.vehicleNumber!,
    entryTime: updated.entryTime!.toISOString(),
  });
});

router.post("/:slotId/exit", async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);
  const now = new Date();

  const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.id, slotId));
  if (!slot || slot.status !== "OCCUPIED") {
    return res.status(404).json({ error: "No active parking session" });
  }

  const entryTime = slot.entryTime ?? now;
  const durationMs = now.getTime() - entryTime.getTime();
  const durationMinutes = Math.ceil(durationMs / 60000);
  const overstayed = durationMs > OVERSTAY_MINUTES * 60 * 1000;

  await db.insert(historyTable).values({
    vehicleNumber: slot.vehicleNumber!,
    slotId: slot.id,
    userId: slot.userId ?? null,
    entryTime,
    exitTime: now,
    pointsEarned: 10,
  });

  if (slot.userId) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, slot.userId));
    if (u) {
      let scoreDelta = 0;
      let reason = "";

      if (overstayed && !slot.penaltyApplied) {
        scoreDelta = -1;
        reason = "overstay_exit";
      }

      await db.update(usersTable).set({
        points: u.points + 10,
        priorityScore: u.priorityScore + scoreDelta,
        violationCount: 0,
        isBlockedUntil: null,
      }).where(eq(usersTable.id, u.id));

      if (scoreDelta !== 0) {
        await logScore(u.id, scoreDelta, reason);
      }
    }
  }

  await db.update(slotsTable).set({
    status: "FREE",
    vehicleNumber: null,
    userId: null,
    entryTime: null,
    reservedUntil: null,
    qrToken: null,
    penaltyApplied: false,
  }).where(eq(slotsTable.id, slotId));

  await processWaitingList(slot.zoneId);

  const wasOverstay = overstayed && !slot.penaltyApplied;
  const alreadyPenalised = slot.penaltyApplied;

  return res.json({
    message: "Parking exited successfully",
    duration: durationMinutes,
    pointsEarned: 10,
    overstayed: overstayed || alreadyPenalised,
    scoreDelta: wasOverstay ? -1 : alreadyPenalised ? -1 : 0,
  });
});

router.post("/:slotId/reset", async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);
  const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.id, slotId));

  if (!slot) return res.status(404).json({ error: "Slot not found" });

  if (slot.status === "OCCUPIED" && slot.userId) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, slot.userId));
    if (u) {
      const newViolation = u.violationCount + 1;
      let newPoints = Math.max(0, u.points - 5);
      let isBlockedUntil: Date | null = u.isBlockedUntil;
      if (newViolation >= 2) {
        newPoints = 0;
        isBlockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
      await db.update(usersTable).set({
        points: newPoints,
        violationCount: newViolation,
        isBlockedUntil,
      }).where(eq(usersTable.id, u.id));
    }
  }

  const [updated] = await db.update(slotsTable).set({
    status: "FREE",
    vehicleNumber: null,
    userId: null,
    entryTime: null,
    reservedUntil: null,
    qrToken: null,
    penaltyApplied: false,
  }).where(eq(slotsTable.id, slotId)).returning();

  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, updated.zoneId));

  await processWaitingList(updated.zoneId);
  return res.json(slotToJson(updated, zone?.name ?? ""));
});

router.post("/admin/add", async (req, res) => {
  const { zoneId, slotNumber } = req.body;
  if (!zoneId || !slotNumber) return res.status(400).json({ error: "zoneId and slotNumber required" });

  const [slot] = await db.insert(slotsTable).values({ zoneId, slotNumber, status: "FREE" }).returning();
  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, slot.zoneId));

  return res.status(201).json(slotToJson(slot, zone?.name ?? ""));
});

router.delete("/admin/:slotId", async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);
  await db.delete(slotsTable).where(eq(slotsTable.id, slotId));
  return res.json({ message: "Slot deleted" });
});

export default router;
