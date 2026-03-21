// ── Bump this version string every time you deploy changes ──────────────
// The activate handler will automatically delete all older caches
const VERSION    = 'sala-v17';
const CACHE_NAME = `${VERSION}-static`;

// ── These files are safe to cache aggressively (CDN assets, fonts) ──────
// They have their own versioning in the URL so they never go stale
const CDN_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css',
];

// ── Your own app files — these use network-first so updates land immediately
const APP_SHELL = [
  './login.html',
  './register.html',
  './dashboard.html',
  './quiz.html',
  './admin.html',
  './recommendations.html',
  './analytics.html',
  './subjects.html',
  './qa.html',
  './sala.css',
  './sala-app.js',
  './qa-intergration-snippet.js',
  './sala-ai-engine.js',
  './manifest.json',
];

// ── INSTALL — pre-cache CDN assets only ─────────────────────────────────
// We don't pre-cache app files here because network-first handles them live
self.addEventListener('install', event => {
  console.log(`[SW] Installing ${CACHE_NAME}`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CDN_ASSETS))
      .then(() => {
        // ✅ Skip waiting — activate immediately without waiting for tabs to close
        return self.skipWaiting();
      })
  );
});

// ── ACTIVATE — delete ALL old caches from previous versions ─────────────
self.addEventListener('activate', event => {
  console.log(`[SW] Activating ${CACHE_NAME} — cleaning old caches`);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME) // delete anything not current version
          .map(key => {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          })
      )
    ).then(() => {
      // ✅ Take control of all open tabs immediately
      return self.clients.claim();
    })
  );
});

// ── FETCH — two strategies based on what's being requested ──────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (Firestore writes, etc.)
  if (event.request.method !== 'GET') return;

  // Skip Firebase/Firestore API calls — never cache these
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('securetoken.googleapis.com') ||
      url.hostname.includes('firebase') && url.pathname.includes('/v1/')) {
    return;
  }

  // ── Strategy 1: CACHE-FIRST for CDN assets (fonts, chart.js, firebase SDKs)
  // These URLs are version-pinned so they never change
  const isCDN = CDN_ASSETS.some(a => event.request.url.startsWith(a.split('?')[0])) ||
                url.hostname.includes('fonts.gstatic.com') ||
                url.hostname.includes('cdnjs.cloudflare.com') ||
                url.hostname.includes('jsdelivr.net') ||
                url.hostname.includes('gstatic.com');

  if (isCDN) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── Strategy 2: NETWORK-FIRST for all your own app files
  // Always tries the network first — gets your latest code
  // Falls back to cache only if offline
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback — serve from cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // If no cache and offline, show a friendly offline page for HTML requests
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return new Response(
              `<!DOCTYPE html><html><head><meta charset="UTF-8">
               <title>SALA – Offline</title>
               <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;
               height:100vh;margin:0;background:#f5f7ff;color:#0f1535}
               .box{text-align:center;padding:40px}.emoji{font-size:60px;margin-bottom:20px}
               h2{font-size:22px;margin-bottom:10px}p{color:#8892b0;font-size:14px}</style>
               </head><body>
               <div class="box">
                 <div class="emoji">📡</div>
                 <h2>You're offline</h2>
                 <p>SALA needs an internet connection to load.<br>Please check your connection and try again.</p>
               </div></body></html>`,
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
        });
      })
  );
});
