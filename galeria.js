// Galería de un servicio: servicio.html?s=ventanas | puertas | colocaciones | obra-en-seco
const DATA = window.SERVICIOS;
const slugs = Object.keys(DATA);
const slug = slugs.includes(new URLSearchParams(location.search).get("s"))
  ? new URLSearchParams(location.search).get("s")
  : slugs[0];
const svc = DATA[slug];

// ---------- menú mobile ----------
const toggle = document.querySelector(".nav__toggle");
const menu = document.getElementById("menu");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", open);
  menu.classList.toggle("is-open", open);
});

// ---------- encabezado ----------
document.title = `${svc.titulo} · Trabajos · Canafa`;
document.getElementById("gNum").textContent = svc.num;
document.getElementById("gRef").textContent = svc.num;
document.getElementById("gTitle").textContent = svc.titulo;
document.getElementById("gDesc").textContent = svc.desc;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
document.getElementById("gCount").textContent = [
  svc.fotos && plural(svc.fotos, "foto", "fotos"),
  svc.videos && plural(svc.videos, "video", "videos"),
].filter(Boolean).join(" · ");

document.getElementById("gTabs").innerHTML = slugs.map((s) =>
  `<a href="servicio.html?s=${s}"${s === slug ? ' aria-current="page"' : ""}>${DATA[s].titulo}</a>`
).join("");

// sin fotos o sin videos, el filtro no tiene sentido
if (!svc.fotos || !svc.videos) document.querySelector(".g-filter").hidden = true;

// ---------- grilla ----------
const grid = document.getElementById("gGrid");
const fmtDur = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

grid.innerHTML = svc.items.map((it, i) => {
  const label = it.tipo === "video"
    ? `Ver video ${i + 1} de ${svc.titulo} (${fmtDur(it.dur)})`
    : `Ver foto ${i + 1} de ${svc.titulo}`;
  const img = it.tipo === "video"
    ? `<img src="${it.poster}" alt="" width="${it.w}" height="${it.h}" loading="lazy" decoding="async">`
    : `<img src="${it.mini}" srcset="${it.mini} 640w, ${it.src} 1600w" sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw" alt="" width="${it.w}" height="${it.h}" loading="lazy" decoding="async">`;
  const badge = it.tipo === "video"
    ? `<span class="g-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>${fmtDur(it.dur)}</span>`
    : "";
  return `<li class="g-item" data-tipo="${it.tipo}" style="--i:${i % 8}">
    <button type="button" data-index="${i}" aria-label="${label}">${img}${badge}</button>
  </li>`;
}).join("");

// aparición escalonada al hacer scroll
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
}), { rootMargin: "0px 0px -8% 0px" });
grid.querySelectorAll(".g-item").forEach((li) => io.observe(li));

// ---------- filtro ----------
let visibles = svc.items.map((_, i) => i);
document.querySelectorAll("[data-filtro]").forEach((b) => b.addEventListener("click", () => {
  const f = b.dataset.filtro;
  document.querySelectorAll("[data-filtro]").forEach((x) => x.setAttribute("aria-pressed", x === b));
  grid.querySelectorAll(".g-item").forEach((li) => { li.hidden = f !== "todo" && li.dataset.tipo !== f; });
  visibles = svc.items.map((it, i) => (f === "todo" || it.tipo === f ? i : -1)).filter((i) => i >= 0);
}));

// ---------- visor ----------
const lb = document.getElementById("lightbox");
const stage = document.getElementById("lbStage");
const count = document.getElementById("lbCount");
let pos = 0, opener = null;

function show(p) {
  pos = (p + visibles.length) % visibles.length;
  const it = svc.items[visibles[pos]];
  stage.innerHTML = it.tipo === "video"
    ? `<video src="${it.src}" poster="${it.poster}" controls autoplay playsinline></video>`
    : `<img src="${it.src}" alt="Foto ${visibles[pos] + 1} de ${svc.titulo}">`;
  count.textContent = `${pos + 1} / ${visibles.length}`;
  // precarga de las fotos vecinas
  [pos + 1, pos - 1].forEach((n) => {
    const v = svc.items[visibles[(n + visibles.length) % visibles.length]];
    if (v.tipo === "foto") new Image().src = v.src;
  });
}

grid.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-index]");
  if (!b) return;
  opener = b;
  lb.showModal();
  show(visibles.indexOf(+b.dataset.index));
});
document.getElementById("lbPrev").addEventListener("click", () => show(pos - 1));
document.getElementById("lbNext").addEventListener("click", () => show(pos + 1));
document.getElementById("lbClose").addEventListener("click", () => lb.close());
// el evento "close" llega un instante después: si el visor ya se volvió a abrir, no se toca
lb.addEventListener("close", () => {
  if (lb.open) return;
  stage.innerHTML = "";
  opener?.focus();
});
// tocar el fondo oscuro cierra
lb.addEventListener("click", (e) => { if (e.target === lb || e.target === stage) lb.close(); });
lb.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") show(pos + 1);
  if (e.key === "ArrowLeft") show(pos - 1);
});
// deslizar con el dedo
let touchX = null;
lb.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
lb.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) show(pos + (dx < 0 ? 1 : -1));
  touchX = null;
});

document.getElementById("year").textContent = new Date().getFullYear();
