import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { slotsTable, zonesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/active", async (req, res) => {
  const vehicleNumber = req.query.vehicleNumber as string | undefined;
  const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;

  const allOccupied = await db
    .select()
    .from(slotsTable)
    .where(eq(slotsTable.status, "OCCUPIED"))
    .limit(50);

  let slot = null;
  if (userId && !isNaN(userId)) {
    slot = allOccupied.find(s => s.userId === userId) ?? null;
  } else if (vehicleNumber) {
    slot = allOccupied.find(s => s.vehicleNumber === vehicleNumber) ?? null;
  } else {
    slot = allOccupied[0] ?? null;
  }

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
