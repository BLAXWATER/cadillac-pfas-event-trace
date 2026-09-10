import { notFound } from "next/navigation";
import CatalogPageClient from "../CatalogPageClient";
import { catalogPageList, catalogPages } from "../catalog-data";

export function generateStaticParams() {
  return catalogPageList.map(({ slug }) => ({ slug }));
}

export default async function CatalogRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = catalogPages.get(slug);
  if (!config) notFound();
  return <CatalogPageClient config={config} />;
}
