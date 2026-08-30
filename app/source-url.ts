const repositoryAssetCommit = "98dbe7dc13459ed087b46a00e9c799e12436576d";
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
