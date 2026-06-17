/* =========================================================================
   LinkedIn Post Builder — движок рендеринга на canvas
   ========================================================================= */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const templateSelect = document.getElementById("templateSelect");
const fieldsEl = document.getElementById("fields");
const canvasMeta = document.getElementById("canvasMeta");
const downloadBtn = document.getElementById("downloadBtn");

const state = {
  template: null,
  values: {}, // zoneId -> string
  images: {}, // zoneId -> HTMLImageElement
};

const bgCache = {}; // templateId -> HTMLImageElement (для background.type === 'image')
const assetCache = {}; // src -> HTMLImageElement | null (логотипы и пр.)
let renderSeq = 0;
let assetsReady = null;

/* Предзагрузка брендовых ассетов (логотипы), если заданы пути */
function ensureAssets() {
  if (assetsReady) return assetsReady;
  const srcs = [BRAND.logoDark, BRAND.logoWhite].filter(Boolean);
  assetsReady = Promise.all(
    srcs.map((src) =>
      loadImageFromSrc(src).then(
        (img) => { assetCache[src] = img; },
        () => { assetCache[src] = null; }
      )
    )
  );
  return assetsReady;
}

/* Рисует логотип бренда: картинку из ассетов или текстовый вариант "yma" */
function drawBrandLogo(ctx, x, y, height, variant = "dark") {
  const src = variant === "white" ? BRAND.logoWhite : BRAND.logoDark;
  const img = src ? assetCache[src] : null;
  if (img) {
    const ratio = img.width / img.height;
    ctx.drawImage(img, x, y, height * ratio, height);
    return;
  }
  // текстовая заглушка
  ctx.save();
  ctx.fillStyle = variant === "white" ? "#ffffff" : BRAND.ink;
  ctx.font = `800 ${height * 1.05}px "${BRAND.fontBody}", sans-serif`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(BRAND.name, x, y);
  ctx.restore();
}

/* ----------------------------- утилиты ---------------------------------- */

function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/* Рисует изображение в прямоугольник с режимом cover/contain и скруглением */
function drawImageFit(image, zone) {
  const { x, y, w, h, fit = "cover", radius = 0 } = zone;
  ctx.save();
  if (radius) {
    roundRectPath(x, y, w, h, radius);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
  }

  const ir = image.width / image.height;
  const zr = w / h;
  let dw, dh, dx, dy;
  if (fit === "contain") {
    if (ir > zr) { dw = w; dh = w / ir; } else { dh = h; dw = h * ir; }
  } else {
    // cover
    if (ir > zr) { dh = h; dw = h * ir; } else { dw = w; dh = w / ir; }
  }
  dx = x + (w - dw) / 2;
  dy = y + (h - dh) / 2;
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.restore();
}

function roundRectPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* Плейсхолдер для пустой обязательной фото-зоны */
function drawImagePlaceholder(zone) {
  const { x, y, w, h, radius = 0 } = zone;
  ctx.save();
  ctx.fillStyle = "rgba(20,22,30,0.06)";
  if (radius) roundRectPath(x, y, w, h, radius);
  else { ctx.beginPath(); ctx.rect(x, y, w, h); }
  ctx.fill();
  // иконка
  ctx.strokeStyle = "rgba(20,22,30,0.30)";
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.012);
  const cx = x + w / 2, cy = y + h / 2, s = Math.min(w, h) * 0.18;
  ctx.strokeRect(cx - s, cy - s * 0.75, s * 2, s * 1.5);
  ctx.beginPath();
  ctx.moveTo(cx - s, cy + s * 0.55);
  ctx.lineTo(cx - s * 0.25, cy - s * 0.1);
  ctx.lineTo(cx + s * 0.25, cy + s * 0.3);
  ctx.lineTo(cx + s, cy - s * 0.25);
  ctx.stroke();
  ctx.fillStyle = "rgba(20,22,30,0.45)";
  ctx.font = `600 ${Math.max(14, Math.min(w, h) * 0.05)}px ${BRAND.fontBody}, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(zone.label || "Изображение", cx, cy + s * 0.95);
  ctx.restore();
}

/* Перенос текста по словам с учётом \n */
function wrapText(text, maxW) {
  const lines = [];
  text.split("\n").forEach((para) => {
    if (para === "") { lines.push(""); return; }
    const words = para.split(/\s+/);
    let line = "";
    words.forEach((word) => {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
  });
  return lines;
}

/* Рисует одну строку с опциональным межбуквенным интервалом */
function drawLine(line, anchorX, y, align, ls) {
  if (!ls) {
    ctx.textAlign = align;
    ctx.fillText(line, anchorX, y);
    return;
  }
  ctx.textAlign = "left";
  const chars = [...line];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + ls * (chars.length - 1);
  let startX = anchorX;
  if (align === "center") startX = anchorX - total / 2;
  else if (align === "right") startX = anchorX - total;
  let cx = startX;
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + ls;
  });
}

function drawTextZone(zone, value) {
  let text = value != null && value !== "" ? value : (zone.text || "");
  if (!text) return;
  if (zone.uppercase) text = text.toUpperCase();

  const lineHeight = zone.lineHeight || 1.2;
  const fontFamily = `"${zone.font || BRAND.fontBody}", sans-serif`;
  let size = zone.size;
  let lines;

  // авто-подгонка размера, чтобы текст влез по высоте зоны
  if (zone.autoFit && zone.h) {
    while (size > 12) {
      ctx.font = `${zone.weight || 600} ${size}px ${fontFamily}`;
      lines = wrapText(text, zone.w);
      const totalH = lines.length * size * lineHeight;
      if (totalH <= zone.h) break;
      size -= 2;
    }
  } else {
    ctx.font = `${zone.weight || 600} ${size}px ${fontFamily}`;
    lines = wrapText(text, zone.w);
  }

  ctx.font = `${zone.weight || 600} ${size}px ${fontFamily}`;
  ctx.fillStyle = zone.color || "#000";
  ctx.textBaseline = "top";
  const align = zone.align || "left";
  let anchorX = zone.x;
  if (align === "center") anchorX = zone.x + zone.w / 2;
  else if (align === "right") anchorX = zone.x + zone.w;

  let y = zone.y;
  lines.forEach((line) => {
    drawLine(line, anchorX, y, align, zone.letterSpacing || 0);
    y += size * lineHeight;
  });
}

/* --------------------------- основной рендер ---------------------------- */

async function render() {
  const tpl = state.template;
  if (!tpl) return;
  const seq = ++renderSeq;
  await ensureAssets();
  if (seq !== renderSeq) return;

  canvas.width = tpl.width;
  canvas.height = tpl.height;
  ctx.clearRect(0, 0, tpl.width, tpl.height);

  // 1) фон
  const bg = tpl.background || { type: "color", value: "#ffffff" };
  if (bg.type === "color") {
    ctx.fillStyle = bg.value;
    ctx.fillRect(0, 0, tpl.width, tpl.height);
  } else if (bg.type === "draw") {
    bg.draw(ctx, tpl.width, tpl.height);
  } else if (bg.type === "image") {
    if (!bgCache[tpl.id]) {
      try { bgCache[tpl.id] = await loadImageFromSrc(bg.src); }
      catch { bgCache[tpl.id] = null; }
    }
    if (seq !== renderSeq) return; // отменён более новым рендером
    if (bgCache[tpl.id]) {
      drawImageFit(bgCache[tpl.id], { x: 0, y: 0, w: tpl.width, h: tpl.height, fit: "cover" });
    } else {
      ctx.fillStyle = "#0b1f1e";
      ctx.fillRect(0, 0, tpl.width, tpl.height);
    }
  }

  // 2) фото-зоны пользователя
  (tpl.imageZones || []).forEach((zone) => {
    const img = state.images[zone.id];
    if (img) drawImageFit(img, zone);
    else if (!zone.optional) drawImagePlaceholder(zone);
  });

  // 3) overlay поверх фото
  if (tpl.overlay) tpl.overlay(ctx, tpl.width, tpl.height);

  // 4) текст
  (tpl.textZones || []).forEach((zone) => {
    drawTextZone(zone, state.values[zone.id]);
  });

  // 5) слой поверх текста
  if (tpl.topLayer) tpl.topLayer(ctx, tpl.width, tpl.height);

  canvasMeta.textContent = `${tpl.width} × ${tpl.height} px`;
}

/* ----------------------------- интерфейс -------------------------------- */

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
const renderDebounced = debounce(render, 120);

function buildFields(tpl) {
  fieldsEl.innerHTML = "";
  state.values = {};
  state.images = {};

  // текстовые зоны
  (tpl.textZones || []).forEach((zone) => {
    state.values[zone.id] = zone.text || "";
    const wrap = document.createElement("div");
    wrap.className = "field";
    const label = document.createElement("label");
    label.textContent = zone.label || zone.id;
    label.htmlFor = `f-${zone.id}`;

    const multiline = (zone.text || "").length > 40 || zone.autoFit;
    const input = document.createElement(multiline ? "textarea" : "input");
    if (!multiline) input.type = "text";
    input.id = `f-${zone.id}`;
    input.value = zone.text || "";
    input.addEventListener("input", () => {
      state.values[zone.id] = input.value;
      renderDebounced();
    });

    wrap.append(label, input);
    fieldsEl.appendChild(wrap);
  });

  // фото-зоны
  (tpl.imageZones || []).forEach((zone) => {
    const wrap = document.createElement("div");
    wrap.className = "field filefield";
    const label = document.createElement("label");
    label.textContent = zone.label + (zone.optional ? " (опционально)" : "");

    const row = document.createElement("div");
    row.className = "file-row";

    const btn = document.createElement("label");
    btn.className = "file-btn";
    btn.textContent = "Выбрать файл";
    btn.htmlFor = `file-${zone.id}`;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.id = `file-${zone.id}`;

    const nameEl = document.createElement("span");
    nameEl.className = "file-name";

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "file-clear";
    clearBtn.textContent = "✕";
    clearBtn.title = "Убрать";
    clearBtn.style.display = "none";

    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        state.images[zone.id] = await loadImageFromFile(file);
        nameEl.textContent = file.name;
        clearBtn.style.display = "inline";
        render();
      } catch {
        nameEl.textContent = "Не удалось загрузить изображение";
      }
    });
    clearBtn.addEventListener("click", () => {
      delete state.images[zone.id];
      input.value = "";
      nameEl.textContent = "";
      clearBtn.style.display = "none";
      render();
    });

    row.append(btn, nameEl, clearBtn);
    wrap.append(label, row);
    fieldsEl.appendChild(wrap);
  });
}

function selectTemplate(id) {
  state.template = TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
  buildFields(state.template);
  render();
}

function download() {
  const tpl = state.template;
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `${tpl.id}-${stamp}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, "image/png");
}

/* ------------------------------- старт ---------------------------------- */

function init() {
  TEMPLATES.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    templateSelect.appendChild(opt);
  });
  templateSelect.addEventListener("change", () => selectTemplate(templateSelect.value));
  downloadBtn.addEventListener("click", download);
  selectTemplate(TEMPLATES[0].id);
}

/* Явно подгружаем веб-шрифты — canvas не качает их сам, пока ими не
   отрисован DOM-элемент, поэтому document.fonts.load() обязателен. */
function ensureFonts() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  const specs = [
    `400 64px "${BRAND.fontDisplay}"`,
    `400 64px "${BRAND.fontBody}"`,
    `500 64px "${BRAND.fontBody}"`,
    `600 64px "${BRAND.fontBody}"`,
  ];
  return Promise.all(specs.map((s) => document.fonts.load(s).catch(() => {})));
}

// стартуем сразу, а после загрузки шрифтов перерисовываем правильным шрифтом
init();
ensureFonts().then(() => render());
