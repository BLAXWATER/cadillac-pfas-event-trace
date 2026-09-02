#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

command -v timeout || {
  echo "build-verified.sh requires GNU timeout." >&2
  exit 69
}

vinext="${SITES_PROJECT_ROOT}/node_modules/.bin/vinext"
if [[ ! -x "${vinext}" ]]; then
  echo "vinext is unavailable. Run npm run install:ci and wait for it to finish before building." >&2
  exit 69
fi

run_node_script() {
  local script="$1"
  if command -v node >/dev/null 2>&1; then
    node "${SITES_PROJECT_ROOT}/${script}"
  elif command -v node.exe >/dev/null 2>&1; then
    node.exe "${script}"
  else
    echo "A Node.js executable is required for document integrity verification." >&2
    exit 69
  fi
}

echo "Verifying every document catalog entry and delivery path..."
run_node_script "scripts/document-download-integrity.mjs"

echo "Verifying every public archive download without authentication..."
run_node_script "scripts/verify-anonymous-downloads.mjs"

echo "Verifying every record is assigned to its intended visible archive block..."
run_node_script "scripts/record-placement-integrity.mjs"

echo "Running bounded vinext build..."
timeout \
  --signal=TERM \
  --kill-after="${SITES_BUILD_KILL_AFTER:-10s}" \
  "${SITES_BUILD_TIMEOUT:-3m}" \
  "${vinext}" build

"${script_dir}/prune-worker-assets.sh" "${SITES_PROJECT_ROOT}/dist"
