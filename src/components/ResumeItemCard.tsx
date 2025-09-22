import type { ResumeItem } from "@/types/resume";
import { formatResumeDates } from "@/lib/date";

type Props = {
  item: ResumeItem;
};

// Keep last two words together by turning the final space into a non-breaking space.
function nbspLast(text: string): string {
  return text.replace(/\s+([^\s]+)$/, "\u00A0$1");
}

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
            <span className='text-base opacity-80'> — {organization}</span>
          ) : null}
        </h3>
        <p className='text-sm text-fg-muted-500'>
          {[dateStr, location].filter(Boolean).join(" • ")}
        </p>
      </header>

      {!!(bullets && bullets.length) && (
        <ul className='list-disc ms-5 space-y-1 mb-2'>
          {bullets.map((b, i) => (
            <li key={i} className='text-justify text-xs leading-relaxed'>
              {nbspLast(b)}
            </li>
          ))}
        </ul>
      )}

      {(links?.length ?? 0) > 0 && (
        <p className='mb-2 text-sm'>
          <span className='font-medium'>Links:</span>{" "}
          {links!.map((l, i) => {
            const total = links!.length;
            const isLast = i === total - 1;
            const isPenultimate = i === total - 2;

            // Separator rules:
            // - 2 items: "A and B."
            // - 3+ items: "A, B, and C."
            // - After last item: "."
            let sep = "";
            if (!isLast) {
              if (total === 2 && i === 0) sep = " and ";
              else if (isPenultimate) sep = ", and ";
              else sep = ", ";
            } else {
              sep = ".";
            }

            return (
              <span key={`${l.href}-${i}`}>
                <a
                  href={l.href}
                  target='_blank'
                  rel='noreferrer noopener'
                  className='underline hover:no-underline focus:outline-none focus:ring'>
                  {l.label}
                </a>
                {sep}
              </span>
            );
          })}
        </p>
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
