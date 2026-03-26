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
    vehicleNumber: null,
    entryTime: null,
    reservedUntil: null,
  });
});

router.delete("/slots/:slotId", async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);
  await db.delete(slotsTable).where(eq(slotsTable.id, slotId));
  return res.json({ message: "Slot deleted" });
});

export default router;
