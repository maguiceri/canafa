const WHATSAPP = "5490000000000"; // número sin + ni espacios

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const nav = document.getElementById("nav");
const hero = document.querySelector(".hero");
const root = document.documentElement;

// ---------- intro: arranca la animación del logo cuando cargan las fuentes ----------
document.fonts.ready.then(() => {
  document.body.classList.add("is-ready");
  setTimeout(() => nav.classList.add("is-visible"), reduceMotion ? 0 : 2600);
});

addEventListener("scroll", () => {
  const past = scrollY > 40;
  nav.classList.toggle("is-solid", past);
  if (past) nav.classList.add("is-visible");
}, { passive: true });

// ---------- menú mobile ----------
const toggle = document.querySelector(".nav__toggle");
const menu = document.getElementById("menu");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", open);
  menu.classList.toggle("is-open", open);
});
menu.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
  }
});

// ---------- entrar por la abertura ----------
// Desde arriba de todo la página queda "trabada": el primer gesto hacia abajo
// (rueda, touch, teclado o el botón) dispara el zoom por la abertura y deja la página en Trabajos.
const curtain = document.getElementById("curtain");
const works = document.getElementById("trabajos");
let entering = false;
let gated = false;

const setGate = (on) => {
  gated = on;
  root.classList.toggle("is-gated", on);
};

if (!reduceMotion) {
  history.scrollRestoration = "manual";
  scrollTo(0, 0);
  setGate(true);
}

function enter() {
  if (entering) return;
  if (reduceMotion) return works.scrollIntoView();
  entering = true;
  // si la intro no terminó, se completa al instante antes del zoom
  hero.getAnimations({ subtree: true }).forEach((a) => {
    if (a.effect.getTiming().iterations !== Infinity) a.finish();
  });
  hero.classList.add("is-entering");
  setTimeout(() => curtain.classList.add("is-on"), 750);
  setTimeout(() => {
    setGate(false);
    root.style.scrollBehavior = "auto";
    works.scrollIntoView();
    root.style.scrollBehavior = "";
    nav.classList.add("is-visible");
    hero.classList.remove("is-entering");
    curtain.classList.remove("is-on");
    // se ignora la inercia del gesto unos instantes para que no siga bajando
    setTimeout(() => { entering = false; }, 600);
  }, 1150);
}

// al volver arriba de todo, la portada se vuelve a trabar
addEventListener("scroll", () => {
  if (!reduceMotion && !entering && !gated && scrollY <= 0) setGate(true);
}, { passive: true });

addEventListener("wheel", (e) => {
  if (entering) return e.preventDefault();
  if (gated && e.deltaY > 0) { e.preventDefault(); enter(); }
}, { passive: false });

let touchY = null;
addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; }, { passive: true });
addEventListener("touchmove", (e) => {
  if (entering) return e.preventDefault();
  if (!gated) return;
  e.preventDefault();
  if (touchY !== null && touchY - e.touches[0].clientY > 12) {
    touchY = null;
    enter();
  }
}, { passive: false });

addEventListener("keydown", (e) => {
  if (gated && ["ArrowDown", "PageDown", " "].includes(e.key) && !e.target.closest("input, textarea, button, a")) {
    e.preventDefault();
    enter();
  }
});

document.getElementById("enter").addEventListener("click", (e) => {
  e.preventDefault();
  enter();
});

// links internos: "Trabajos" también entra por la abertura; los demás destraban la página
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
  const id = a.getAttribute("href");
  if (!gated || id === "#inicio" || a.id === "enter") return;
  if (id === "#trabajos") { e.preventDefault(); return enter(); }
  setGate(false);
}));

// ---------- antes / después ----------
document.querySelectorAll(".ba").forEach((ba) => {
  const range = ba.querySelector(".ba__range");
  const set = (pct) => {
    pct = Math.max(0, Math.min(100, pct));
    ba.style.setProperty("--pos", pct + "%");
    range.value = pct;
  };
  const fromPointer = (e) => {
    const r = ba.getBoundingClientRect();
    set(((e.clientX - r.left) / r.width) * 100);
  };

  ba.addEventListener("pointerdown", (e) => {
    ba.setPointerCapture(e.pointerId);
    fromPointer(e);
    ba.addEventListener("pointermove", fromPointer);
  });
  const stop = () => ba.removeEventListener("pointermove", fromPointer);
  ba.addEventListener("pointerup", stop);
  ba.addEventListener("pointercancel", stop);
  range.addEventListener("input", () => set(+range.value));
});

