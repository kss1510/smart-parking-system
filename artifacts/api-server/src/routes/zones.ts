import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { zonesTable, slotsTable } from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const zones = await db.select().from(zonesTable).orderBy(zonesTable.name);

  const zonesWithStats = await Promise.all(zones.map(async (zone) => {
    const allSlots = await db.select().from(slotsTable).where(eq(slotsTable.zoneId, zone.id));
    const totalSlots = allSlots.length;
    const freeSlots = allSlots.filter(s => s.status === "FREE").length;
    const occupiedSlots = allSlots.filter(s => s.status === "OCCUPIED").length;
    const reservedSlots = allSlots.filter(s => s.status === "RESERVED").length;
    return { id: zone.id, name: zone.name, totalSlots, freeSlots, occupiedSlots, reservedSlots };
  }));

  return res.json(zonesWithStats);
});

router.get("/:zoneId/slots", async (req, res) => {
  const zoneId = parseInt(req.params.zoneId, 10);
  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, zoneId));

  if (!zone) return res.status(404).json({ error: "Zone not found" });

  const now = new Date();
  const expiredSlots = await db.select().from(slotsTable).where(
    and(eq(slotsTable.zoneId, zoneId), eq(slotsTable.status, "RESERVED"))
  );
  for (const slot of expiredSlots) {
    if (slot.reservedUntil && slot.reservedUntil < now) {
      await db.update(slotsTable).set({
        status: "FREE",
        vehicleNumber: null,
        reservedUntil: null,
        qrToken: null,
      }).where(eq(slotsTable.id, slot.id));
    }
  }

  const slots = await db.select().from(slotsTable)
    .where(eq(slotsTable.zoneId, zoneId))
    .orderBy(asc(slotsTable.slotNumber));

  return res.json(slots.map(s => ({
    id: s.id,
    zoneId: s.zoneId,
    zoneName: zone.name,
    slotNumber: s.slotNumber,
    status: s.status,
    slotType: s.slotType,
    vehicleNumber: s.vehicleNumber ?? null,
    entryTime: s.entryTime?.toISOString() ?? null,
    reservedUntil: s.reservedUntil?.toISOString() ?? null,
    qrToken: s.qrToken ?? null,
  })));
});

export default router;
