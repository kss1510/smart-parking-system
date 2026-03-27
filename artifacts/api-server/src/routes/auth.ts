import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt_campus_parking").digest("hex");
}

function generateToken(userId: number, email: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64");
  return `tok_${payload}`;
}

function userResponse(user: typeof usersTable.$inferSelect, token: string) {
  return {
    token,
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
    isFaculty: user.isFaculty,
    name: user.name ?? null,
    registrationId: user.registrationId ?? null,
    vehicleNumber: user.vehicleNumber ?? null,
    points: user.points,
    violationCount: user.violationCount,
    priorityScore: user.priorityScore,
    isBlockedUntil: user.isBlockedUntil?.toISOString() ?? null,
  };
}

router.post("/register", async (req, res) => {
  const { email, password, name, registrationId, vehicleNumber, adminCode } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const isAdmin = adminCode === "ADMIN123";

  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash: hashPassword(password),
    isAdmin,
    name: name ? String(name).trim() : null,
    registrationId: registrationId ? String(registrationId).trim() : null,
    vehicleNumber: vehicleNumber ? String(vehicleNumber).trim().toUpperCase() : null,
  }).returning();

  const token = generateToken(user.id, user.email);
  return res.status(201).json(userResponse(user, token));
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(401).json({ error: "Email and password required" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const now = new Date();
  if (user.isBlockedUntil && user.isBlockedUntil > now) {
    return res.status(403).json({
      error: `Account blocked until ${user.isBlockedUntil.toISOString()}. Contact admin.`,
    });
  }

  const token = generateToken(user.id, user.email);
  return res.json(userResponse(user, token));
});

router.get("/profile/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return res.status(404).json({ error: "User not found" });
  const token = generateToken(user.id, user.email);
  return res.json(userResponse(user, token));
});

router.patch("/profile/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const { name, registrationId, vehicleNumber } = req.body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = String(name).trim() || null;
  if (registrationId !== undefined) updates.registrationId = String(registrationId).trim() || null;
  if (vehicleNumber !== undefined) updates.vehicleNumber = String(vehicleNumber).trim().toUpperCase() || null;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!user) return res.status(404).json({ error: "User not found" });

  const token = generateToken(user.id, user.email);
  return res.json(userResponse(user, token));
});

export default router;
