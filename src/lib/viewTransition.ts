/**
 * Deterministic View Transition names for a project slug.
 * Keep these in sync anywhere we pair elements across routes.
 */
export function vtNames(slug: string) {
  const safe = String(slug ?? "").trim() || "item";
  return {
    image: `project-${safe}-image`,
    title: `project-${safe}-title`,
  };
}

/**
 * TS-safe style object for the `viewTransitionName` CSS property.
 */
export function vtStyle(name?: string): React.CSSProperties | undefined {
  return name ? { viewTransitionName: name } : undefined;
}
