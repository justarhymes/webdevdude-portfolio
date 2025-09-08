// work [slug] page
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Project, ProjectDetailResponse } from "@/types/project";
import ProjectDetail from "@/components/ProjectDetail";
import type { MediaItem } from "@/types/media";
import { normalizeMediaPath } from "@/lib/url";
import { getBaseUrl } from "@/lib/requestBase";

export const revalidate = 60;

type PageParams = { params: Promise<{ slug: string }> };

async function fetchProject(slug: string): Promise<Project | null> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/projects/${slug}`, { next: { revalidate } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch project: ${res.status}`);
  const data = (await res.json()) as ProjectDetailResponse;
  return (data as unknown as Project) ?? null;
}

// ---- SEO ----
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const item = await fetchProject(slug);
  if (!item) return { title: "Project not found • Work" };

  const title = item.title ?? slug;
  const description = (item as any).excerpt ?? item.description ?? "Project detail";

  const media: MediaItem[] = Array.isArray(item.media)
    ? (item.media
        .map((m: any) => {
          if (!m) return null;
          if (typeof m === "string") {
            const url = normalizeMediaPath(m);
            return url ? ({ url } as MediaItem) : null;
          }
          const url = normalizeMediaPath(m.url);
          return url ? ({ ...m, url } as MediaItem) : null;
        })
        .filter(Boolean) as MediaItem[])
    : [];

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
  const { slug } = await params;
  const item = await fetchProject(slug);
  if (!item) notFound();
  const project = item as Project;

  return <ProjectDetail project={project} />;
}
