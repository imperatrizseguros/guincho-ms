"use strict";

/* Assistencia 24h das seguradoras. Confirmar os numeros de tempos em tempos:
   seguradora muda central sem avisar. */
const SEGURADORAS = [
  {nome: "Porto",    tel: "08007270800", telFmt: "0800 727 0800",  zap: "551130039303", zapFmt: "(11) 3003-9303"},
  {nome: "Tokio",    tel: "08003186546", telFmt: "0800 31 86546",  zap: "5511995786546", zapFmt: "(11) 99578-6546"},
  {nome: "Allianz",  tel: "40901110",    telFmt: "4090 1110",      zap: "551140901444", zapFmt: "(11) 4090-1444"},
  {nome: "Bradesco", tel: "08007012757", telFmt: "0800 701 2757",  zap: "551130031022", zapFmt: "(11) 3003-1022"},
  {nome: "HDI",      tel: "03005390",    telFmt: "0300 5390",      zap: "551155020700", zapFmt: "(11) 5502-0700"},
  {nome: "Yelum",    tel: "40045423",    telFmt: "4004 5423",      zap: "551131321001", zapFmt: "(11) 3132-1001"},
];

const $ = s => document.querySelector(s);
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const fmtFone = f => f && f.length >= 12 ? `(${f.slice(2, 4)}) ${f.slice(4, -4)}-${f.slice(-4)}` : f;
const celular = f => f && f.length === 13 && f[4] === "9";
const ICONE_TEL = '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/></svg>';
const ICONE_ROTA = '<svg viewBox="0 0 24 24"><path d="M21.7 11.3l-9-9a1 1 0 0 0-1.4 0l-9 9a1 1 0 0 0 0 1.4l9 9a1 1 0 0 0 1.4 0l9-9a1 1 0 0 0 0-1.4zM14 14.5V12h-4v3H8v-4a1 1 0 0 1 1-1h5V7.5l3.5 3.5z"/></svg>';
const ICONE_ZAP ='<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.3 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>';

/* ------------------------------------------------------------ seguradoras */
$("#seguradoras").innerHTML = SEGURADORAS.map(s => `
  <div class="seg">
    <div class="nome">${esc(s.nome)}</div>
    <div class="num-tel">${esc(s.telFmt)}</div>
    <div class="acoes">
      <a class="b b-ligar" href="tel:${s.tel}" aria-label="Ligar para ${esc(s.nome)}">${ICONE_TEL}Ligar</a>
      ${s.zap ? `<a class="b b-zap" href="https://wa.me/${s.zap}" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(s.nome)}">${ICONE_ZAP}</a>` : ""}
    </div>
  </div>`).join("");

/* --------------------------------------------------------------- dados */
let todos = [];
let voce = null;            // {lat, lon} do GPS
let limite = 30;
let vista = "lista";

function distancia(a, b, c, d) {
  const r = 6371, rad = Math.PI / 180;
  const x = Math.sin((c - a) * rad / 2) ** 2
    + Math.cos(a * rad) * Math.cos(c * rad) * Math.sin((d - b) * rad / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(x));
}

function filtrados() {
  const cidade = $("#cidade").value, h24 = $("#f-h24").checked, zap = $("#f-zap").checked;
  let l = todos.filter(g => (!cidade || g.c === cidade) && (!h24 || g.h) && (!zap || celular(g.t)));
  if (voce) {
    l.forEach(g => g.km = distancia(voce.lat, voce.lon, g.la, g.lo));
    // parceiro Imperatriz ganha 5 km de vantagem sobre um desconhecido
    l.sort((a, b) => (a.km - 5 * a.p) - (b.km - 5 * b.p));
  } else {
    l.forEach(g => g.km = null);
    l.sort((a, b) => b.p - a.p || b.a - a.a);
  }
  return l;
}

function cartao(g) {
  const zap = celular(g.t);
  const rota = `https://www.google.com/maps/dir/?api=1&destination=${g.la},${g.lo}`;
  return `
  <article class="g ${g.p ? "parceiro" : ""}">
    <div class="l1">
      <div class="nome">${esc(g.n)}</div>
      ${g.km != null ? `<div class="km">${g.km < 10 ? g.km.toFixed(1).replace(".", ",") : Math.round(g.km)} km</div>` : ""}
    </div>
    <div class="sub">
      <span>${esc(g.c)}</span>
      ${g.p ? '<span class="selo parc">Parceiro Imperatriz</span>' : ""}
      ${g.h ? '<span class="selo h24">24 horas</span>' : ""}
      ${g.a ? `<span>★ ${String(g.r).replace(".", ",")} (${g.a})</span>` : ""}
    </div>
    <div class="fone">${esc(fmtFone(g.t))}</div>
    <div class="acoes ${zap ? "" : "sem-zap"}">
      <a class="b b-ligar" href="tel:+${g.t}">${ICONE_TEL}Ligar</a>
      ${zap ? `<a class="b b-zap" href="https://wa.me/${g.t}?text=${encodeURIComponent("Olá! Preciso de um guincho. Vi seu contato no app Guincho MS da Imperatriz Seguros.")}" target="_blank" rel="noopener">${ICONE_ZAP}WhatsApp</a>` : ""}
      <a class="b b-rota" href="${rota}" target="_blank" rel="noopener" aria-label="Rota até ${esc(g.n)}" title="Rota">${ICONE_ROTA}</a>
    </div>
  </article>`;
}

