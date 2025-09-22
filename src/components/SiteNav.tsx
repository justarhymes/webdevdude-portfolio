"use client";

import Link from "next/link";
import StringText from "./StringText";
import { useEffect, useRef, useState } from "react";
import { navLinks as links } from "@/constants/links";

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLUListElement | null>(null);

  // Close on Escape (mobile menu)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className='p-4' aria-label='Primary'>
      {/* 3-column grid keeps the center perfectly centered regardless of right content width */}
      <div className='grid grid-cols-[1fr_auto_1fr] items-center'>
        {/* center column: title + tagline */}
        <div className='col-start-2 text-center'>
          <h1 className='text-lg sm:text-2xl'>
            <Link
              href='/'
              className='inline-block !text-fg-500 focus:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-purplepizzazz-500 rounded'>
              <span className='text-purplepizzazz-500'>this</span>.
              <span className='text-seaserpent-500'>webDeveloperDude</span>();
            </Link>
          </h1>

          <StringText as='p' className='mt-1 text-sm sm:text-base'>
            Los Angeles based Software Engineer.
          </StringText>
        </div>

        {/* right column: links (desktop) / menu (mobile+md) */}
        <div className='col-start-3 justify-self-end'>
          {/* Desktop / large screens */}
          <ul className='hidden md:flex items-center gap-4'>
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className='px-3 py-1.5 rounded-xl hover:underline focus:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-seaserpent-500'>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile & tablet: disclosure menu (no menu roles) */}
          <div className='md:hidden relative z-10'>
            <button
              type='button'
              onClick={() => setOpen((v) => !v)}
              className='p-1.5 rounded-xl border border-white/10 shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-seaserpent-500 cursor-pointer'
              aria-haspopup='true'
              aria-expanded={open}
              aria-controls='site-menu'>
              <span className='absolute -inset-0.5'></span>
              <span className='sr-only'>Open main menu</span>
              <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                stroke-width='1.5'
                data-slot='icon'
                aria-hidden='true'
                className='size-6 in-aria-expanded:hidden'>
                <path
                  d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                  stroke-linecap='round'
                  stroke-linejoin='round'></path>
              </svg>
              <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                stroke-width='1.5'
                data-slot='icon'
                aria-hidden='true'
                className='size-6 not-in-aria-expanded:hidden'>
                <path
                  d='M6 18 18 6M6 6l12 12'
                  stroke-linecap='round'
                  stroke-linejoin='round'></path>
              </svg>
            </button>

            {open && (
              <ul
                id='site-menu'
                ref={menuRef}
                className='absolute right-0 mt-2 min-w-[12rem] rounded-xl border border-white/10 bg-black/80 backdrop-blur p-2 shadow-lg'>
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className='block w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 focus:outline-none focus-visible:ring focus-visible:ring-seaserpent-500'
                      onClick={() => setOpen(false)}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
