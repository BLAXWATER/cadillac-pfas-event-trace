#!/usr/bin/env bash
set -euo pipefail

dist_root="${1:-dist}"
server_root="${dist_root}/server"
client_assets="${dist_root}/client/assets"

if [[ ! -d "${server_root}" || ! -d "${client_assets}" ]]; then
  echo "Expected built server and client asset directories under ${dist_root}." >&2
  exit 69
fi

removed_count=0
removed_bytes=0

while IFS= read -r -d '' server_asset; do
  asset_name="$(basename "${server_asset}")"
  client_asset="${client_assets}/${asset_name}"

  if [[ ! -f "${client_asset}" ]]; then
    echo "Refusing to prune ${server_asset}: matching browser asset is missing." >&2
    exit 65
  fi

  if ! cmp -s "${server_asset}" "${client_asset}"; then
    echo "Refusing to prune ${server_asset}: browser copy differs." >&2
    exit 65
  fi

  asset_bytes="$(wc -c < "${server_asset}")"
  rm -f -- "${server_asset}"
  removed_count=$((removed_count + 1))
  removed_bytes=$((removed_bytes + asset_bytes))
done < <(find "${server_root}" -type f \( \
  -iname '*.webp' -o \
  -iname '*.pdf' -o \
  -iname '*.geojson' -o \
  -iname '*.zip' -o \
  -iname '*.html' -o \
  -iname '*.txt' -o \
  -iname '*.csv' \
\) -print0)

echo "Pruned ${removed_count} redundant Worker preview and download copies (${removed_bytes} bytes); browser assets remain in ${client_assets}."
