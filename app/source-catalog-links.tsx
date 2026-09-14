type CatalogLink = { slug: string; href: string; label: string };

const colorGroups = [
  { color: "blue", slugs: ["dmr", "permits", "correspondence", "portal-submissions"] },
  { color: "cyan", slugs: ["verified", "process-site", "leachate-receiving-finance", "wwtp-operations-infrastructure"] },
  { color: "green", slugs: ["biosolids", "chemicals-sds"] },
  { color: "yellow", slugs: ["pfas", "laboratory"] },
  { color: "amber", slugs: ["additional", "reference"] },
  { color: "orange", slugs: ["groundwater-hydrogeology"] },
  { color: "red", slugs: ["ipp", "compliance", "violation-notices"] },
] as const;

export function SourceCatalogLinks({ links, activeSlug }: { links: readonly CatalogLink[]; activeSlug?: string }) {
  const groupedSlugs = new Set<string>(colorGroups.flatMap((group) => [...group.slugs]));
  const groups = [
    ...colorGroups.map((group) => ({
      color: group.color,
      links: links.filter((link) => (group.slugs as readonly string[]).includes(link.slug)),
    })),
    { color: "other", links: links.filter((link) => !groupedSlugs.has(link.slug)) },
  ];

  return (
    <div className="category-jump-links">
      {groups.filter((group) => group.links.length > 0).map((group) => (
        <div className="category-jump-color-row" data-color-group={group.color} role="group" aria-label={`${group.color} catalog links`} key={group.color}>
          {group.links.map((link) => (
            <a className={`category-jump-link${link.slug === activeSlug ? " is-active" : ""}`} data-category={link.slug} href={link.href} aria-current={link.slug === activeSlug ? "page" : undefined} key={link.slug}>
              {link.label}
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}
