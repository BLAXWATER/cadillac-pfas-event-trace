const repositoryAssetCommit = "c4e7af2605084ac48bbf8ecabf59d2b6115ac0d8";
const repositoryAssetBase =
  `https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/${repositoryAssetCommit}/public`;

export function repositorySourceUrl(url: string): string {
  if (!url.startsWith("/")) return url;

  const [path, fragment] = url.split("#", 2);
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");

  return `${repositoryAssetBase}${encodedPath}${fragment ? `#${fragment}` : ""}`;
}
