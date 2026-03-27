import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { slotsTable, zonesTable, historyTable, usersTable } from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

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

  if (userId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parseInt(String(userId), 10)));
    if (user?.isBlockedUntil && user.isBlockedUntil > now) {
      return res.status(403).json({ error: "Your account is blocked. Contact admin." });
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
  }).where(eq(slotsTable.id, slotId)).returning();

  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, updated.zoneId));

  return res.json(slotToJson(updated, zone?.name ?? ""));
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
  }).where(eq(slotsTable.id, slotId));

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
    await db.update(slotsTable).set({ status: "FREE", reservedUntil: null, qrToken: null, userId: null }).where(eq(slotsTable.id, slotId));
    return res.status(409).json({ error: "Reservation expired" });
  }

  const [updated] = await db.update(slotsTable).set({
    status: "OCCUPIED",
    vehicleNumber,
    entryTime: now,
    reservedUntil: null,
    qrToken: null,
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

  await db.insert(historyTable).values({
    vehicleNumber: slot.vehicleNumber!,
    slotId: slot.id,
    userId: slot.userId ?? null,
    entryTime,
    exitTime: now,
    pointsEarned: 10,
  });

  if (slot.userId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, slot.userId));
    if (user) {
      await db.update(usersTable).set({
        points: user.points + 10,
        priorityScore: user.priorityScore - 1,
        violationCount: 0,
        isBlockedUntil: null,
      }).where(eq(usersTable.id, user.id));
    }
  }

  await db.update(slotsTable).set({
    status: "FREE",
    vehicleNumber: null,
    userId: null,
    entryTime: null,
    reservedUntil: null,
    qrToken: null,
  }).where(eq(slotsTable.id, slotId));

  return res.json({
    message: "Parking exited successfully",
    duration: durationMinutes,
    pointsEarned: 10,
  });
});

router.post("/:slotId/reset", async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);
  const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.id, slotId));

  if (!slot) return res.status(404).json({ error: "Slot not found" });

  if (slot.status === "OCCUPIED" && slot.userId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, slot.userId));
    if (user) {
      const newViolation = user.violationCount + 1;
      let newPoints = Math.max(0, user.points - 5);
      let isBlockedUntil: Date | null = user.isBlockedUntil;
      if (newViolation >= 2) {
        newPoints = 0;
        isBlockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
      await db.update(usersTable).set({
        points: newPoints,
        violationCount: newViolation,
        isBlockedUntil,
      }).where(eq(usersTable.id, user.id));
    }
  }

  const [updated] = await db.update(slotsTable).set({
    status: "FREE",
    vehicleNumber: null,
    userId: null,
    entryTime: null,
    reservedUntil: null,
    qrToken: null,
  }).where(eq(slotsTable.id, slotId)).returning();

  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, updated.zoneId));
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
