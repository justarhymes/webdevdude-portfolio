export type MediaItem = {
  url: string;           // absolute or S3-based URL
  alt?: string;          // alt text for accessibility
  width?: number;
  height?: number;
  type?: "image" | "embed";
};