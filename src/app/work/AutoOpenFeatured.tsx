"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AutoOpenFeatured({ slug }: { slug?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only auto-open when:
    // - we have a featured slug
    // - we are exactly on /work (no slug already)
    if (!slug) return;
    if (pathname !== "/work") return;

    // Soft navigate to /work/[slug] so the intercepted detail renders in @detail.
    // No scroll jump.
    router.replace(`/work/${slug}`);
  }, [slug, pathname, router]);

  return null;
}
