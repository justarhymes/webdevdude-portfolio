// work @detail (..)work [slug] page
import ProjectDetail from "@/components/ProjectDetail";
import type { Project, ProjectDetailResponse } from "@/types/project";
import { getBaseUrl } from "@/lib/requestBase";
import { notFound } from "next/navigation";

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

export default async function InterceptedWorkDetail({ params }: PageParams) {
  const { slug } = await params;
  const project = await fetchProject(slug);
  if (!project) notFound();

  // Only the detail section animates; pages (like /work) continue to render below it.
  return (
    <div className='mb-10'>
      <ProjectDetail project={project} />
    </div>
  );
}
