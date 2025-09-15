// home page
import { Project } from "@/types/project";
import { getBaseUrl } from "@/lib/requestBase";
import { normalizeMediaPath } from "@/lib/url";
import CommentHeader from "@/components/CommentHeader";
import StringText from "@/components/StringText";
import ProjectCard from "@/components/ProjectCard";

type ApiListResponse = {
  page: number;
  limit: number;
  total: number;
  pages: number;
  items: Project[];
};

async function fetchProjects(): Promise<ApiListResponse> {
  const base = await getBaseUrl();
  const url = `${base}/api/projects?page=1&published=1`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to load projects (${res.status})`);
  return res.json();
}

export default async function HomePage() {
  const data = await fetchProjects();

  return (
    <>
      <header className='mb-4'>
        <CommentHeader as='h2' className='text-xl mb-2'>
          Work I've done
        </CommentHeader>
        <StringText as='p'>
          A handful of projects across apps, sites, and products.
        </StringText>
      </header>

      <ul className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
        {data.items.map((p) => {
          const imgSrc = p.thumb
            ? normalizeMediaPath(p.thumb) ?? undefined
            : undefined;
          return (
            <li key={p.slug}>
              <ProjectCard project={p} imgSrc={imgSrc} />
            </li>
          );
        })}
      </ul>
    </>
  );
}
