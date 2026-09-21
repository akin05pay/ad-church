const SHELL_CACHE = "ad-church-public-v2";
const BIBLE_CACHE = "ad-church-bible-v1";
const PUBLIC_SHELL = ["/", "/biblia", "/hinarios", "/culto"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(PUBLIC_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, BIBLE_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(BIBLE_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || network || new Response(
    JSON.stringify({ error: "offline" }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (url.hostname === "free.bible" && url.pathname.startsWith("/bible/pt/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/app") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/login")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});
