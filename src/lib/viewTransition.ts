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
 * Optional helper: TS-safe style object for the `viewTransitionName` CSS property.
 * Use only if your TS config complains about the property on `style={}`.
 */
export function vtStyle(name?: string) {
  return name ? ({ ["viewTransitionName" as any]: name } as React.CSSProperties) : undefined;
}
