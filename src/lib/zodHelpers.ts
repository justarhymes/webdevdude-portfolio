import { z } from "zod";

// Integer (no legacy int())
export const zInt = z.coerce.number().refine(Number.isInteger, { message: "Expected Integer" });

// Positive integer
export const zPosInt = zInt.refine((n) => n > 0, { message: "Must be > 0" });

// Limit helper: positive int with max + default
export const zLimit = (max: number, def: number) =>
  zPosInt.max(max, { message: `Max ${max}` }).default(def);

// Optional flag as integer (1 -> on). Keep int form to avoid changing your filters
export const zFlagInt = zInt.optional();