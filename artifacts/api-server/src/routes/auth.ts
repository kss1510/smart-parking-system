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

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash: hashPassword(password),
    isAdmin: false,
  }).returning();

  const token = generateToken(user.id, user.email);
  return res.status(201).json({ token, userId: user.id, email: user.email, isAdmin: user.isAdmin });
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

  const token = generateToken(user.id, user.email);
  return res.json({ token, userId: user.id, email: user.email, isAdmin: user.isAdmin });
});

export default router;