// ---------- aparición al hacer scroll ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) {
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll(".section__head, .work, .sash, .about__photo, .about__text, .config, .contact__info")
  .forEach((el) => { el.classList.add("reveal"); io.observe(el); });

// ---------- secciones apiladas ----------
// Las secciones más altas que la pantalla se quedan fijas recién cuando se ve su final.
const stacks = document.querySelectorAll(".stack");
const setStick = () => stacks.forEach((el) => {
  el.style.setProperty("--stick", Math.min(0, innerHeight - el.offsetHeight) + "px");
});
new ResizeObserver(setStick).observe(document.body);
addEventListener("resize", setStick);

// ---------- servicios: ventanas que se abren ----------
const sashes = document.querySelectorAll(".sash");
sashes.forEach((sash) => {
  const leaf = sash.querySelector(".sash__leaf");
  const setOpen = (open) => {
    sash.classList.toggle("is-open", open);
    leaf.setAttribute("aria-expanded", open);
  };
  leaf.addEventListener("click", () => setOpen(!sash.classList.contains("is-open")));
  sash.querySelector(".sash__back").addEventListener("click", (e) => {
    if (!e.target.closest("a")) setOpen(false);
  });
});

// al llegar a la sección, las ventanas se entreabren en ola para mostrar que se pueden abrir;
// después, mientras nadie abra ninguna, una por vez se entreabre cada tanto
if (!reduceMotion) {
  let inView = false, started = false, turn = 0;
  const peek = (sash, delay) => {
    setTimeout(() => sash.classList.add("is-peek"), delay);
    setTimeout(() => sash.classList.remove("is-peek"), delay + 700);
  };
  new IntersectionObserver(([en]) => {
    inView = en.isIntersecting;
    if (!inView || started) return;
    started = true;
    sashes.forEach((sash, i) => peek(sash, 400 + i * 110));
  }, { threshold: 0.35 }).observe(document.querySelector(".sashes"));

  const loop = setInterval(() => {
    if (document.querySelector(".sash.is-open")) return clearInterval(loop);
    if (inView && started) peek(sashes[turn++ % sashes.length], 0);
  }, 2600);
}

// ---------- nosotros: números que cuentan ----------
const countIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    countIO.unobserve(en.target);
    const el = en.target;
    const to = +el.dataset.to, pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const fmt = (n) => pre + Math.round(n).toLocaleString("es-AR") + suf;
    if (reduceMotion) return (el.textContent = fmt(to));
    const t0 = performance.now(), dur = 1800;
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.6 });
document.querySelectorAll(".count").forEach((el) => countIO.observe(el));

// ---------- presupuesto: configurador con plano en vivo ----------
const form = document.getElementById("form");
const steps = form.querySelectorAll(".step");
const progress = form.querySelectorAll(".config__progress li");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const sendBtn = document.getElementById("send");
const formError = document.getElementById("formError");
const svg = document.getElementById("previewSvg");
let current = 1;

const TIPOS = {
  ventana: "Ventana corrediza", puerta: "Puerta", pano: "Paño fijo",
  cerramiento: "Cerramiento", mampara: "Mampara", otro: "Otro",
};

function goTo(n) {
  current = n;
  steps.forEach((s) => s.classList.toggle("is-active", +s.dataset.step === n));
  progress.forEach((li, i) => {
    li.classList.toggle("is-active", i + 1 === n);
    li.classList.toggle("is-done", i + 1 < n);
  });
  prevBtn.hidden = n === 1;
  nextBtn.hidden = n === 4;
  sendBtn.hidden = n !== 4;
  formError.textContent = "";
}

prevBtn.addEventListener("click", () => goTo(current - 1));
nextBtn.addEventListener("click", () => goTo(current + 1));

form.querySelectorAll("[data-qty]").forEach((b) => b.addEventListener("click", () => {
  const input = form.elements.cantidad;
  input.value = Math.min(99, Math.max(1, (+input.value || 1) + +b.dataset.qty));
  draw();
}));

