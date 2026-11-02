// Song search straight from the browser using Apple's public iTunes Search API.
// It's called with JSONP (a script tag), which works on any static host.
export type SongResult = { title: string; artist: string; artwork: string | null; album: string };

let counter = 0;

export function searchSongs(q: string, signal?: AbortSignal): Promise<SongResult[]> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve([]);
    const name = `__itunesSearch${Date.now()}_${counter++}`;
    const script = document.createElement('script');
    const w = window as any;
    const finish = (results: SongResult[]) => {
      clearTimeout(timer);
      delete w[name];
      script.remove();
      resolve(results);
    };
    const timer = setTimeout(() => finish([]), 6000);
    w[name] = (data: any) =>
      finish(
        (data?.results ?? []).map((r: any) => ({
          title: r.trackName,
          artist: r.artistName,
          artwork: r.artworkUrl100 ? String(r.artworkUrl100).replace('100x100bb', '300x300bb') : null,
          album: r.collectionName,
        })),
      );
    script.onerror = () => finish([]);
    signal?.addEventListener('abort', () => finish([]));
    script.src =
      `https://itunes.apple.com/search?term=${encodeURIComponent(q.slice(0, 80))}` +
      `&media=music&entity=song&limit=8&country=IN&callback=${name}`;
    document.body.appendChild(script);
  });
}
