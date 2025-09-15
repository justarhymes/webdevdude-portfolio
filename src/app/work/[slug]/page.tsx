// work [slug] page
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Project, ProjectDetailResponse } from "@/types/project";
import ProjectDetail from "@/components/ProjectDetail";
import { normalizeMediaItems } from "@/lib/media";
import { getBaseUrl } from "@/lib/requestBase";

export const revalidate = 60;

type PageParams = { params: Promise<{ slug: string }> };

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
  const { slug } = await params;
  const item = await fetchProject(slug);
  if (!item) return { title: "Project not found • Work" };

  const title = item.title ?? slug;
  const description = pickDescription(item) ?? "Project detail";

  const media = normalizeMediaItems(item.media);
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
  return <ProjectDetail project={item} />;
}
