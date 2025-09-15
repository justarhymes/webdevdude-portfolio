"use client";

import SlideDown from "@/components/SlideDown";
import { usePathname } from "next/navigation";

/**
 * Mount-once slide container for @detail. On each slug change
 * (pathname change), we remount the inner wrapper so the CSS
 * animation plays reliably without JS timing tricks.
 */
export default function DetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <SlideDown duration={380} offset={24}>
      <div key={pathname} className='detail-fade-in'>
        {children}
      </div>
    </SlideDown>
  );
}
