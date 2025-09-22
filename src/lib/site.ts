export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const SITE_OWNER = "Justin King";

// Home default; subpages use "%s | Justin King"
export const SITE_TITLE_DEFAULT = `${SITE_OWNER} | Web Developer Dude`;
export const SITE_TITLE_TEMPLATE = `%s | ${SITE_OWNER}`;

// --- SEO-tuned descriptions (≤160 chars) ---
export const SITE_DESCRIPTION =
  "Justin King is a senior frontend/full-stack engineer in Los Angeles building fast, accessible apps with React, Next.js, and TypeScript.";

export const TITLE_HOME = SITE_TITLE_DEFAULT; // optional alias

export const TITLE_WORK = "Work";
export const DESC_WORK =
  "Projects and case studies by Justin King: production React/Next.js apps, design systems, and full-stack builds in TypeScript.";

export const TITLE_RESUME = "Resume";
export const DESC_RESUME =
  "Resume of Justin King, senior frontend/full-stack engineer (React, Next.js, TypeScript) focused on performance, accessibility, and leadership.";
