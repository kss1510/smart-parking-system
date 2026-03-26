import { pgTable, serial, text, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const slotStatusEnum = pgEnum("slot_status", ["FREE", "RESERVED", "OCCUPIED"]);
export const slotTypeEnum = pgEnum("slot_type", ["STUDENT", "FACULTY", "ANY"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  isFaculty: boolean("is_faculty").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const zonesTable = pgTable("zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const slotsTable = pgTable("slots", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id").notNull().references(() => zonesTable.id, { onDelete: "cascade" }),
  slotNumber: text("slot_number").notNull(),
  status: slotStatusEnum("status").notNull().default("FREE"),
  slotType: slotTypeEnum("slot_type").notNull().default("ANY"),
  vehicleNumber: text("vehicle_number"),
  entryTime: timestamp("entry_time"),
  reservedUntil: timestamp("reserved_until"),
  qrToken: text("qr_token"),
});

export const historyTable = pgTable("history", {
  id: serial("id").primaryKey(),
  vehicleNumber: text("vehicle_number").notNull(),
  slotId: integer("slot_id").notNull(),
  entryTime: timestamp("entry_time").notNull(),
  exitTime: timestamp("exit_time"),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export const insertZoneSchema = createInsertSchema(zonesTable).omit({ id: true });
export const insertSlotSchema = createInsertSchema(slotsTable).omit({ id: true });
export const insertHistorySchema = createInsertSchema(historyTable).omit({ id: true });

export type User = typeof usersTable.$inferSelect;
export type Zone = typeof zonesTable.$inferSelect;
export type Slot = typeof slotsTable.$inferSelect;
export type History = typeof historyTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSlot = z.infer<typeof insertSlotSchema>;
