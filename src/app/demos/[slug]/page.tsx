import type { DemoDTO } from "@/domain/demo";
import { getBaseUrl } from "@/lib/requestBase";

// We need request headers → render dynamically
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function DemoDetail({ params }: PageProps) {
  const { slug } = await params;
  const base = await getBaseUrl();

  const res = await fetch(`${base}/api/demos/${slug}`, {
    cache: "no-store",
  });

  if (res.status === 404) return <div className="p-6">Not found</div>;
  if (!res.ok) return <div className="p-6">Failed to load demo.</div>;

  const demo = (await res.json()) as unknown as DemoDTO;

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">{demo.title}</h1>
      {demo.summary && <p className="mt-2 opacity-80">{demo.summary}</p>}
      {demo.description && <div className="prose mt-6">{demo.description}</div>}
    </main>
  );
}
