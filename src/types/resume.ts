import { WithId, WithTimestamps } from "./common";
import type { SlugRef } from "./common";

export type ResumeSection =
  | "experience"
  | "projects"
  | "education"
  | "skills"
  | "awards"
  | "other";

export type ResumeItem = WithId &
  WithTimestamps & {
    section: ResumeSection;
    title: string; // Role or item title
    organization?: string; // Company / School
    location?: string; // City, ST
    startDate?: string; // "2023-05"
    endDate?: string; // "Present" or "2025-01"
    current?: boolean;
    bullets?: string[]; // Markdown-friendly bullets
    links?: { label: string; href: string }[];
    skills?: SlugRef[]; // Tech stack (linked to global skills)
    tags?: string[]; // Free-form chips
    order?: number;
    hidden?: boolean;
  };
