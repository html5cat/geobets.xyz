import { pgTable, varchar, text, integer, bigint, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  address: varchar("address", { length: 42 }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const images = pgTable("images", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: text("title"),
  storageKey: text("storage_key").notNull(),
  publicUrl: text("public_url").notNull(),
  latE6: integer("lat_e6").notNull(),
  lonE6: integer("lon_e6").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const games = pgTable("games", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  imageId: varchar("image_id", { length: 64 }).notNull(),
  hostAddress: varchar("host_address", { length: 42 }).notNull(),
  solutionCommit: varchar("solution_commit", { length: 66 }).notNull(),
  commitDeadline: bigint("commit_deadline", { mode: "number" }).notNull(),
  revealDeadline: bigint("reveal_deadline", { mode: "number" }).notNull(),
  secret: varchar("secret", { length: 66 }).notNull(),
  solutionLatE6: integer("solution_lat_e6").notNull(),
  solutionLonE6: integer("solution_lon_e6").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  settledAt: timestamp("settled_at", { withTimezone: true }),
});

export const bets = pgTable("bets", {
  id: varchar("id", { length: 64 }).primaryKey(),
  gameId: bigint("game_id", { mode: "number" }).notNull(),
  player: varchar("player", { length: 42 }).notNull(),
  amountWei: bigint("amount_wei", { mode: "bigint" }).notNull(),
  commit: varchar("commit", { length: 66 }).notNull(),
  commitTx: varchar("commit_tx", { length: 66 }),
  revealTx: varchar("reveal_tx", { length: 66 }),
  revealedLatE6: integer("revealed_lat_e6"),
  revealedLonE6: integer("revealed_lon_e6"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});


