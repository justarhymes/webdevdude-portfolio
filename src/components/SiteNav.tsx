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
          <h1 className='text-2xl'>
            <Link
              href='/'
              className='inline-block !text-fg-500 focus:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-purplepizzazz-500 rounded'>
              <span className='text-purplepizzazz-500'>this</span>.
              <span className='text-seaserpent-500'>webDeveloperDude</span>();
            </Link>
          </h1>

          <StringText as='p' className='mt-1'>
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
          <div className='md:hidden relative'>
            <button
              type='button'
              aria-haspopup='true'
              aria-expanded={open}
              aria-controls='site-menu'
              onClick={() => setOpen((v) => !v)}
              className='px-3 py-2 rounded-xl border border-white/10 shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-seaserpent-500'>
              Menu
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