// desde una ventana de Servicios: elige el tipo y pasa a las medidas
document.querySelectorAll(".sash__cta").forEach((a) => a.addEventListener("click", () => {
  form.querySelector(`input[name="tipo"][value="${a.dataset.tipo}"]`).checked = true;
  draw();
  goTo(2);
}));

function state() {
  const f = form.elements;
  const color = form.querySelector('input[name="color"]:checked');
  return {
    tipo: f.tipo.value,
    w: +f.ancho.value,
    h: +f.alto.value,
    qty: Math.max(1, +f.cantidad.value || 1),
    color: color.value,
    hex: color.dataset.hex,
    vidrio: f.vidrio.value,
    extras: [...form.querySelectorAll('input[name="extras"]:checked')].map((i) => i.value),
  };
}

function draw() {
  const s = state();
  document.getElementById("outW").textContent = s.w + " cm";
  document.getElementById("outH").textContent = s.h + " cm";

  const k = Math.min(290 / s.w, 250 / s.h);
  const w = s.w * k, h = s.h * k;
  const x = 215 - w / 2, y = 175 - h / 2;
  const t = s.tipo === "mampara" ? 5 : 10;
  const c = s.hex, line = "rgba(255,255,255,.35)";
  const glass = s.vidrio.startsWith("Laminado") ? "rgba(170,200,190,.2)" : "rgba(143,176,204,.16)";
  const dvh = s.vidrio.startsWith("DVH");
  let g = "";

  const pane = (px, py, pw, ph, sw = 6) => {
    let r = `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${glass}" stroke="${c}" stroke-width="${sw}"/>`;
    r += `<rect x="${px - sw / 2}" y="${py - sw / 2}" width="${pw + sw}" height="${ph + sw}" fill="none" stroke="${line}" stroke-width=".8"/>`;
    if (dvh) r += `<rect x="${px + sw / 2 + 4}" y="${py + sw / 2 + 4}" width="${Math.max(0, pw - sw - 8)}" height="${Math.max(0, ph - sw - 8)}" fill="none" stroke="rgba(143,176,204,.4)" stroke-width=".8"/>`;
    return r;
  };
  const mosq = (px, py, pw, ph) =>
    `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="url(#mesh)"/>`;

  // persiana: cajón arriba
  if (s.extras.includes("Persiana")) {
    g += `<rect x="${x - 4}" y="${y - 26}" width="${w + 8}" height="22" fill="${c}" stroke="${line}" stroke-width=".8"/>`;
    for (let i = 1; i < 4; i++) g += `<path d="M${x} ${y - 26 + i * 5.5}h${w}" stroke="rgba(0,0,0,.25)"/>`;
  }
  // marco
  g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" stroke="${line}" stroke-width="1"/>`;
  g += `<rect x="${x + t}" y="${y + t}" width="${w - 2 * t}" height="${h - 2 * t}" fill="#0c1218"/>`;

  const ix = x + t, iy = y + t, iw = w - 2 * t, ih = h - 2 * t;
  if (s.tipo === "ventana") {
    const half = iw / 2;
    g += pane(ix + 3, iy + 3, half + 2, ih - 6);
    g += pane(ix + half - 5, iy + 6, half + 2, ih - 12);
    if (s.extras.includes("Mosquitero")) g += mosq(ix + half - 2, iy + 9, half - 4, ih - 18);
    const ay = iy + ih / 2;
    g += `<path class="pv-arrow" d="M${ix + iw * .3} ${ay}h${iw * .4}M${ix + iw * .3 + 7} ${ay - 5}l-7 5 7 5M${ix + iw * .7 - 7} ${ay - 5}l7 5-7 5"/>`;
  } else if (s.tipo === "puerta") {
    g += pane(ix + 3, iy + 3, iw - 6, ih * .62);
    g += `<rect x="${ix + 3}" y="${iy + ih * .62 + 6}" width="${iw - 6}" height="${ih * .38 - 9}" fill="${c}" stroke="${line}" stroke-width=".8"/>`;
    g += `<rect x="${ix + iw - 16}" y="${iy + ih * .52}" width="5" height="22" rx="2" fill="#dfe3e7"/>`;
    if (s.extras.includes("Mosquitero")) g += mosq(ix + 6, iy + 6, iw - 12, ih * .62 - 6);
  } else if (s.tipo === "cerramiento") {
    const n = Math.max(2, Math.min(8, Math.round(s.w / 70)));
    const pw = iw / n;
    for (let i = 0; i < n; i++) g += pane(ix + i * pw + 3, iy + 3, pw - 6, ih - 6);
    if (s.extras.includes("Mosquitero")) g += mosq(ix + 6, iy + 6, pw - 12, ih - 12);
  } else if (s.tipo === "mampara") {
    g += pane(ix + 2, iy + 2, iw / 2, ih - 4, 3);
    g += pane(ix + iw / 2 - 2, iy + 4, iw / 2, ih - 8, 3);
    g += `<rect x="${ix + iw / 2 + 8}" y="${iy + ih / 2 - 14}" width="4" height="28" rx="2" fill="#dfe3e7"/>`;
  } else {
    g += pane(ix + 3, iy + 3, iw - 6, ih - 6);
    if (s.tipo === "pano") g += `<path d="M${ix + 8} ${iy + 8}L${ix + iw - 8} ${iy + ih - 8}M${ix + iw - 8} ${iy + 8}L${ix + 8} ${iy + ih - 8}" stroke="rgba(143,176,204,.35)" stroke-width=".8"/>`;
    else g += `<text x="${ix + iw / 2}" y="${iy + ih / 2 + 10}" class="pv-txt" style="font-size:30px">?</text>`;
    if (s.extras.includes("Mosquitero")) g += mosq(ix + 6, iy + 6, iw - 12, ih - 12);
  }

  // cotas
  const by = y + h + 26, lx = x - 26;
  g += `<path class="pv-dim" d="M${x} ${by}H${x + w}M${x} ${by - 7}v14M${x + w} ${by - 7}v14"/>`;
  g += `<text class="pv-txt" x="${x + w / 2}" y="${by + 22}">${s.w * 10} mm</text>`;
  g += `<path class="pv-dim" d="M${lx} ${y}V${y + h}M${lx - 7} ${y}h14M${lx - 7} ${y + h}h14"/>`;
  g += `<text class="pv-txt" x="${lx - 14}" y="${y + h / 2}" transform="rotate(-90 ${lx - 14} ${y + h / 2})">${s.h * 10} mm</text>`;
  if (s.qty > 1) g += `<text class="pv-txt" x="${x + w + 4}" y="${y - 10}" style="text-anchor:end;font-size:18px">× ${s.qty}</text>`;

  svg.innerHTML =
    `<defs><pattern id="mesh" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0h4M0 0v4" stroke="rgba(200,210,220,.25)" stroke-width=".6"/></pattern></defs>` + g;

  document.getElementById("planSummary").textContent =
    [TIPOS[s.tipo], s.color, s.vidrio.split(" ")[0], ...s.extras].join(" · ");
}

