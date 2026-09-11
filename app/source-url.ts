// Pin the public archive links to the current GitHub repository revision so
// relative catalog paths resolve to downloadable raw source files.
const repositoryAssetCommit = "07c302dfa7d4d686ef72973070bcd81667757ba3";

// A small set of records was removed from the current public branch after
// publication. Keep those records source-linked to the last public commit
// that still contains the original file; the two paths that have no public
// commit remain bundled by bundled-public-assets.ts.
const legacyRepositoryCommits: Record<string, string> = {
  "/compliance-docs/008-5fff30df4912.pdf": "f930d63655fe41489cb346522a9f841daaa8bd3b",
  "/compliance-docs/010-96bc79c5922b.pdf": "090f882f1898d723a41afe0a2d7956fb07c0afed",
  "/compliance-docs/011-afac7f09906b.pdf": "090f882f1898d723a41afe0a2d7956fb07c0afed",
  "/findings-docs/165-676065b15331.pdf": "c70e207e050af819ac12afc6cfbd48a460785688",
  "/findings-docs/168-cdc906173203.pdf": "306ed6b13e18e3a169e19f2f7d29377ae07e5f2e",
  "/findings-docs/172-f779ef08f411.pdf": "8b4494682914892f5ac6d80d9017e6faa6575b19",
  "/findings-docs/173-87cc40ccea58.pdf": "8e08811be492f1b387d5b5209ee0506889f26379",
  "/findings-docs/174-f091763d0d37.pdf": "8e08811be492f1b387d5b5209ee0506889f26379",
  "/form-submission-docs/form-submission-073-c84ac8484363.pdf": "a0ee86951939e0e9203f0c44829b13d89cf5d10e",
  "/pfas-docs/002-aca419b24a35.pdf": "07013e14f59eb25695c62fdf4be584fc509ad96f",
  "/pfas-docs/102-03b43f8e8597.pdf": "8b4494682914892f5ac6d80d9017e6faa6575b19",
  "/wexford-docs/104-6815e2f8b48e.pdf": "f0d7fddc9b8cd675768e82263f8684c860fbf3c0",
};

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
  const commit = legacyRepositoryCommits[base] ?? repositoryAssetCommit;
  const repositoryAssetBase =
    `https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/${commit}/public`;

  return `${repositoryAssetBase}${encodedPath}${fragment ? `#${fragment}` : ""}`;
}
