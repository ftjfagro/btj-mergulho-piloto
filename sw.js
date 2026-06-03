// ============================================================
// BTJ Mergulho - Service Worker
// v2 — stale-while-revalidate + banner de atualização
// ATENÇÃO: ao fazer deploy, incremente BUILD_VERSION abaixo
// ============================================================

const BUILD_VERSION = '20260603b';  // ← trocar na data do deploy
const CACHE_NAME = 'btj-mergulho-' + BUILD_VERSION;

const ARQUIVOS_CACHE = [
  './',
  './index.html',
  './coordenador.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Instala e pré-cacheia
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARQUIVOS_CACHE))
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate para arquivos do app
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // API do Apps Script: sempre rede, nunca cache
  if (url.includes('script.google.com')) return;

  // Fontes Google: cache-first (raramente mudam)
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
    return;
  }

  // Arquivos do app: stale-while-revalidate
  e.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(networkResp => {
          if (networkResp && networkResp.status === 200) {
            cache.put(e.request, networkResp.clone());
          }
          return networkResp;
        }).catch(() => cached); // offline: usa cache

        return cached || fetchPromise; // tem cache: serve imediato + atualiza atrás
      })
    )
  );
});

// Recebe mensagem do app para pular espera (ao clicar "Atualizar agora")
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
