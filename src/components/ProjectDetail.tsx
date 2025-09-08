import type { MediaItem } from "@/types/media";
import type { Project } from "@/types/project";
import ProjectGallery from "@/components/ProjectGallery";
import TagList from "./TagList";
import Tag from "./Tag";
import { cleanLinkText, normalizeMediaPath } from "@/lib/url";
import { vtNames } from "@/lib/viewTransition";

// Accept the shapes you actually pass around (string | MediaItem | nullish)
function normalizeImages(
  media?: Array<MediaItem | string | null | undefined>
): MediaItem[] {
  if (!Array.isArray(media)) return [];
  const normalized = media
    .map((m) => {
      if (!m) return null;
      if (typeof m === "string") {
        const url = normalizeMediaPath(m);
        return url ? ({ url } as MediaItem) : null;
      }
      // m is (partial) MediaItem
      const maybe = m as Partial<MediaItem>;
      const url = normalizeMediaPath(maybe.url);
      return url ? ({ ...maybe, url } as MediaItem) : null;
    })
    .filter(Boolean) as MediaItem[];
  return normalized;
}

// Narrow a tag-like thing to { slug?: string; name?: string }
function isSlugRef(v: unknown): v is { slug?: string; name?: string } {
  return (
    !!v &&
    typeof v === "object" &&
    ("slug" in (v as object) || "name" in (v as object))
  );
}

export default function ProjectDetail({ project }: { project: Project }) {
  const {
    slug,
    title,
    subtitle,
    description,
    skills,
    tasks,
    type,
    client,
    studio,
    year,
    primaryLink,
    secondaryLink,
    blur_data_url,
    media,
  } = project as Project;

  const yearText =
    typeof year === "string" ? year : year != null ? String(year) : "";

  const normalizedMedia = normalizeImages(media);

  // Shared-element names (for card→detail morph; harmless if unsupported)
  const { image: vtImage, title: vtTitle } = vtNames(slug);

  return (
    <>
      <section className='flex gap-4 flex-col lg:flex-row-reverse'>
        <header className='lg:mb-4'>
          <div className='card p-4'>
            <h1 className='text-2xl' style={{ viewTransitionName: vtTitle }}>
              {title}
            </h1>
            {subtitle ? <p className='mt-2'>{subtitle}</p> : null}

            {/* Meta row */}
            <div className='mt-3 flex flex-wrap items-center gap-2 text-sm text-[#5C6370]'>
              {yearText ? <span aria-label='Year'>{yearText}</span> : null}
              {type?.slug || type?.name ? (
                <>
                  {yearText ? <span aria-hidden>•</span> : null}
                  <span aria-label='Type'>{type.name ?? type.slug}</span>
                </>
              ) : null}
            </div>
          </div>

          {/* Skills chips */}
          {skills?.length ? (
            <TagList title='Skills'>
              {(skills ?? []).filter(isSlugRef).map((s) => (
                <Tag key={`tag-${s.slug ?? s.name}`}>{s.name ?? s.slug}</Tag>
              ))}
            </TagList>
          ) : null}

          {(primaryLink || secondaryLink) && (
            <div className='mt-4'>
              Visit{" "}
              {primaryLink ? (
                <a
                  href={primaryLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center'>
                  {cleanLinkText(primaryLink)}
                </a>
              ) : null}
              {primaryLink && secondaryLink ? " or " : null}
              {secondaryLink ? (
                <a
                  href={secondaryLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center'>
                  {cleanLinkText(secondaryLink)}
                </a>
              ) : null}
            </div>
          )}
        </header>

        <ProjectGallery
          media={normalizedMedia}
          title={title}
          blurDataURL={blur_data_url ?? undefined}
          viewTransitionName={vtImage}
        />
      </section>

      <section>
        {tasks?.length ? (
          <TagList title='Tasks'>
            {(tasks ?? []).filter(isSlugRef).map((t) => (
              <Tag key={`tag-${t.slug ?? t.name}`}>{t.name ?? t.slug}</Tag>
            ))}
          </TagList>
        ) : null}

        {description ? (
          <p className='my-4'>{description}</p>
        ) : (
          <p className='my-4 italic'>More details coming soon.</p>
        )}

        {client?.slug || client?.name || studio?.slug || studio?.name ? (
          <p>
            Created{" "}
            {studio?.slug || studio?.name ? (
              <>
                with{" "}
                <span aria-label='Studio'>{studio.name ?? studio.slug}</span>
              </>
            ) : null}{" "}
            {client?.slug || client?.name ? (
              <>
                for{" "}
                <span aria-label='Client'>{client.name ?? client.slug}</span>
              </>
            ) : null}
          </p>
        ) : null}
      </section>
    </>
  );
}
