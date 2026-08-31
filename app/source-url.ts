const repositoryAssetCommit = "be4c2d5dadbb16835a539e8509ac065d560bb055";
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
