// app layout
import "./globals.css";
import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import DetailGate from "@/components/DetailGate";
import { hack } from "@/fonts/hack";

export const metadata: Metadata = {
  title: "webdevdude — Portfolio",
  description: "Justin King's portfolio",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
}) {
  return (
    <html lang='en' className={hack.variable}>
      <body className='min-h-dvh antialiased font-hack'>
        <SiteNav />
        <div className='mx-auto max-w-6xl px-4 py-8'>
          {/* When present (e.g., navigating from /work → /work/[slug]), 
             the intercepted ProjectDetail will render here ABOVE the page.
+            DetailGate hides this slot on non-/work routes. */}
          <DetailGate>{detail}</DetailGate>
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