form.addEventListener("input", draw);
form.addEventListener("change", draw);
draw();

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = form.elements;
  const missing = ["nombre", "telefono"].filter((n) => !f[n].value.trim());
  form.querySelectorAll(".field").forEach((l) => l.classList.toggle("is-invalid", missing.includes(l.querySelector("input, textarea").name)));
  if (missing.length) {
    formError.textContent = "Completá tu nombre y teléfono para que te podamos responder.";
    f[missing[0]].focus();
    return;
  }
  const s = state();
  const text = [
    `Hola Canafa, soy ${f.nombre.value.trim()}. Quiero pedir un presupuesto:`,
    ``,
    `• ${TIPOS[s.tipo]} × ${s.qty}`,
    `• Medidas: ${s.w} × ${s.h} cm`,
    `• Color: ${s.color}`,
    `• Vidrio: ${s.vidrio}`,
    s.extras.length ? `• Extras: ${s.extras.join(", ")}` : null,
    f.zona.value.trim() ? `• Zona: ${f.zona.value.trim()}` : null,
    ``,
    f.mensaje.value.trim() || null,
    `Tel: ${f.telefono.value.trim()}`,
  ].filter((l) => l !== null).join("\n");
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
});

document.getElementById("year").textContent = new Date().getFullYear();
