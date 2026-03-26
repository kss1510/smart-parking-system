import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { slotsTable, zonesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/active", async (req, res) => {
  const vehicleNumber = req.query.vehicleNumber as string | undefined;

  let slots = await db.select().from(slotsTable).where(eq(slotsTable.status, "OCCUPIED")).limit(10);

  if (vehicleNumber) {
    slots = slots.filter(s => s.vehicleNumber === vehicleNumber);
  }

  const slot = slots[0];
  if (!slot) {
    return res.json({ session: null });
  }

  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, slot.zoneId));

  return res.json({
    session: {
      slotId: slot.id,
      slotNumber: slot.slotNumber,
      zoneName: zone?.name ?? "",
      vehicleNumber: slot.vehicleNumber!,
      entryTime: slot.entryTime?.toISOString() ?? new Date().toISOString(),
    },
  });
});

export default router;
