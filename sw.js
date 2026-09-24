/* Deixa o app abrindo sem sinal: quem precisa de guincho muitas vezes esta
   na estrada sem 4G.

   Arquivos do proprio app (paginas, lista, codigo): REDE PRIMEIRO, e o que
   ficou salvo so entra sem sinal. Na v1 era cache primeiro e a atualizacao so
   aparecia na segunda abertura -- quem testou achou que nao tinha atualizado.
   Mudou algum arquivo do app? Suba a VERSAO. */
const VERSAO = "guincho-ms-v5";
const APP = ["./", "index.html", "app.css", "app.js", "manifest.webmanifest", "dados.json",
  "img/logo-horizontal.svg", "img/concha.svg", "img/icone-192.png", "img/icone-512.png"];

self.addEventListener("install", e => {
  // cache:"reload" pula o cache HTTP do navegador: guarda a versao que esta no site agora
  e.waitUntil(caches.open(VERSAO)
    .then(c => c.addAll(APP.map(u => new Request(u, {cache: "reload"}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(chaves => Promise.all(chaves.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // mapa (tiles) nao vai para o cache: seria enorme
  if (url.hostname.endsWith("tile.openstreetmap.org")) return;

  // arquivos do proprio app: rede primeiro, cache sem sinal
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request, {cache: "no-cache"}).then(r => {
      if (r.ok) {
        const copia = r.clone();
        caches.open(VERSAO).then(c => c.put(e.request, copia));
      }
      return r;
    }).catch(() => caches.match(e.request, {ignoreSearch: true})
      .then(achou => achou || (e.request.mode === "navigate" ? caches.match("index.html") : undefined))));
    return;
  }

  // fontes e Leaflet (versao fixa na URL, nunca mudam): cache primeiro
  e.respondWith(caches.match(e.request).then(achou => achou || fetch(e.request).then(r => {
    if (r.ok && /cdnjs|fonts\.(googleapis|gstatic)/.test(url.hostname)) {
      const copia = r.clone();
      caches.open(VERSAO).then(c => c.put(e.request, copia));
    }
    return r;
  })));
});
