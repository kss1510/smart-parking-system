import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { zonesTable, slotsTable, usersTable } from "@workspace/db/schema";
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

// Dijkstra-based zone suggestion endpoint
// Graph: campus entrance → each zone, edge weight = congestion ratio
// Users with lower priorityScore get lower-ranked suggestions
router.get("/suggest", async (req, res) => {
  const userId = req.query.userId ? parseInt(String(req.query.userId), 10) : null;

  const zones = await db.select().from(zonesTable).orderBy(zonesTable.name);

  const zoneStats = await Promise.all(zones.map(async (zone) => {
    const allSlots = await db.select().from(slotsTable).where(eq(slotsTable.zoneId, zone.id));
    const total = allSlots.length;
    const free = allSlots.filter(s => s.status === "FREE" && s.slotType !== "FACULTY").length;
    const occupied = allSlots.filter(s => s.status === "OCCUPIED").length;
    const reserved = allSlots.filter(s => s.status === "RESERVED").length;
    const congestionRatio = total > 0 ? (occupied + reserved) / total : 0;
    const congestionPct = Math.round(congestionRatio * 100);
    return { zone, total, free, occupied, reserved, congestionRatio, congestionPct };
  }));

  // Dijkstra: entrance (node 0) → zone nodes
  // Edge weight = 1 (base distance) + congestionRatio (0..1)
  // Zones connect to each other with congestion-based transfer cost
  const n = zoneStats.length;
  const INF = Infinity;
  const dist: number[] = new Array(n + 1).fill(INF);
  const visited: boolean[] = new Array(n + 1).fill(false);
  dist[0] = 0; // entrance node

  // Adjacency: entrance (0) → each zone i+1 with weight = 1 + congestionRatio
  // Zones i → j transfer cost = avg congestion of destination
  const edgeWeight = (toIdx: number) => 1 + zoneStats[toIdx].congestionRatio;
  const transferWeight = (toIdx: number) => 0.5 + zoneStats[toIdx].congestionRatio;

  for (let iter = 0; iter < n + 1; iter++) {
    // Find unvisited node with min distance
    let u = -1;
    for (let i = 0; i <= n; i++) {
      if (!visited[i] && (u === -1 || dist[i] < dist[u])) u = i;
    }
    if (u === -1 || dist[u] === INF) break;
    visited[u] = true;

    if (u === 0) {
      // Entrance → each zone
      for (let i = 0; i < n; i++) {
        const w = edgeWeight(i);
        if (dist[0] + w < dist[i + 1]) dist[i + 1] = dist[0] + w;
      }
    } else {
      // Zone → other zones (transfer)
      for (let i = 0; i < n; i++) {
        if (i + 1 !== u) {
          const w = transferWeight(i);
          if (dist[u] + w < dist[i + 1]) dist[i + 1] = dist[u] + w;
        }
      }
    }
  }

  // Get user priority score to apply bonus/penalty
  let userPriorityScore = 0;
  if (userId) {
    const [user] = await db.select({ priorityScore: usersTable.priorityScore })
      .from(usersTable).where(eq(usersTable.id, userId));
    userPriorityScore = user?.priorityScore ?? 0;
  }

  // Sort zones by routeCost (Dijkstra result)
  const sorted = zoneStats
    .map((z, i) => ({
      zoneId: z.zone.id,
      zoneName: z.zone.name,
      freeSlots: z.free,
      totalSlots: z.total,
      congestionPct: z.congestionPct,
      congestionLevel: z.congestionPct >= 80 ? "high" : z.congestionPct >= 50 ? "medium" : "low" as "low" | "medium" | "high",
      routeCost: dist[i + 1],
    }))
    .filter(z => z.freeSlots > 0)
    .sort((a, b) => a.routeCost - b.routeCost);

  // Apply priority score adjustment: penalized users (score < 0) get pushed toward less-optimal zones
  // This simulates lower slot priority allocation in the queue
  const isPenalized = userPriorityScore < 0;
  const result = sorted.map((z, i) => ({
    ...z,
    recommended: isPenalized ? i === sorted.length - 1 : i === 0,
    priorityBoost: !isPenalized && userPriorityScore === 0 && i === 0,
  }));

  // If penalized, reverse order (show worst zone first as their "recommended")
  if (isPenalized && result.length > 0) {
    result.reverse();
    result[0].recommended = true;
  }

  return res.json(result);
});

export default router;
