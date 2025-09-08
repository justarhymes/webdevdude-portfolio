import { z } from "zod";
import { Relation } from "./common";

export const DemoInput = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().optional(),
  description: z.string().optional(),
  url: z.url().optional(),
  repoUrl: z.url().optional(),
  thumb: z.string().optional(),
  media: z.array(z.string()).default([]), // array of paths

  skills: z.array(Relation).default([]),
  type: Relation.optional(),
  client: Relation.optional(),
  studio: Relation.optional(),

  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  order: z.number().int().optional(),
});
export type DemoInput = z.infer<typeof DemoInput>;

export const DemoDTO = DemoInput.extend({
  _id: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type DemoDTO = z.infer<typeof DemoDTO>;

// update demo
export const DemoUpdate = DemoInput.partial();
export type DemoUpdate = z.infer<typeof DemoUpdate>;