// A lista so aparece depois de a pessoa dizer onde esta (GPS ou cidade):
// ninguem precisa rolar 270 guinchos do estado inteiro para achar o seu.
let escolheu = false;

function mostrar() {
  escolheu = true;
  limite = 30;
  $("#resultados").hidden = false;
  desenhar();
  $("#status").scrollIntoView({behavior: "smooth", block: "start"});
}

function desenhar() {
  if (!escolheu) {
    $("#status").textContent = todos.length
      ? "Toque em “Usar minha localização” ou escolha a cidade e toque em “Ver guinchos”." : "";
    return;
  }
  const l = filtrados();
  const cidade = $("#cidade").value;
  $("#status").textContent = !todos.length ? ""
    : !l.length ? "Nenhum guincho com esses filtros. Tente tirar um filtro ou escolher outra cidade."
    : voce ? `${l.length} guinchos${cidade ? " em " + cidade : ""}, do mais perto para o mais longe.`
    : `${l.length} guinchos${cidade ? " em " + cidade : " em MS"}. Use sua localização para ver o mais perto.`;
  $("#lista").innerHTML = l.slice(0, limite).map(cartao).join("");
  $("#mais").hidden = vista !== "lista" || l.length <= limite;
  if (vista === "mapa") desenharMapa(l);
}

/* ---------------------------------------------------------------- mapa */
let mapa = null, camada = null, pinoVoce = null;

function desenharMapa(l) {
  if (!window.L) { $("#status").textContent = "O mapa precisa de internet. A lista funciona sem."; return; }
  if (!mapa) {
    mapa = L.map("mapa").setView([-20.5, -54.6], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {maxZoom: 18, attribution: "© OpenStreetMap"}).addTo(mapa);
  }
  mapa.invalidateSize();
  if (camada) camada.remove();
  camada = L.layerGroup().addTo(mapa);
  const pontos = [];
  for (const g of l) {
    const cls = g.p ? "pino parc" : g.h ? "pino h24" : "pino";
    const tam = g.p ? 24 : 20;
    L.marker([g.la, g.lo], {icon: L.divIcon({className: "", html: `<div class="${cls}"></div>`,
      iconSize: [tam, tam], iconAnchor: [tam / 2, tam / 2]})})
      .bindPopup(`<b>${esc(g.n)}</b><br>${esc(g.c)}${g.h ? " · 24h" : ""}${g.km != null ? ` · ${Math.round(g.km)} km` : ""}
        <br><a class="b b-ligar" href="tel:+${g.t}">${ICONE_TEL}${esc(fmtFone(g.t))}</a>`)
      .addTo(camada);
    pontos.push([g.la, g.lo]);
  }
  if (pinoVoce) pinoVoce.remove();
  if (voce) {
    pinoVoce = L.marker([voce.lat, voce.lon], {icon: L.divIcon({className: "", html: '<div class="voce"></div>',
      iconSize: [18, 18], iconAnchor: [9, 9]}), zIndexOffset: 1000}).addTo(mapa);
    const perto = l.slice(0, 8).map(g => [g.la, g.lo]);
    mapa.fitBounds([[voce.lat, voce.lon], ...perto], {padding: [30, 30], maxZoom: 13});
  } else if (pontos.length) {
    mapa.fitBounds(pontos, {padding: [30, 30], maxZoom: 12});
  }
}

