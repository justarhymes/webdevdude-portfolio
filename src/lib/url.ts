/** Join helper that ensures exactly one slash between parts. */
function joinUrl(a: string, b: string): string {
  const left = a.replace(/\/+$/, "");
  const right = b.replace(/^\/+/, "");
  return `${left}/${right}`;
}

/** "https://www.gamersensei.com/foo" → "gamersensei.com" */
export function cleanLinkText(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
  }
}

/**
 * Normalize media paths for Next/Image:
 * - absolute (http/https) → returned as-is
 * - otherwise → prefixed with S3_BASE_URL when present
 * - if S3_BASE_URL is not set, fall back to site-relative "/path"
 *
 * Examples (S3_BASE_URL="https://bucket.s3.amazonaws.com/images"):
 *   "cor/thumb.jpg"  -> "https://bucket.s3.amazonaws.com/images/cor/thumb.jpg"
 *   "/cor/thumb.jpg" -> "https://bucket.s3.amazonaws.com/images/cor/thumb.jpg"
 *   "https://x/y.jpg"-> "https://x/y.jpg"
 */
export function normalizeMediaPath(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const s3 = process.env.S3_BASE_URL;
  if (s3 && s3.length) {
    return joinUrl(s3, path);
  }
  // Fallback: make it site-relative so Next/Image accepts it
  return `/${path.replace(/^\/+/, "")}`;
}
