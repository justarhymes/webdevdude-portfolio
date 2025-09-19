// src/components/ResumeItemCard.tsx
import type { ResumeItem } from "@/types/resume";
import { formatResumeDates } from "@/lib/date";

type Props = {
  item: ResumeItem;
};

export default function ResumeItemCard({ item }: Props) {
  const {
    title,
    organization,
    location,
    startDate,
    endDate,
    current,
    bullets,
    links,
    skills,
    tags,
  } = item;

  const dateStr = formatResumeDates(startDate, endDate, current);

  return (
    <article className='border border-white/10 bg-[--card]/60 p-4 shadow-sm'>
      <header className='mb-2'>
        <h3 className='text-base font-semibold leading-tight'>
          {title}
          {organization ? (
            <span className='text-sm font-normal opacity-80'>
              {" "}
              — {organization}
            </span>
          ) : null}
        </h3>
        <p className='text-sm opacity-80'>
          {[dateStr, location].filter(Boolean).join(" • ")}
        </p>
      </header>

      {!!(bullets && bullets.length) && (
        <ul className='list-disc ms-5 space-y-1 mb-3'>
          {bullets.map((b, i) => (
            <li key={i} className='text-sm leading-relaxed'>
              {b}
            </li>
          ))}
        </ul>
      )}

      {(links?.length ?? 0) > 0 && (
        <div className='mb-2'>
          <ul className='flex flex-wrap gap-3'>
            {links!.map((l, i) => (
              <li key={i}>
                <a
                  href={l.href}
                  target='_blank'
                  rel='noreferrer noopener'
                  className='text-sm underline hover:no-underline focus:outline-none focus:ring'>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(skills?.length ?? 0) > 0 || (tags?.length ?? 0) > 0 ? (
        <footer className='mt-2'>
          <div className='flex flex-wrap gap-2'>
            {skills?.map((s) => (
              <span
                key={s.slug}
                className='px-2 py-0.5 border border-white/10 text-xs opacity-90'
                aria-label={`Skill: ${s.name ?? s.slug}`}
                title={s.name ?? s.slug}>
                {s.name ?? s.slug}
              </span>
            ))}
          </div>
        </footer>
      ) : null}
    </article>
  );
}
