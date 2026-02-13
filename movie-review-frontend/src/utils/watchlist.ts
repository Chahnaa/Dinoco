const STORAGE_KEY = "watchlist";

type WatchlistEvent = CustomEvent<number[]>;

const readIds = (): number[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((value) => Number(value)).filter((value) => Number.isFinite(value));
    }
    return [];
  } catch {
    return [];
  }
};

const writeIds = (ids: number[]) => {
  if (typeof window === "undefined") return;
  const unique = Array.from(new Set(ids)).filter((value) => Number.isFinite(value));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  window.dispatchEvent(new CustomEvent<number[]>("watchlist:updated", { detail: unique }));
};

export const getWatchlistIds = (): number[] => readIds();

export const isWatchlisted = (movieId: number) => readIds().includes(movieId);

export const toggleWatchlistId = (movieId: number): number[] => {
  const ids = readIds();
  const next = ids.includes(movieId) ? ids.filter((id) => id !== movieId) : [...ids, movieId];
  writeIds(next);
  return next;
};

export const subscribeWatchlist = (handler: (ids: number[]) => void) => {
  if (typeof window === "undefined") return () => undefined;
  const listener = (event: Event) => {
    const detail = (event as WatchlistEvent).detail;
    handler(Array.isArray(detail) ? detail : readIds());
  };
  window.addEventListener("watchlist:updated", listener);
  return () => window.removeEventListener("watchlist:updated", listener);
};
