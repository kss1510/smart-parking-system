import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { slotsTable, zonesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/slots", async (req, res) => {
  const { zoneId, slotNumber } = req.body;
  if (!zoneId || !slotNumber) {
    return res.status(400).json({ error: "zoneId and slotNumber required" });
  }

  const [slot] = await db.insert(slotsTable).values({
    zoneId: parseInt(String(zoneId), 10),
    slotNumber: String(slotNumber),
    status: "FREE",
  }).returning();

  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, slot.zoneId));

  return res.status(201).json({
    id: slot.id,
    zoneId: slot.zoneId,
    zoneName: zone?.name ?? "",
    slotNumber: slot.slotNumber,
    status: slot.status,
    slotType: slot.slotType,
    vehicleNumber: null,
    entryTime: null,
    reservedUntil: null,
    qrToken: null,
  });
});

router.delete("/slots/:slotId", async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);
  await db.delete(slotsTable).where(eq(slotsTable.id, slotId));
  return res.json({ message: "Slot deleted" });
});

router.post("/verify-qr", async (req, res) => {
  const { token } = req.body;

  if (!token || !String(token).trim()) {
    return res.status(400).json({ error: "QR token is required" });
  }

  const now = new Date();

  const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.qrToken, String(token).trim()));

  if (!slot) {
    return res.status(404).json({ error: "Invalid QR code. No matching reservation found." });
  }

  if (slot.status !== "RESERVED") {
    return res.status(409).json({ error: "This slot is not in a reserved state." });
  }

  if (slot.reservedUntil && slot.reservedUntil < now) {
    await db.update(slotsTable).set({
      status: "FREE",
      vehicleNumber: null,
      reservedUntil: null,
      qrToken: null,
    }).where(eq(slotsTable.id, slot.id));
    return res.status(410).json({ error: "Reservation has expired. Slot has been released." });
  }

  const [updated] = await db.update(slotsTable).set({
    status: "OCCUPIED",
    entryTime: now,
    reservedUntil: null,
    qrToken: null,
  }).where(eq(slotsTable.id, slot.id)).returning();

  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, updated.zoneId));

  return res.json({
    slotId: updated.id,
    slotNumber: updated.slotNumber,
    zoneName: zone?.name ?? "",
    vehicleNumber: updated.vehicleNumber!,
    entryTime: updated.entryTime!.toISOString(),
  });
});

export default router;
