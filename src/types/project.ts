import type { SlugRef } from "./common";
import type { MediaItem } from "./media";

export type Project = {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  excerpt?: string;

  // Relations (slug-embedded)
  skills?: SlugRef[];
  tasks?: SlugRef[];
  type?: SlugRef | null;
  client?: SlugRef | null;
  studio?: SlugRef | null;

  // Media
  // NOTE:
  // - The *first* item in `media` is the hero (page001.*).
  // - `thumb` is for grids/cards only and is never the hero on /work/[slug].
  thumb?: string;
  media?: MediaItem[];

  // Meta
  featured?: boolean;
  published?: boolean;
  year?: number;
  order?: number;

  // Nice-to-haves
  abbreviation?: string;
  blur_data_url?: string;
  tags?: string[];

  // External links (kept as raw fields to match DB)
  primaryLink?: string | null;
  secondaryLink?: string | null;
};

export type ProjectDetailResponse = Project; // GET /api/projects/[slug]
