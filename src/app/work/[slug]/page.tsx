// work [slug] page
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Project, ProjectDetailResponse } from "@/types/project";
import ProjectDetail from "@/components/ProjectDetail";
import type { MediaItem } from "@/types/media";
import { normalizeMediaPath } from "@/lib/url";
import { getBaseUrl } from "@/lib/requestBase";

export const revalidate = 60;

type PageParams = { params: { slug: string } };

async function fetchProject(slug: string): Promise<Project | null> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/projects/${slug}`, {
    next: { revalidate },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch project: ${res.status}`);
  const data = (await res.json()) as ProjectDetailResponse;
  return (data as unknown as Project) ?? null;
}

function normalizeImages(
  media?: Array<MediaItem | string | null | undefined>
): MediaItem[] {
  if (!Array.isArray(media)) return [];
  return media
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
}

function pickDescription(p: unknown): string | undefined {
  if (!p || typeof p !== "object") return undefined;
  const rec = p as Record<string, unknown>;
  const ex = rec["excerpt"];
  if (typeof ex === "string") return ex;
  const desc = rec["description"];
  return typeof desc === "string" ? desc : undefined;
}

// ---- SEO ----
export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = params;
  const item = await fetchProject(slug);
  if (!item) return { title: "Project not found • Work" };

  const title = item.title ?? slug;
  const description = pickDescription(item) ?? "Project detail";

  const media = normalizeImages(item.media);
  const ogImg = media[0]?.url ?? undefined;

  return {
    title: `${title} • Work`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: ogImg ? [{ url: ogImg }] : undefined,
    },
    twitter: {
      card: ogImg ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImg ? [ogImg] : undefined,
    },
  };
}

export default async function WorkDetailPage({ params }: PageParams) {
  const { slug } = params;
  const item = await fetchProject(slug);
  if (!item) notFound();
  return <ProjectDetail project={item} />;
}
