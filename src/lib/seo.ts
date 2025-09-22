import type { Metadata } from "next";
import type { Project } from "@/types/project";
import type { ResumeItem } from "@/types/resume";

/** Build standard page <head> metadata in one place. */
export function pageMetadata(args: {
  title: string;
  description: string;
  path?: string; // e.g. "/resume"
  siteName?: string; // e.g. "webdevdude"
  ogImage?: string; // e.g. "/og/resume.png"
  profile?: boolean; // sets og:type
}): Metadata {
  const {
    title,
    description,
    path = "/",
    siteName = "webdevdude",
    ogImage,
    profile = false,
  } = args;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: profile ? "profile" : "website",
      url: path,
      siteName,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

/** WebSite JSON-LD (use on the homepage) */
export function websiteJsonLd(args: {
  name: string;
  url: string; // canonical absolute or path; layout.metadataBase will resolve
  searchUrlTemplate?: string; // optional SearchAction
}) {
  const { name, url, searchUrlTemplate } = args;
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
  };
  if (searchUrlTemplate) {
    json.potentialAction = {
      "@type": "SearchAction",
      target: `${searchUrlTemplate}{search_term_string}`,
      "query-input": "required name=search_term_string",
    };
  }
  return json;
}

/** BreadcrumbList JSON-LD */
export function breadcrumbsJsonLd(trail: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: { "@id": t.url, name: t.name },
    })),
  };
}

/** Person on a ProfilePage JSON-LD (used by /resume) */
export function personProfileJsonLd(args: {
  pageUrl: string;
  name: string;
  alternateName?: string;
  title?: string;
  locationName?: string;
  sameAs?: string[];
  skills?: string[];
  educationOrgs?: string[]; // names
  worksForOrg?: string; // name
}) {
  const {
    pageUrl,
    name,
    alternateName,
    title,
    locationName,
    sameAs = [],
    skills = [],
    educationOrgs = [],
    worksForOrg,
  } = args;

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `Resume — ${name}`,
    url: pageUrl,
    mainEntity: {
      "@type": "Person",
      name,
      ...(alternateName ? { alternateName } : {}),
      ...(title ? { jobTitle: title } : {}),
      ...(locationName
        ? { homeLocation: { "@type": "Place", name: locationName } }
        : {}),
      ...(sameAs.length ? { sameAs } : {}),
      ...(skills.length ? { knowsAbout: skills } : {}),
      ...(educationOrgs.length
        ? {
            alumniOf: educationOrgs.map((n) => ({
              "@type": "EducationalOrganization",
              name: n,
            })),
          }
        : {}),
      ...(worksForOrg
        ? { worksFor: { "@type": "Organization", name: worksForOrg } }
        : {}),
    },
  };
}

export function experienceItemListJsonLd(items: ResumeItem[]) {
  const asList = items.map((it, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    item: {
      "@type": "Role",
      roleName: it.title,
      startDate: it.startDate,
      ...(it.current ? {} : it.endDate ? { endDate: it.endDate } : {}),
      ...(it.organization
        ? { memberOf: { "@type": "Organization", name: it.organization } }
        : {}),
      ...(it.links && it.links[0]?.href ? { url: it.links[0].href } : {}),
    },
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Work Experience",
    itemListElement: asList,
  };
}

/** ItemList of Project cards (Home/Work).
 * @param items       Projects to include
 * @param listName    Name for the ItemList (e.g., "Projects")
 * @param basePath    Base path for detail URLs (default "/work")
 * @param maxItems    Cap to avoid giant JSON-LD blobs (default 48)
 */
export function projectListItemListJsonLd(
  items: Project[],
  listName: string,
  basePath = "/work",
  maxItems = 48
) {
  const capped = items.slice(0, maxItems);

  const list = capped.map((p, idx) => {
    const url = `${basePath}/${encodeURIComponent(p.slug)}`;
    const image =
      (Array.isArray(p.media) && p.media[0]?.url) ||
      p.thumb;

    return {
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "CreativeWork",
        name: p.title ?? p.slug,
        ...(p.description ? { description: p.description } : {}),
        url,
        ...(image ? { image } : {}),
        ...(p.year ? { dateCreated: String(p.year) } : {}),
        ...(p.type?.name ? { genre: p.type.name } : {}),
      },
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    itemListElement: list,
  };
}

/** Project detail JSON-LD */
export function projectJsonLd(p: Project) {
  const url = `/work/${encodeURIComponent(p.slug)}`;
  const images = Array.isArray(p.media)
    ? p.media
        .filter(Boolean)
        .map((m) => m?.url)
        .filter(Boolean)
    : [];

  // Collect some keywords from skills/tasks/tags if present
  const keywords = [
    ...(p.skills ?? []).map((skill) => skill.name ?? skill.slug),
    ...(p.tasks ?? []).map((task) => task.name ?? task.slug),
    ...(p.tags ?? []),
  ]
    .filter((keyword): keyword is string => Boolean(keyword))
    .join(", ");

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.title ?? p.slug,
    ...(p.subtitle ? { alternateName: p.subtitle } : {}),
    ...(p.description ? { description: p.description } : {}),
    url,
    ...(images.length ? { image: images } : {}),
    ...(p.year ? { dateCreated: String(p.year) } : {}),
    ...(p.type?.name ? { genre: p.type.name } : {}),
    ...(keywords ? { keywords } : {}),
    author: {
      "@type": "Person",
      name: "Justin King",
    },
  };
}

/** Helper to combine any number of JSON-LD nodes into an array. */
export function combineJsonLd(...nodes: Array<unknown | null | undefined>) {
  return nodes.filter(Boolean);
}
