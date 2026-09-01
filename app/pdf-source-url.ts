import firstContentPageAudit from "./pdf-first-content-pages.json";
import { repositorySourceUrl } from "./source-url";

type FirstContentPageRegistry = Readonly<Record<string, number>>;

const verifiedFirstContentPages: FirstContentPageRegistry =
  firstContentPageAudit.firstContentPages;

const positiveInteger = (value: number | undefined): number | undefined =>
  Number.isInteger(value) && Number(value) > 0 ? Number(value) : undefined;

export function pdfSourceKey(url: string): string | null {
  if (!/\.pdf(?:$|[?#])/i.test(url)) return null;

  const base = url.split("#", 1)[0];

  try {
    const parsed = new URL(base, "https://local.invalid");
    const githubBlob = parsed.pathname.match(
      /^\/[^/]+\/[^/]+\/blob\/([0-9a-f]{40})\/(.+\.pdf)$/i,
    );
    if (githubBlob) {
      return `git:${githubBlob[1].toLowerCase()}/${decodeURIComponent(githubBlob[2])}`;
    }

    return `local:${decodeURIComponent(parsed.pathname)}`;
  } catch {
    return `local:${base}`;
  }
}

function pageFromFragment(url: string): number | undefined {
  const fragment = url.includes("#") ? url.slice(url.indexOf("#") + 1) : "";
  return positiveInteger(Number(new URLSearchParams(fragment).get("page")));
}

export function resolvePdfStartPage(
  url: string,
  requestedPage?: number,
  registry: FirstContentPageRegistry = verifiedFirstContentPages,
): number {
  const key = pdfSourceKey(url);
  if (!key) return 1;

  const explicitPage = positiveInteger(requestedPage) ?? pageFromFragment(url);
  const verifiedPage = positiveInteger(registry[key]);

  if (explicitPage && explicitPage > 1) return explicitPage;
  return Math.max(explicitPage ?? 1, verifiedPage ?? 1);
}

export function withPdfStartPage(
  url: string,
  requestedPage?: number,
  viewerOptions = false,
  registry: FirstContentPageRegistry = verifiedFirstContentPages,
): string {
  const key = pdfSourceKey(url);
  if (!key) return repositorySourceUrl(url);

  const resolvedUrl = repositorySourceUrl(url);
  const base = resolvedUrl.split("#", 1)[0];
  const fragment = url.includes("#") ? url.slice(url.indexOf("#") + 1) : "";
  const parameters = new URLSearchParams(fragment);
  const verifiedPage = positiveInteger(registry[key]);
  const hasPageTarget = parameters.has("page") || requestedPage !== undefined || Boolean(verifiedPage);

  if (!viewerOptions && !hasPageTarget) return resolvedUrl;

  parameters.set("page", String(resolvePdfStartPage(url, requestedPage, registry)));
  if (viewerOptions) {
    parameters.set("view", "FitH");
    parameters.set("toolbar", "1");
  }

  return `${base}#${parameters.toString()}`;
}
