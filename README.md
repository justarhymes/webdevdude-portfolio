# Web Port

A Next.js + Mongoose portfolio with typed Zod DTOs, unit + E2E tests, and a clean image-only work gallery. This README captures the architecture, how to run things, data contracts, and the CI/testing setup.

---

## Highlights

- App Router APIs in `app/api/**` (projects, skills, resume, admin)
- Slug-embedded relations for `skills`, `tasks`, `type`, `client`, `studio`
- Typed validation with Zod (domain layer)
- Fast tests with Vitest + in-memory Mongo; E2E with Playwright
- Styling: Tailwind CSS 4 with custom palette + Hack font
- Frontend: `/work` grid (cards) + `/work/[slug]` detail (gallery)
- Image-only gallery behavior:
  - Hero = first entry in `project.media` (file named `page001.jpg` or `page001.png`)
  - Thumbnails show **all** images (including the active one)
  - Thumbs: hand cursor on hover; subtle hover border; solid active border `#e643e0`
- CI: GitHub Actions runs Vitest + Playwright + Mongo service
- Layout reference: see `/layout-work.png`

---

## Tech Stack

- Node: 22 in CI, 20+ locally recommended
- Framework: Next.js 15 (App Router)
- DB: MongoDB 6+ with Mongoose 8
- Types/Validation: TypeScript 5, Zod 4
- Tests: Vitest 3 (+ `@vitest/coverage-v8`), Playwright 1.55
- Styles: Tailwind CSS 4 (PostCSS plugin) + local Hack font

---

## Project Structure (high-level)

src/
app/
api/ # API routes (projects, skills, resume, admin)
work/ # /work and /work/[slug] pages
components/ # UI components (ProjectCard, ProjectGallery, etc.) — import directly (no index barrel)
domain/ # Zod schemas & DTOs
lib/ # Utilities (url, media, db, requestBase, etc.)
models/ # Mongoose schemas
types/ # Shared FE/BE types (SlugRef, Project, MediaItem, links, etc.)
scripts/
seed.ts # Seeds DB from project-data.json
project-data.json # Source data export
tests/
e2e/ # Playwright
unit/ # Vitest

---

## Environment

# .env.local

MONGODB_URI=mongodb://127.0.0.1:27017
MONGO_DB=webdevdude_dev
ADMIN_TOKEN=changeme
S3_BASE_URL=https://bucket.s3.amazonaws.com/images

---

## Layout Plans

### Site Header (global)

Always visible at the top of the page:

- Center (stacked): site name (links to `/`), then subtitle/description
- Right-aligned: link to `/resume`

### Site Footer (global)

- Text with links

### Home (`/`)

- List of Projects — grid preview of projects
- All Skills — summary section
- List of Demos — demo projects/apps section

### Work Detail (`/work/[slug]`)

- Project Details — title, subtitle, meta row (`year • type • client • studio`)
- Hero Image — **first** item in `media` (`page001.*`)
- Gallery Thumbnails — **show all images** (including the current hero); clicking/Enter swaps the hero; thumbs behave like links (pointer cursor) and the active thumb has a visible state
- Skills Chips — tech stack / tags
- Links — `primaryLink` and `secondaryLink`
- Description — project overview
- **Page Flow & Animation (see: Animation Behavior)**
  - On navigation from **Home** or **/work**, the **detail section slides down from above** and becomes the new top of the page.
  - The **previous page’s content remains below it in the same scroll flow** (not an overlay/underlay).
  - From **/work → detail**, the featured block (when implemented) is **removed** from the content that remains below.
  - On **direct load** of `/work/[slug]`, the content shown **below** the detail matches the **Home** version to avoid duplication and keep the experience consistent.
  - Respect `prefers-reduced-motion`.

## Animation Behavior

- **Goal:** A continuous page where the **detail section slides down from above** and the **origin page’s content remains below** in the same scrollable document.
- **Sources:**
  - **Home → /work/[slug]**: keep Home’s below-content under the detail. **(TODO)**
  - **/work → /work/[slug]**: keep the Work grid under the detail, but **omit the featured block** during this state. **(DONE)**
- **Detail → Detail** (`/work/[slugA]` → `/work/[slugB]` while already on a detail page):
  - Do **not** move the grid; only the `<ProjectDetail>` content updates.
  - Animate with a **simple fade-in** of the new detail content (no slide). **(TODO)**
- **Direct Load:** When landing directly on `/work/[slug]`, render the **Home-style below-content** beneath the detail to match the Home→detail experience without duplicating content.
- **Duplication:** Factor shared sections so we **reuse** the same pieces (no duplicates) regardless of entry path.
- **Progressive Enhancement:**
  - Optionally use View Transitions to match **thumb → hero** and **title → title** during grid→detail navigation; provide a no-transition fallback.
  - Always honor `prefers-reduced-motion`.
- **Styling Guardrails:** Keep current minimal styling (no extra rounding); thumbnails show all images with hover cursor and a visible active state.

---

## Getting Started

npm install
npm run dev
npm run build && npm start

## Testing

npm run test # watch
npm run test:run # single run (verbose)
npm run test:cov # coverage
npm run e2e # Playwright
npm run e2e:ui # Playwright UI

---

## Data Contracts (Types)

Core shared types live in `src/types/`:

- `common.ts` — `SlugRef` = `{ slug: string; name?: string }`
- `media.ts` — `MediaItem` (image-only; optional `"embed"`)
- `links.ts` — helper aliases:
  - `ProjectLinks = Pick<Project, "primaryLink" | "secondaryLink">`
  - `DemoLinks = Pick<Demo, "url" | "repoUrl">`
- `project.ts` (excerpt):
  - `Project` fields: `slug`, `title`, `subtitle?`, `description?`, `excerpt?`
  - Relations (slug-embedded): `skills?`, `tasks?`, `type?`, `client?`, `studio?`
  - Media: `thumb?` (cards only), `media?` (first = hero, named `page001.*`)
  - Meta: `featured?`, `published?`, `year?`
  - Extras: `abbreviation?`, `blur_data_url?`, `tags?`
  - Links: `primaryLink?`, `secondaryLink?`
- `skill.ts`, `task.ts`, `client.ts`, `studio.ts`, `type.ts` — all alias `SlugRef`
- `demo.ts` — minimal demo entity with `url?` and `repoUrl?`

---

## CI

GitHub Actions workflow:

- Install + cache dependencies
- Spin up Mongo service
- Run Vitest (with coverage) and Playwright
- Build the app

---

## Roadmap / Next Steps

1. **Project featured/order** - Incorporate order and featured into projects (as shown in the model)
2. **Home → /work/[slug] slide-down**
   - Implement slide-down detail when navigating from **Home**; keep Home’s content below the detail in the same flow.
3. **Detail→Detail fade on `/work/[slug]`**
   - While already on a detail page, switch to a **fade-in** of `<ProjectDetail>` when changing slugs; no slide, grid stays put.
4. **View Transition polish (progressive enhancement)**
   - Only where it adds value: match `viewTransitionName` for **thumb → hero** and **title → title** on grid→detail.
   - Fix bugs with transition (currently detail stays open and never closes)
5. **Tailwind polish** — consistent spacing, chips, tokens
6. **`/resume` route** — list + detail for resume items
7. **Demos section** — cards + detail with `DemoLinks`
8. **Contract tests** — ensure FE fields match API (types stay in sync, including `tasks`)
