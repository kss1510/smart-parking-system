import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { slotsTable, zonesTable, usersTable, historyTable, analyticsTable } from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";

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

router.post("/rfid-entry", async (req, res) => {
  const { vehicleNumber } = req.body;

  if (!vehicleNumber || !String(vehicleNumber).trim()) {
    return res.status(400).json({ error: "Vehicle number is required for RFID entry." });
  }

  const plate = String(vehicleNumber).trim().toUpperCase();
  const now = new Date();

  const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.vehicleNumber, plate));

  if (!slot) {
    return res.status(404).json({ error: `No active reservation found for vehicle ${plate}.` });
  }

  if (slot.status !== "RESERVED") {
    return res.status(409).json({ error: "This vehicle's slot is not in a reserved state." });
  }

  if (slot.reservedUntil && slot.reservedUntil < now) {
    await db.update(slotsTable).set({
      status: "FREE",
      vehicleNumber: null,
      userId: null,
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

  let userName: string | null = null;
  let registrationId: string | null = null;
  if (updated.userId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
    userName = user?.name ?? null;
    registrationId = user?.registrationId ?? null;
  }

  await recordAnalytics(updated.zoneId);

  return res.json({
    slotId: updated.id,
    slotNumber: updated.slotNumber,
    zoneName: zone?.name ?? "",
    vehicleNumber: updated.vehicleNumber!,
    entryTime: updated.entryTime!.toISOString(),
    userName,
    registrationId,
  });
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
      userId: null,
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

  let userName: string | null = null;
  let registrationId: string | null = null;
  if (updated.userId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
    userName = user?.name ?? null;
    registrationId = user?.registrationId ?? null;
  }

  await recordAnalytics(updated.zoneId);

  return res.json({
    slotId: updated.id,
    slotNumber: updated.slotNumber,
    zoneName: zone?.name ?? "",
    vehicleNumber: updated.vehicleNumber!,
    entryTime: updated.entryTime!.toISOString(),
    userName,
    registrationId,
  });
});

router.get("/vehicles", async (_req, res) => {
  const slots = await db.select().from(slotsTable).where(eq(slotsTable.status, "OCCUPIED"));

  const results = await Promise.all(slots.map(async (slot) => {
    const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, slot.zoneId));
    let userName: string | null = null;
    let registrationId: string | null = null;
    let userEmail: string | null = null;
    if (slot.userId) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, slot.userId));
      userName = user?.name ?? null;
      registrationId = user?.registrationId ?? null;
      userEmail = user?.email ?? null;
    }
    return {
      slotId: slot.id,
      slotNumber: slot.slotNumber,
      zoneName: zone?.name ?? "",
      vehicleNumber: slot.vehicleNumber ?? "",
      entryTime: slot.entryTime?.toISOString() ?? null,
      userName,
      registrationId,
      userEmail,
      status: slot.status,
    };
  }));

  return res.json(results);
});

router.get("/analytics", async (_req, res) => {
  const zones = await db.select().from(zonesTable);
  const allSlots = await db.select().from(slotsTable);

  const zoneStats = zones.map(zone => {
    const zoneSlots = allSlots.filter(s => s.zoneId === zone.id);
    const total = zoneSlots.length;
    const free = zoneSlots.filter(s => s.status === "FREE").length;
    const occupied = zoneSlots.filter(s => s.status === "OCCUPIED").length;
    const reserved = zoneSlots.filter(s => s.status === "RESERVED").length;
    const usagePct = total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0;
    return { zoneId: zone.id, zoneName: zone.name, total, free, occupied, reserved, usagePct };
  });

  const totalSlots = allSlots.length;
  const freeSlots = allSlots.filter(s => s.status === "FREE").length;
  const occupiedSlots = allSlots.filter(s => s.status === "OCCUPIED").length;
  const reservedSlots = allSlots.filter(s => s.status === "RESERVED").length;

  const recentHistory = await db.select().from(historyTable).orderBy(desc(historyTable.entryTime)).limit(20);

  const topUsers = await db.select({
    userId: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    registrationId: usersTable.registrationId,
    points: usersTable.points,
    violationCount: usersTable.violationCount,
  }).from(usersTable).orderBy(desc(usersTable.points)).limit(10);

  const violators = await db.select({
    userId: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    registrationId: usersTable.registrationId,
    points: usersTable.points,
    violationCount: usersTable.violationCount,
    isBlockedUntil: usersTable.isBlockedUntil,
  }).from(usersTable).where(sql`${usersTable.violationCount} > 0`).orderBy(desc(usersTable.violationCount)).limit(10);

  const zoneOccupancy = zoneStats.map(z => ({
    zoneName: z.zoneName,
    occupancyPct: z.usagePct,
  }));

  const predictiveAlerts: string[] = zoneStats
    .filter(z => z.usagePct >= 80)
    .map(z => `Zone ${z.zoneName} is ${z.usagePct}% full — nearly at capacity`);

  return res.json({
    summary: { totalSlots, freeSlots, occupiedSlots, reservedSlots },
    zoneStats,
    recentHistory,
    topUsers,
    violators,
    zoneOccupancy,
    predictiveAlerts,
  });
});

router.post("/force-free/:slotId", async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);
  const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.id, slotId));

  if (!slot) return res.status(404).json({ error: "Slot not found" });

  if (slot.status === "OCCUPIED" && slot.userId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, slot.userId));
    if (user) {
      const newViolation = user.violationCount + 1;
      let newPoints = user.points;
      let isBlockedUntil: Date | null = user.isBlockedUntil;

      if (newViolation === 1) {
        newPoints = Math.max(0, newPoints - 5);
      } else if (newViolation >= 2) {
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

  await db.update(slotsTable).set({
    status: "FREE",
    vehicleNumber: null,
    userId: null,
    entryTime: null,
    reservedUntil: null,
    qrToken: null,
  }).where(eq(slotsTable.id, slotId));

  return res.json({ message: "Slot force-freed" });
});

router.post("/block-user/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const blockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [user] = await db.update(usersTable).set({ isBlockedUntil: blockUntil }).where(eq(usersTable.id, userId)).returning();
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({ message: `User blocked until ${blockUntil.toISOString()}` });
});

router.post("/unblock-user/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const [user] = await db.update(usersTable).set({ isBlockedUntil: null, violationCount: 0 }).where(eq(usersTable.id, userId)).returning();
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ message: "User unblocked" });
});

router.get("/all-slots", async (_req, res) => {
  const zones = await db.select().from(zonesTable);
  const slots = await db.select().from(slotsTable);

  const result = slots.map(s => {
    const zone = zones.find(z => z.id === s.zoneId);
    return {
      id: s.id,
      slotNumber: s.slotNumber,
      zoneName: zone?.name ?? "",
      zoneId: s.zoneId,
      status: s.status,
      slotType: s.slotType,
      vehicleNumber: s.vehicleNumber ?? null,
      userId: s.userId ?? null,
    };
  });

  return res.json(result);
});

async function recordAnalytics(zoneId: number) {
  try {
    const zoneSlots = await db.select().from(slotsTable).where(eq(slotsTable.zoneId, zoneId));
    const occupied = zoneSlots.filter(s => s.status === "OCCUPIED").length;
    await db.insert(analyticsTable).values({
      zoneId,
      occupancyCount: occupied,
      totalSlots: zoneSlots.length,
    });
  } catch {}
}

export default router;
