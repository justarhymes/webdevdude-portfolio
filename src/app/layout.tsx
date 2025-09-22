// app layout
import "./globals.css";
import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import DetailGate from "@/components/DetailGate";
import { hack } from "@/fonts/hack";
import {
  SITE_DESCRIPTION,
  SITE_ORIGIN,
  SITE_OWNER,
  SITE_TITLE_DEFAULT,
  SITE_TITLE_TEMPLATE,
} from "@/lib/site";
import { ogDefaultImage } from "@/lib/assets";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: SITE_TITLE_DEFAULT,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    type: "website",
    url: "/",
    siteName: SITE_OWNER,
    images: [{ url: ogDefaultImage() }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    images: [ogDefaultImage()],
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#282c34" },
      { rel: "shortcut icon", url: "/favicon.ico" },
      { rel: "msapplication-config", url: "/browserconfig.xml" },
    ],
  },
  other: {
    "msapplication-TileColor": "#282c34",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#282c34",
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
             DetailGate hides this slot on non-/work routes. */}
          <DetailGate>{detail}</DetailGate>
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
