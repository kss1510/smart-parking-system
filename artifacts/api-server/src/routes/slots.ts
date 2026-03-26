import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { slotsTable, zonesTable, historyTable } from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/suggest", async (_req, res) => {
  const zones = await db.select().from(zonesTable).orderBy(zonesTable.name);

  let bestSlot: (typeof slotsTable.$inferSelect & { zoneName: string }) | null = null;
  let minOccupied = Infinity;

  for (const zone of zones) {
    const allSlots = await db.select().from(slotsTable).where(eq(slotsTable.zoneId, zone.id));
    const freeSlots = allSlots.filter(s => s.status === "FREE");
    const occupiedCount = allSlots.filter(s => s.status === "OCCUPIED").length;

    if (freeSlots.length > 0 && occupiedCount < minOccupied) {
      minOccupied = occupiedCount;
      bestSlot = { ...freeSlots[0], zoneName: zone.name };
    }
  }

  if (!bestSlot) {
    return res.status(404).json({ error: "No available slots" });
  }

  return res.json({
    id: bestSlot.id,
    zoneId: bestSlot.zoneId,
    zoneName: bestSlot.zoneName,
    slotNumber: bestSlot.slotNumber,
    status: bestSlot.status,
    vehicleNumber: bestSlot.vehicleNumber,
    entryTime: bestSlot.entryTime?.toISOString() ?? null,
    reservedUntil: bestSlot.reservedUntil?.toISOString() ?? null,
  });
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
        reservedUntil: null,
      }).where(eq(slotsTable.id, slot.id));
    }
  }

  const slots = await db.select().from(slotsTable)
    .where(eq(slotsTable.zoneId, zoneId))
    .orderBy(asc(slotsTable.slotNumber));

  return res.json(slots.map(s => ({
    id: s.id,
    zoneId: s.zoneId,
    zoneName: zone?.name ?? "",
    slotNumber: s.slotNumber,
    status: s.status,
    vehicleNumber: s.vehicleNumber ?? null,
    entryTime: s.entryTime?.toISOString() ?? null,
    reservedUntil: s.reservedUntil?.toISOString() ?? null,
  })));
});

router.post("/:slotId/reserve", async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);

  const now = new Date();
  const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.id, slotId));

  if (!slot) return res.status(404).json({ error: "Slot not found" });

  if (slot.status === "RESERVED" && slot.reservedUntil && slot.reservedUntil > now) {
    return res.status(409).json({ error: "Slot is already reserved" });
  }
  if (slot.status === "OCCUPIED") {
    return res.status(409).json({ error: "Slot is occupied" });
  }

  const reservedUntil = new Date(now.getTime() + 30 * 1000);
  const [updated] = await db.update(slotsTable).set({
    status: "RESERVED",
    reservedUntil,
    vehicleNumber: null,
    entryTime: null,
  }).where(eq(slotsTable.id, slotId)).returning();

  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, updated.zoneId));

  return res.json({
    id: updated.id,
    zoneId: updated.zoneId,
    zoneName: zone?.name ?? "",
    slotNumber: updated.slotNumber,
    status: updated.status,
    vehicleNumber: updated.vehicleNumber ?? null,
    entryTime: updated.entryTime?.toISOString() ?? null,
    reservedUntil: updated.reservedUntil?.toISOString() ?? null,
  });
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
    await db.update(slotsTable).set({ status: "FREE", reservedUntil: null }).where(eq(slotsTable.id, slotId));
    return res.status(409).json({ error: "Reservation expired" });
  }

  const [updated] = await db.update(slotsTable).set({
    status: "OCCUPIED",
    vehicleNumber,
    entryTime: now,
    reservedUntil: null,
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

  const [history] = await db.insert(historyTable).values({
    vehicleNumber: slot.vehicleNumber!,
    slotId: slot.id,
    entryTime,
    exitTime: now,
  }).returning();

  await db.update(slotsTable).set({
    status: "FREE",
    vehicleNumber: null,
    entryTime: null,
    reservedUntil: null,
  }).where(eq(slotsTable.id, slotId));

  return res.json({
    message: "Parking exited successfully",
    duration: durationMinutes,
    historyId: history.id,
  });
});

router.post("/:slotId/reset", async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);

  const [updated] = await db.update(slotsTable).set({
    status: "FREE",
    vehicleNumber: null,
    entryTime: null,
    reservedUntil: null,
  }).where(eq(slotsTable.id, slotId)).returning();

  if (!updated) return res.status(404).json({ error: "Slot not found" });

  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, updated.zoneId));

  return res.json({
    id: updated.id,
    zoneId: updated.zoneId,
    zoneName: zone?.name ?? "",
    slotNumber: updated.slotNumber,
    status: updated.status,
    vehicleNumber: null,
    entryTime: null,
    reservedUntil: null,
  });
});

router.post("/admin/add", async (req, res) => {
  const { zoneId, slotNumber } = req.body;
  if (!zoneId || !slotNumber) return res.status(400).json({ error: "zoneId and slotNumber required" });

  const [slot] = await db.insert(slotsTable).values({ zoneId, slotNumber, status: "FREE" }).returning();
  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, slot.zoneId));

  return res.status(201).json({
    id: slot.id,
    zoneId: slot.zoneId,
    zoneName: zone?.name ?? "",
    slotNumber: slot.slotNumber,
    status: slot.status,
    vehicleNumber: null,
    entryTime: null,
    reservedUntil: null,
  });
});

router.delete("/admin/:slotId", async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);
  await db.delete(slotsTable).where(eq(slotsTable.id, slotId));
  return res.json({ message: "Slot deleted" });
});

export default router;
