import { z } from "zod";
import { Relation } from "./common";

export const ResumeSection = z.enum([
  "experience",
  "projects",
  "education",
  "awards",
  "skills",
  "other",
]);

export const ResumeItemInput = z.object({
  section: ResumeSection,
  title: z.string().min(1),
  organization: z.string().optional(),
  location: z.string().optional(),

  startDate: z.string().min(4),
  endDate: z.string().optional(),
  current: z.boolean().default(false),

  bullets: z.array(z.string()).default([]),
  links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),

  skills: z.array(Relation).default([]),
  tags: z.array(z.string()).default([]),

  order: z.number().int().optional(),
  hidden: z.boolean().default(false),
});
export type ResumeItemInput = z.infer<typeof ResumeItemInput>;

export const ResumeItemDTO = ResumeItemInput.extend({
  _id: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type ResumeItemDTO = z.infer<typeof ResumeItemDTO>;

// update resume
export const ResumeItemUpdate = ResumeItemInput.partial();
export type ResumeItemUpdate = z.infer<typeof ResumeItemUpdate>;
