import type { ResumeItemDTO } from "@/domain/resume";
import { getBaseUrl } from "@/lib/requestBase";

// We need request headers → render dynamically
export const dynamic = "force-dynamic";

type GroupedResume = Record<string, ResumeItemDTO[]>;

export default async function ResumePage() {
  /*const base = await getBaseUrl();

  const res = await fetch(`${base}/api/resume?group=1`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <main className='container mx-auto p-6'>Failed to load resume.</main>
    );
  }

  const grouped = (await res.json()) as unknown as GroupedResume;*/

  return (
    <main className='container mx-auto p-6 space-y-10'>
      <h1>RESUME !!!</h1>
      {/*
      {Object.entries(grouped).map(([section, items]) => {
        if (!items || items.length === 0) return null;
        return (
          <section key={section}>
            <h2 className='text-xl font-semibold capitalize'>{section}</h2>
            <ul className='mt-4 space-y-3'>
              {items.map((it) => (
                <li key={String(it._id)} className='border rounded-xl p-4'>
                  <div className='font-medium'>{it.title}</div>
                  {it.organization && (
                    <div className='text-sm opacity-80'>{it.organization}</div>
                  )}
                  <div className='text-xs opacity-70'>
                    {it.startDate}{" "}
                    {it.current
                      ? "– Present"
                      : it.endDate
                      ? `– ${it.endDate}`
                      : ""}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}*/}
    </main>
  );
}
