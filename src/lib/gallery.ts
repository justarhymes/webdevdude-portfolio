import type { Project } from "@/types/project";
import type { MediaItem } from "@/types/media";

/**
 * Pick the initial hero image for a project detail page.
 * Rule (per API): use the first item in `project.media` (page001.*).
 */
export function pickInitialHero(project: Project): MediaItem | undefined {
  return project.media?.[0];
}

/**
 * Build a simple thumbnail strip from media.
 * - Filters out whichever item is currently the hero (by URL).
 */
export function buildThumbs(media: MediaItem[] = [], hero?: MediaItem): MediaItem[] {
  const heroUrl = hero?.url ?? "";
  return media.filter((m) => m.url !== heroUrl);
}
