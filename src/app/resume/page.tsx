// resume page
import { getBaseUrl } from "@/lib/requestBase";
import CommentHeader from "@/components/CommentHeader";
import StringText from "@/components/StringText";
import ResumeItemCard from "@/components/ResumeItemCard";
import type { ResumeItem } from "@/types/resume";

type GroupedResume = Partial<Record<ResumeItem["section"], ResumeItem[]>>;

async function fetchResumeGrouped(): Promise<GroupedResume> {
  const base = await getBaseUrl();
  const url = `${base}/api/resume-items?group=1`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to load resume (${res.status})`);
  return res.json();
}

const DISPLAY_ORDER: ResumeItem["section"][] = [
  "experience",
  "projects",
  "education",
  "awards",
  "skills",
  "other",
];

const SECTION_TITLES: Record<ResumeItem["section"], string> = {
  experience: "Experience",
  projects: "Selected Projects",
  education: "Education",
  awards: "Awards",
  skills: "Skills",
  other: "Other",
};

export default async function ResumePage() {
  const grouped = await fetchResumeGrouped();

  return (
    <main className='container mx-auto p-6 space-y-12'>
      <header className='mb-2'>
        <CommentHeader as='h2' className='text-xl mb-2'>
          My background
        </CommentHeader>
        <StringText as='p'>
          Roles, projects, and education—ordered and curated.
        </StringText>
      </header>

      {DISPLAY_ORDER.map((key) => {
        const items = grouped[key] ?? [];
        if (!items.length) return null;

        // For safety: API already sorts by order asc then date desc,
        // but local sort keeps UI consistent if data is passed differently.
        const sorted = [...items].sort((a, b) => {
          const ao = a.order ?? Number.MAX_SAFE_INTEGER;
          const bo = b.order ?? Number.MAX_SAFE_INTEGER;
          if (ao !== bo) return ao - bo;

          // fallback: startDate desc (YYYY-MM or freeform “Present”)
          const as = (a.startDate ?? "").toString();
          const bs = (b.startDate ?? "").toString();
          return bs.localeCompare(as);
        });

        return (
          <section key={key} aria-labelledby={`resume-${key}`}>
            <h2
              id={`resume-${key}`}
              className='text-lg font-semibold tracking-tight mb-4'>
              {SECTION_TITLES[key]}
            </h2>

            {key === "skills" ? (
              <ul className='flex flex-wrap gap-2'>
                {sorted.map((it) => {
                  // Skills section may list discrete items as chips via title or tags
                  const label =
                    it.title ||
                    it.tags?.join(", ") ||
                    it.skills?.map((s) => s.name ?? s.slug).join(", ") ||
                    "—";
                  return (
                    <li
                      key={it._id ?? `${it.title}-${it.startDate}`}
                      className='px-3 py-1 rounded-full bg-[--card]/60 border border-white/10 text-sm'>
                      {label}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className='space-y-6'>
                {sorted.map((it) => (
                  <li key={it._id ?? `${it.title}-${it.startDate}`}>
                    <ResumeItemCard item={it} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}
