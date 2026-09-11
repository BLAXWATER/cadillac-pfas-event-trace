// Pin the public archive links to the current GitHub repository revision so
// relative catalog paths resolve to downloadable raw source files.
const repositoryAssetCommit = "07c302dfa7d4d686ef72973070bcd81667757ba3";
const repositoryAssetBase =
  `https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/${repositoryAssetCommit}/public`;

const repositoryBlobPath =
  /^\/(?:cazey43|BLAXWATER)\/cadillac-pfas-event-trace\/blob\/([0-9a-f]{40})\/public(\/.*)$/i;

function encodedRepositoryPath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");
}

export function repositorySourceUrl(url: string): string {
  const [base, fragment] = url.split("#", 2);

  if (/^https:\/\/github\.com\//i.test(base)) {
    const parsed = new URL(base);
    const repositoryPath = parsed.pathname.match(repositoryBlobPath);
    if (!repositoryPath) return url;

    const pinnedBase =
      `https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/${repositoryPath[1].toLowerCase()}/public`;
    return `${pinnedBase}${encodedRepositoryPath(decodeURIComponent(repositoryPath[2]))}${fragment ? `#${fragment}` : ""}`;
  }

  if (!base.startsWith("/")) return url;

  const encodedPath = encodedRepositoryPath(base);

  return `${repositoryAssetBase}${encodedPath}${fragment ? `#${fragment}` : ""}`;
}
