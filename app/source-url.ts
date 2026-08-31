const repositoryAssetCommit = "583d2cd70b96ee4d7aca34a8e3c3650490a33077";
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
