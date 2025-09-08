import Link from "next/link";
import { Fragment } from "react";
import { navLinks, socialLinks } from "@/constants/links";

/**
 * Renders inline links with commas and "and" before the last, ending with a period.
 * Examples:
 *  - [A] => "A."
 *  - [A, B] => "A and B."
 *  - [A, B, C] => "A, B, and C."
 */
function InlineLinks() {
  const n = socialLinks.length;
  if (n === 0) return null;

  return (
    <>
      {socialLinks.map((l, i) => {
        const isLast = i === n - 1;
        const isSecondToLast = i === n - 2;

        const anchor = l.external ? (
          <a
            key={l.href}
            href={l.href}
            target='_blank'
            rel='noopener noreferrer'
            className='rounded-xl hover:underline focus:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-seaserpent-500'>
            {l.label}
          </a>
        ) : (
          <Link
            key={l.href}
            href={l.href}
            className='rounded-xl hover:underline focus:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-seaserpent-500'>
            {l.label}
          </Link>
        );

        return (
          <Fragment key={l.href}>
            {anchor}
            {!isLast && (isSecondToLast ? " and " : ", ")}
            {isLast && "."}
          </Fragment>
        );
      })}
    </>
  );
}

export default function SiteFooter() {
  return (
    <footer className='p-4 flex flex-col-reverse md:flex-row justify-start md:justify-between gap-4'>
      <ul className='flex flex-row gap-4 justify-center md:justify-normal'>
        {navLinks.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className='rounded-xl hover:underline focus:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-seaserpent-500'>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className='text-center md:text-right'>
        Find me on <InlineLinks />
      </p>
    </footer>
  );
}
