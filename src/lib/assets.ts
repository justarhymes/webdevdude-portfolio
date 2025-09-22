/**
 * S3_BASE_URL is expected to end with `/images`
 * e.g. https://your-bucket.s3.amazonaws.com/images
 */
const RAW_S3 = process.env.S3_BASE_URL ?? "";
export const s3ImagesBase = RAW_S3.replace(/\/+$/, ""); // trim trailing slash(es)

/** Default Open Graph image (…/images/social/og-image.jpg) */
export function ogDefaultImage(): string {
  return `${s3ImagesBase}/social/og-image.jpg`;
}

/**
 * Pass through absolute URLs unchanged; otherwise join to s3ImagesBase.
 * Useful if some media already stores absolute URLs.
 */
const ABSOLUTE = /^https?:\/\//i;
export function s3Image(pathFromImagesRoot: string): string {
  if (!pathFromImagesRoot) return ogDefaultImage();
  if (ABSOLUTE.test(pathFromImagesRoot)) return pathFromImagesRoot;
  const p = pathFromImagesRoot.startsWith("/")
    ? pathFromImagesRoot
    : `/${pathFromImagesRoot}`;
  return `${s3ImagesBase}${p}`;
}
