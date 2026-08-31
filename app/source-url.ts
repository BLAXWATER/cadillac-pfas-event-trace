const repositoryAssetCommit = "8950d7e1bbf3b154bec5d9247c125fdeea7f9174";
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
