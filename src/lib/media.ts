import { normalizeMediaPath } from "@/lib/url";
import type { MediaItem } from "@/types/media";

/** Thin alias so components can stay importing from "@/lib/media". */
export function mediaUrl(path?: string | null): string | null {
  return normalizeMediaPath(path);
}

function withVersion(url: string, version?: string | number): string {
  if (!version) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(String(version))}`;
}

/**
 * Accepts a mixed array of MediaItem | string | null/undefined and returns clean MediaItem[].
 * - strings are treated as relative/absolute paths and normalized via normalizeMediaPath
 * - partial MediaItem objects have their `url` normalized
 */
export function normalizeMediaItems(
  media?: Array<MediaItem | string | null | undefined>,
  opts?: { version?: string | number }
): MediaItem[] {
  if (!Array.isArray(media)) return [];
  const normalized = media
    .map((m) => {
      if (!m) return null;
      if (typeof m === "string") {
        const base = normalizeMediaPath(m);
        const url = base ? withVersion(base, opts?.version) : undefined;
        return url ? ({ url } as MediaItem) : null;
      }
      const maybe = m as Partial<MediaItem>;
      const base = normalizeMediaPath(maybe.url);
      const url = base ? withVersion(base, opts?.version) : undefined;
      return url ? ({ ...maybe, url } as MediaItem) : null;
    })
    .filter(Boolean) as MediaItem[];
  return normalized;
}
