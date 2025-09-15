"use client";

import { usePathname } from "next/navigation";

/**
 * Renders children only while the current pathname starts with "/work".
 * Prevents the @detail overlay from lingering on other routes.
 */
export default function DetailGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (!pathname.startsWith("/work")) return null;
  return <>{children}</>;
}
