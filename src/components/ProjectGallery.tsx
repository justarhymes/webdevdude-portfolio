"use client";

import React, { useMemo, useState, useId, useCallback, useEffect } from "react";
import Image from "next/image";
import type { MediaItem } from "@/types/media";

/**
 * ProjectGallery
 * - Hero = first item in `media` (page001.*)
 * - Thumbnails show ALL images (including the current hero)
 * - Thumbs: hand cursor on hover, subtle hover border, solid active border
 * - Minimal styling, no rounding
 * - Hides thumbnails when there is only 1 image
 * - Optional `viewTransitionName` for hero pairing with ProjectCard image
 */
export default function ProjectGallery({
  media = [],
  title,
  blurDataURL,
  className,
  viewTransitionName,
}: {
  media?: MediaItem[];
  title: string;
  blurDataURL?: string;
  className?: string;
  viewTransitionName?: string;
}) {
  const initialHero = useMemo(() => media[0], [media]);
  const [hero, setHero] = useState<MediaItem | undefined>(initialHero);

  const galleryLabelId = useId();
  const heroLabelId = useId();

  const onThumbActivate = useCallback((item: MediaItem) => setHero(item), []);

  useEffect(() => {
    if (!hero && initialHero) {
      setHero(initialHero);
      return;
    }
    if (hero) {
      const stillExists = media.some((m) => m && m.url === hero.url);
      if (!stillExists) {
        setHero(initialHero);
      }
    }
  }, [media, initialHero, hero]);

  if (!hero) return null;

  // With react-css.d.ts in place, we can type this cleanly
  const vtStyle: React.CSSProperties | undefined = viewTransitionName
    ? { viewTransitionName }
    : undefined;

  return (
    <section className={["space-y-4", className].filter(Boolean).join(" ")}>
      {/* Hero */}
      <figure aria-labelledby={heroLabelId}>
        <Image
          src={hero.url}
          alt={hero.alt ?? title}
          width={hero.width ?? 1200}
          height={hero.height ?? 655}
          className='h-auto w-full object-cover'
          placeholder={blurDataURL ? "blur" : "empty"}
          blurDataURL={blurDataURL}
          priority
          sizes='100vw'
          style={vtStyle}
        />
        <figcaption id={heroLabelId} className='sr-only'>
          {hero.alt ?? `${title} — hero image`}
        </figcaption>
      </figure>

      {/* Thumbs (hide if only 1 image) */}
      {media.length > 1 && (
        <div aria-labelledby={galleryLabelId}>
          <div id={galleryLabelId} className='sr-only'>
            Project image gallery thumbnails
          </div>
          <ul className='grid grid-cols-4 gap-4'>
            {media.map((item, i) => {
              const isActive = !!hero && item.url === hero.url;

              // Shared classes for the image border behavior
              const borderBase =
                "border-2 transition-colors duration-150 cursor-pointer";
              const borderState = isActive
                ? "border-purplepizzazz-500"
                : "border-transparent hover:border-blackcoral-500";

              return (
                <li key={item.url ?? i}>
                  <button
                    type='button'
                    className='block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
                    onClick={() => onThumbActivate(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onThumbActivate(item);
                      }
                    }}
                    aria-current={isActive ? "true" : undefined}
                    aria-label={item.alt ?? `Thumbnail ${i + 1}`}
                    title={item.alt ?? `Thumbnail ${i + 1}`}>
                    <Image
                      src={item.url}
                      alt={item.alt ?? `Thumbnail ${i + 1}`}
                      width={item.width ?? 260}
                      height={item.height ?? 150}
                      className={`block h-auto w-full object-cover ${borderBase} ${borderState}`}
                      loading='lazy'
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