document.querySelectorAll(".alternar button").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".alternar button").forEach(x => x.classList.toggle("ativo", x === b));
  vista = b.dataset.vista;
  $("#lista").hidden = vista !== "lista";
  $("#mapa-caixa").hidden = vista !== "mapa";
  desenhar();
}));

/* ---------------------------------------------------------- localizacao */
$("#btn-local").addEventListener("click", () => {
  const botao = $("#btn-local"), rotulo = botao.querySelector("span");
  if (!navigator.geolocation || !window.isSecureContext) {
    $("#status").textContent = "Localização indisponível nesta página. Escolha a cidade abaixo.";
    return;
  }
  rotulo.textContent = "Localizando…";
  navigator.geolocation.getCurrentPosition(pos => {
    voce = {lat: pos.coords.latitude, lon: pos.coords.longitude};
    $("#cidade").value = "";          // com GPS, o mais perto pode estar na cidade vizinha
    botao.classList.add("ativo");
    rotulo.textContent = "Usando sua localização";
    mostrar();
  }, erro => {
    rotulo.textContent = "Usar minha localização";
    $("#status").textContent = erro.code === 1
      ? "Sem permissão de localização. Libere nas configurações do navegador ou escolha a cidade."
      : "Não consegui achar sua localização agora. Escolha a cidade abaixo.";
  }, {enableHighAccuracy: true, timeout: 12000, maximumAge: 60000});
});

// escolher cidade filtra, mas com GPS ligado a distancia continua medida de voce
$("#cidade").addEventListener("change", mostrar);
$("#btn-ver").addEventListener("click", mostrar);
["#f-h24", "#f-zap"].forEach(s => $(s).addEventListener("change", () => { limite = 30; desenhar(); }));
$("#mais").addEventListener("click", () => { limite += 30; desenhar(); });

/* --------------------------------------------------------------- carga */
(async () => {
  $("#status").textContent = "Carregando guinchos…";
  try {
    const r = await fetch("dados.json", {cache: "no-cache"});
    const dados = await r.json();
    todos = dados.guinchos;
    // Campo Grande primeiro e ja escolhida: e a capital e onde esta a maioria
    const cidades = [...new Set(todos.map(g => g.c))]
      .filter(c => c !== "Campo Grande").sort((a, b) => a.localeCompare(b, "pt-BR"));
    $("#cidade").innerHTML = '<option>Campo Grande</option>'
      + cidades.map(c => `<option>${esc(c)}</option>`).join("")
      + '<option value="">Todo o Mato Grosso do Sul</option>';
    $("#cidade").value = "Campo Grande";
    $("#atualizado").textContent = `Lista atualizada em ${dados.atualizado}.`;
    desenhar();
  } catch {
    $("#status").textContent = "Não consegui carregar a lista. Verifique a internet e abra de novo.";
  }
})();

/* ------------------------------------------------------ instalar / offline */
if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
const instalado = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
let pedidoInstalar = null;
addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  pedidoInstalar = e;
  $("#instalar").hidden = false;
  $("#btn-instalar").hidden = false;
  $("#instalar-texto").innerHTML = "Instale e o guincho fica a um toque — funciona até sem sinal.";
});
$("#btn-instalar").addEventListener("click", async () => {
  if (!pedidoInstalar) return;
  pedidoInstalar.prompt();
  await pedidoInstalar.userChoice;
  pedidoInstalar = null;
  $("#instalar").hidden = true;
});
if (!instalado && /iphone|ipad/i.test(navigator.userAgent)) {
  $("#instalar").hidden = false;
  $("#instalar-texto").innerHTML = "No iPhone: toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.";
}
