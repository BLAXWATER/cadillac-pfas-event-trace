import { formatSourceDisplayName } from "./source-display-name";

export const SEARCH_BATCH_SIZE = 100;

export type SearchDocument = {
  id: string;
  sha256?: string;
  name: string;
  year?: string;
  category?: string;
  type?: string;
  format?: string;
  description?: string;
  archive?: string;
  matchingSources?: readonly { name: string }[];
};

export type VerifiedFilenameAliases = Record<string, { sha256: string; aliases: readonly string[] }>;

/** Normalize queries and metadata identically; this is not PDF full-text search. */
export function normalizeLibrarySearch(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

export function createLibrarySearchIndex<T extends SearchDocument>(records: readonly T[], aliases: VerifiedFilenameAliases) {
  return records.map((record) => {
    const verified = aliases[record.id];
    // A filename alias may never migrate to changed/unverified document bytes.
    const uploadedNames = verified?.sha256 === record.sha256 ? verified.aliases : [];
    const names = [record.name, ...uploadedNames, ...(record.matchingSources ?? []).map((source) => source.name)];
    const displayNames = names.map((name) => formatSourceDisplayName(name, record.format, true));
    return {
      record,
      names: new Set([...names, ...displayNames].map(normalizeLibrarySearch)),
      text: normalizeLibrarySearch([
        ...names, ...displayNames, record.year, record.category, record.type,
        record.format, record.description, record.archive,
      ].filter(Boolean).join(" ")),
    };
  });
}

export function searchLibrary<T extends SearchDocument>(index: ReturnType<typeof createLibrarySearchIndex<T>>, query: string): T[] {
  const normalized = normalizeLibrarySearch(query);
  if (!normalized) return [];
  const terms = normalized.split(" ");
  return index.filter((entry) => terms.every((term) => entry.text.includes(term)))
    // Exact canonical, displayed, or uploaded filenames come first. Other order stays stable.
    .sort((a, b) => Number(b.names.has(normalized)) - Number(a.names.has(normalized)))
    .map((entry) => entry.record);
}

export type LibrarySearchState = { query: string; limit: number };
export type LibrarySearchAction = { type: "query"; query: string } | { type: "more" };
export const initialLibrarySearchState: LibrarySearchState = { query: "", limit: SEARCH_BATCH_SIZE };

export function librarySearchReducer(state: LibrarySearchState, action: LibrarySearchAction): LibrarySearchState {
  return action.type === "query"
    ? { query: action.query, limit: SEARCH_BATCH_SIZE }
    : { ...state, limit: state.limit + SEARCH_BATCH_SIZE };
}

export function librarySearchWindow<T>(results: readonly T[], limit: number) {
  const count = Math.min(results.length, Math.max(SEARCH_BATCH_SIZE, Number.isFinite(limit) ? Math.floor(limit) : SEARCH_BATCH_SIZE));
  return { visible: results.slice(0, count), remaining: results.length - count };
}
