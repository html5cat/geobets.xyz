import { z } from "zod";

export const addressRegex = /^0x[a-fA-F0-9]{40}$/;

export const createGameSchema = z.object({
  imageId: z.string().min(1),
  commitMinutes: z.number().int().min(1).max(24 * 60).optional(),
  revealMinutes: z.number().int().min(1).max(24 * 60).optional(),
});

export const createBetCommitSchema = z.object({
  gameId: z.union([z.string(), z.number()]),
  player: z.string().regex(addressRegex),
  amountWei: z.string().regex(/^\d+$/),
  commit: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  commitTx: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  imageId: z.string().optional(),
});

export const revealPatchSchema = z.object({
  gameId: z.union([z.string(), z.number()]),
  player: z.string().regex(addressRegex),
  latE6: z.number().int(),
  lonE6: z.number().int(),
  revealTx: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
});

export const betsQuerySchema = z.object({
  player: z.string().regex(addressRegex).optional(),
  game: z.string().regex(/^\d+$/).optional(),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;
