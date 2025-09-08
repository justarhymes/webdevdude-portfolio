import { WithId, WithTimestamps } from "./common";

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
    title: string;          // Role or item title
    org?: string;           // Company / School
    location?: string;      // City, ST (optional)
    start?: string;         // "2023-05"
    end?: string;           // "Present" or "2025-01"
    bullets?: string[];     // Markdown-friendly bullets
    links?: { label: string; href: string }[];
    tags?: string[];        // quick chips
    order?: number;
  };