import { normalizeMediaPath } from "@/lib/url";
import type { MediaItem } from "@/types/media";

/** Thin alias so components can stay importing from "@/lib/media". */
export function mediaUrl(path?: string | null): string | null {
  return normalizeMediaPath(path);
}

/**
 * Accepts a mixed array of MediaItem | string | null/undefined and returns clean MediaItem[].
 * - strings are treated as relative/absolute paths and normalized via normalizeMediaPath
 * - partial MediaItem objects have their `url` normalized
 */
export function normalizeMediaItems(
  media?: Array<MediaItem | string | null | undefined>
): MediaItem[] {
  if (!Array.isArray(media)) return [];
  const normalized = media
    .map((m) => {
      if (!m) return null;
      if (typeof m === "string") {
        const url = normalizeMediaPath(m);
        return url ? ({ url } as MediaItem) : null;
      }
      const maybe = m as Partial<MediaItem>;
      const url = normalizeMediaPath(maybe.url);
      return url ? ({ ...maybe, url } as MediaItem) : null;
    })
    .filter(Boolean) as MediaItem[];
  return normalized;
}
