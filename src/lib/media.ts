import { normalizeMediaPath } from "@/lib/url";

/** Thin alias so components can stay importing from "@/lib/media". */
export function mediaUrl(path?: string | null): string | null {
  return normalizeMediaPath(path);
}
