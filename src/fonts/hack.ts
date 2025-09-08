import localFont from "next/font/local";

/**
 * Registers the Hack font with Next.js and exposes a CSS variable (--font-hack).
 * Use the .font-hack utility (defined in globals.css) on any code-like UI.
 */
export const hack = localFont({
  variable: "--font-hack",
  display: "swap",
  preload: true,
  src: [
    { path: "./Hack-Regular.woff", weight: "400", style: "normal" },
    { path: "./Hack-Italic.woff", weight: "400", style: "italic" },
    { path: "./Hack-Bold.woff", weight: "700", style: "normal" },
    { path: "./Hack-BoldItalic.woff", weight: "700", style: "italic" },
  ],
});
