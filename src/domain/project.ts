import { z } from "zod";
import { Relation } from "./common";

export const ProjectInput = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),

  summary: z.string().optional(),
  description: z.string().optional(),
  url: z.url().optional(),
  repoUrl: z.url().optional(),
  thumb: z.string().optional(),
  media: z.array(z.string()).default([]),

  skills: z.array(Relation).default([]),
  tasks: z.array(Relation).default([]),
  type: Relation.optional(),
  client: Relation.optional(),
  studio: Relation.optional(),

  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  order: z.number().int().optional(),
});
export type ProjectInput = z.infer<typeof ProjectInput>;

export const ProjectDTO = ProjectInput.extend({
  _id: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type ProjectDTO = z.infer<typeof ProjectDTO>;

export const ProjectUpdate = ProjectInput.partial();
export type ProjectUpdate = z.infer<typeof ProjectUpdate>;
