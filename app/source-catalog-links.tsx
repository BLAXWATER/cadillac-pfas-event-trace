type CatalogLink = { slug: string; href: string; label: string };

// Four-column reading order from the user's annotated catalog layout.
const catalogOrder = [
  "dmr", "permits", "correspondence", "portal-submissions",
  "verified", "process-site", "leachate-receiving-finance", "wwtp-operations-infrastructure",
  "biosolids", "chemicals-sds", "laboratory", "pfas",
  "additional", "reference", "groundwater-hydrogeology", "ipp",
  "compliance", "violation-notices",
] as const;

export function SourceCatalogLinks({ links, activeSlug }: { links: readonly CatalogLink[]; activeSlug?: string }) {
  const orderedSlugs = new Set<string>(catalogOrder);
  const orderedLinks = [
    ...catalogOrder.map((slug) => links.find((link) => link.slug === slug)).filter((link): link is CatalogLink => Boolean(link)),
    ...links.filter((link) => !orderedSlugs.has(link.slug)),
  ];

  return (
    <div className="category-jump-links">
      {orderedLinks.map((link) => (
        <a className={`category-jump-link${link.slug === activeSlug ? " is-active" : ""}`} data-category={link.slug} href={link.href} aria-current={link.slug === activeSlug ? "page" : undefined} key={link.slug}>
          {link.label}
        </a>
      ))}
    </div>
  );
}
