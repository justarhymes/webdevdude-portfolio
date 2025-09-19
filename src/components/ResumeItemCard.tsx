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
    <article className='bg-card-500 p-8 shadow-sm'>
      <header className='mb-2'>
        <h3 className='text-lg'>
          {title}
          {organization ? (
            <span className='text-base text-fg-muted-500'>
              {" "}
              — {organization}
            </span>
          ) : null}
        </h3>
        <p className='text-sm text-fg-muted-500'>
          {[dateStr, location].filter(Boolean).join(" • ")}
        </p>
      </header>

      {!!(bullets && bullets.length) && (
        <ul className='list-disc ms-5 space-y-1 mb-3'>
          {bullets.map((b, i) => (
            <li key={i} className='text-justify text-xs leading-relaxed'>
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
                  className='text-sm focus:outline-none focus:ring'>
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
                className='bg-bg-500 py-2 px-4 text-sm'
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
