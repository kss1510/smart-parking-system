import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { historyTable, slotsTable, zonesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const limit = parseInt((req.query.limit as string) ?? "5", 10);

  const records = await db
    .select({
      id: historyTable.id,
      vehicleNumber: historyTable.vehicleNumber,
      slotId: historyTable.slotId,
      entryTime: historyTable.entryTime,
      exitTime: historyTable.exitTime,
      slotNumber: slotsTable.slotNumber,
      zoneName: zonesTable.name,
    })
    .from(historyTable)
    .leftJoin(slotsTable, eq(historyTable.slotId, slotsTable.id))
    .leftJoin(zonesTable, eq(slotsTable.zoneId, zonesTable.id))
    .orderBy(desc(historyTable.entryTime))
    .limit(limit);

  return res.json(records.map(r => {
    const durationMs = r.exitTime && r.entryTime ? r.exitTime.getTime() - r.entryTime.getTime() : null;
    return {
      id: r.id,
      vehicleNumber: r.vehicleNumber,
      slotNumber: r.slotNumber ?? "N/A",
      zoneName: r.zoneName ?? "N/A",
      entryTime: r.entryTime.toISOString(),
      exitTime: r.exitTime?.toISOString() ?? null,
      durationMinutes: durationMs !== null ? Math.ceil(durationMs / 60000) : null,
    };
  }));
});

export default router;
