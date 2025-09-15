"use client";

import Link from "next/link";
import Image from "next/image";
import { vtNames } from "@/lib/viewTransition";

type ProjectListItem = {
  slug: string;
  title?: string;
  description?: string;
  thumb?: string | null;
  year?: number | string;
  type?: { name?: string; slug?: string } | null;
};

export default function ProjectCard({
  project,
  imgSrc,
}: {
  project: ProjectListItem;
  /** Stable URL computed on the server in WorkPage (prevents hydration mismatch). */
  imgSrc?: string;
}) {
  const label = project.title ?? project.slug;
  const typeName = project.type?.name ?? "";
  const year = project.year != null ? String(project.year) : "";

  // Shared-element names (must match the slug page)
  const { image: vtImage, title: vtTitle } = vtNames(project.slug);

  return (
    <article className='group'>
      <Link
        href={`/work/${project.slug}`}
        className='card block shadow transition-all duration-300 focus:outline-none hover:scale-95 hover:shadow-xl'
        aria-labelledby={`title-${project.slug}`}>
        {/* Card image */}
        <figure className='relative aspect-square w-full overflow-hidden bg-transparent'>
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={label}
              fill
              sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
              className='object-cover transition-transform duration-300 group-hover:scale-105'
              /* Pair with detail hero */
              style={{ viewTransitionName: vtImage }}
              priority={false}
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center text-sm text-[#5C6370]'>
              no image
            </div>
          )}
        </figure>

        {/* Meta */}
        <div className='p-3'>
          <h2
            id={`title-${project.slug}`}
            className='text-md font-medium leading-snug'
            /* Pair with detail title */
            style={{ viewTransitionName: vtTitle }}>
            {label}
          </h2>
          <div className='mt-1 flex items-center justify-between gap-3 text-sm text-[#5C6370]'>
            {typeName ? <span>{typeName}</span> : <span />}
            {year ? <span>{year}</span> : <span />}
          </div>
        </div>
      </Link>
    </article>
  );
}
