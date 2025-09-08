import type { DemoDTO } from "@/domain/demo";
import { getBaseUrl } from "@/lib/requestBase";

// We need request headers → render dynamically
export const dynamic = "force-dynamic";

type DemosResponse = {
  page: number;
  limit: number;
  total: number;
  pages: number;
  items: DemoDTO[];
};

export default async function DemosPage() {
  const base = await getBaseUrl();

  const res = await fetch(`${base}/api/demos?published=1`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return <main className="container mx-auto p-6">Failed to load demos.</main>;
  }

  const data = (await res.json()) as unknown as DemosResponse;
  const { items } = data;

  return (
    <main className="container mx-auto p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((d) => (
        <article key={d.slug} className="rounded-2xl shadow p-4">
          <h2 className="text-lg font-semibold">{d.title}</h2>
          {d.summary && <p className="text-sm opacity-80">{d.summary}</p>}
        </article>
      ))}
    </main>
  );
}
