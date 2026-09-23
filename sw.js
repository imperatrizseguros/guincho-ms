/* Deixa o app abrindo sem sinal: quem precisa de guincho muitas vezes esta
   na estrada sem 4G. A lista (dados.json) tenta a rede primeiro e cai no que
   ficou salvo; o resto do app vem do cache. Mudou algum arquivo do app?
   Suba a VERSAO para os celulares pegarem a nova. */
const VERSAO = "guincho-ms-v2";
const APP = ["./", "index.html", "app.css", "app.js", "manifest.webmanifest", "dados.json",
  "img/logo-horizontal.svg", "img/concha.svg", "img/icone-192.png", "img/icone-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(chaves => Promise.all(chaves.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // lista de guinchos: rede primeiro (sempre a mais nova), cache se nao tiver sinal
  if (url.pathname.endsWith("dados.json")) {
    e.respondWith(fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(VERSAO).then(c => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request)));
    return;
  }

  // mapa (tiles) nao vai para o cache: seria enorme
  if (url.hostname.endsWith("tile.openstreetmap.org")) return;

  // app, fontes e Leaflet: cache primeiro
  e.respondWith(caches.match(e.request).then(achou => achou || fetch(e.request).then(r => {
    if (r.ok && (url.origin === location.origin || /cdnjs|fonts\.(googleapis|gstatic)/.test(url.hostname))) {
      const copia = r.clone();
      caches.open(VERSAO).then(c => c.put(e.request, copia));
    }
    return r;
  })));
});
