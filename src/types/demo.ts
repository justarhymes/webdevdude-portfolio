// Minimal Demo type (adjust fields as your data evolves).
// This defines `url` and `repoUrl` so DemoLinks can alias them.

export type Demo = {
  slug: string;
  title: string;

  // Optional metadata
  subtitle?: string;
  description?: string;
  excerpt?: string;

  // Links
  url?: string;      // live URL
  repoUrl?: string;  // optional repository URL

  // Extras (optional)
  tags?: string[];
  featured?: boolean;
  published?: boolean;
  order?: number;
};
