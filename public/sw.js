// PropInspect Service Worker
// Cache version — increment this with every deployment to force update
const CACHE = "propinspect-v2";

self.addEventListener("install", e => {
  // Skip waiting so new SW activates immediately
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(["/", "/index.html"]))
  );
});

self.addEventListener("activate", e => {
  // Delete all old caches immediately
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = e.request.url;

  // Never cache Supabase, Resend, or API calls -- always go to network
  if (url.includes("supabase") || url.includes("resend") || url.includes("/api/")) {
    return;
  }

  // For HTML navigation requests -- network first, fall back to cache
  // This ensures users always get the latest app version
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // For all other assets -- network first with cache fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200 && e.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
