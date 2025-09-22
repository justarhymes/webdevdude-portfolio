// resume page
import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/requestBase";
import CommentHeader from "@/components/CommentHeader";
import StringText from "@/components/StringText";
import ResumeItemCard from "@/components/ResumeItemCard";
import JsonLd from "@/components/JsonLd";
import type { ResumeItem } from "@/types/resume";
import {
  pageMetadata,
  breadcrumbsJsonLd,
  personProfileJsonLd,
  experienceItemListJsonLd,
  combineJsonLd,
} from "@/lib/seo";
import { SITE_OWNER, TITLE_RESUME, DESC_RESUME } from "@/lib/site";
import { ogDefaultImage } from "@/lib/assets";

export const metadata: Metadata = pageMetadata({
  title: TITLE_RESUME,
  description: DESC_RESUME,
  path: "/resume",
  siteName: SITE_OWNER,
  profile: true,
  ogImage: ogDefaultImage(),
});

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
  const experience = grouped.experience ?? [];
  const education = grouped.education ?? [];

  const jsonLd = combineJsonLd(
    personProfileJsonLd({
      pageUrl: "/resume",
      name: SITE_OWNER,
      title: "Senior Frontend / Full-Stack Engineer",
      locationName: "Los Angeles, CA",
      sameAs: [
        "https://github.com/justarhymes",
        "https://www.linkedin.com/in/justarhymes/",
      ],
      skills: [
        "React",
        "Next.js",
        "TypeScript",
        "Node.js",
        "Tailwind CSS",
        "Ruby on Rails",
      ],
      educationOrgs: education
        .map((e) => e.organization)
        .filter(Boolean) as string[],
      worksForOrg: experience[0]?.organization,
    }),
    breadcrumbsJsonLd([
      { name: "Home", url: "/" },
      { name: "Resume", url: "/resume" },
    ]),
    experience.length ? experienceItemListJsonLd(experience) : null
  );

  return (
    <main className='container mx-auto p-6 space-y-12'>
      <JsonLd data={jsonLd} id='resume-jsonld' strategy='beforeInteractive' />

      <header className='mb-4'>
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

        const sorted = [...items].sort((a, b) => {
          const ao = a.order ?? Number.MAX_SAFE_INTEGER;
          const bo = b.order ?? Number.MAX_SAFE_INTEGER;
          if (ao !== bo) return ao - bo;
          const as = (a.startDate ?? "").toString();
          const bs = (b.startDate ?? "").toString();
          return bs.localeCompare(as);
        });

        return (
          <section key={key} aria-labelledby={`resume-${key}`}>
            <CommentHeader
              as='h3'
              id={`resume-${key}`}
              className='text-lg font-semibold tracking-tight mb-2'>
              {SECTION_TITLES[key]}
            </CommentHeader>

            {key === "skills" ? (
              <ul className='flex flex-wrap gap-2'>
                {sorted.map((it) => {
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
