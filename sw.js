// ============================================================
// BTJ Mergulho - Service Worker
// Faz o app abrir mesmo sem internet
// ============================================================

const CACHE_VERSION = 'btj-mergulho-v1';
const ARQUIVOS_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Instala: baixa os arquivos pro cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(ARQUIVOS_CACHE))
  );
  self.skipWaiting();
});

// Ativa: limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: estratégia cache-first pros arquivos, network-first pra API
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Nunca cachear chamadas ao Apps Script (sempre tentar rede)
  if (url.includes('script.google.com')) {
    return;
  }

  // Pra arquivos do app: tenta cache primeiro, depois rede
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
