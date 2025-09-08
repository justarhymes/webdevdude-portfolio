import { z } from "zod";

export const Relation = z.object({
  slug: z.string().min(1),
  name: z.string().optional(),
  _new: z.boolean().optional() // create if true
});

export type Relation = z.infer<typeof Relation>;