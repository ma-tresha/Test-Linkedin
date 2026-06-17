/* =========================================================================
   TEMPLATES CONFIG — бренд "yma" / Yma Health
   -------------------------------------------------------------------------
   Каждый шаблон: размер холста, фон, зоны для изображений и зоны для текста.
   Порядок отрисовки в движке (app.js):
       1) background  — фон (карточка на сером + градиент/фото)
       2) imageZones  — фото пользователя (аватар, обложка)
       3) overlay()   — слой ПОВЕРХ фото (затемнение, белые карточки, кавычка)
       4) textZones   — текст
       5) topLayer()  — поверх текста (логотип)

   ЧТО ПОДСТАВИТЬ ДЛЯ ТОЧНОГО СОВПАДЕНИЯ С БРЕНДОМ:
   - Логотип: положите assets/logo-dark.png и assets/logo-white.png и укажите
     пути в BRAND.logoDark / BRAND.logoWhite ниже. Без них рисуется текст "yma".
   - Шрифты: фирменные Geist (тело) и GT Alpina Typewriter (заголовки)
     подключены локально через fonts.css (assets/fonts/). Имена шрифтов
     заданы в BRAND.fontBody / BRAND.fontDisplay ниже.
   ========================================================================= */

const BRAND = {
  name: "yma",
  logoDark: null,  // напр. "assets/logo-dark.png"
  logoWhite: null, // напр. "assets/logo-white.png"
  fontDisplay: "GT Alpina Typewriter", // заголовки («печатная машинка»)
  fontBody: "Geist",                   // тело
  ink: "#121316",
  page: "#f1f1f4",
};

/* Холст всех шаблонов: вертикаль 4:5 (лента LinkedIn) */
const W = 1080;
const H = 1350;
/* Скруглённая карточка на сером фоне */
const CARD = { m: 22, r: 48 };

/* --- хелперы для draw/overlay-функций (ctx — общий из app.js) --- */
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/* Серый фон + клип по скруглённой карточке; внутри рисует interior() */
function drawPageCard(ctx, w, h, interior) {
  ctx.fillStyle = BRAND.page;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  roundRectPath(CARD.m, CARD.m, w - 2 * CARD.m, h - 2 * CARD.m, CARD.r);
  ctx.clip();
  interior(ctx, w, h);
  ctx.restore();
}

/* Мягкое пятно градиента (для mesh-фона) */
function meshBlob(ctx, b) {
  const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
  g.addColorStop(0, rgba(b.c, b.a));
  g.addColorStop(1, rgba(b.c, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/* Белая карточка со скруглением и мягкой тенью (для списка Top-3) */
function whiteCard(ctx, x, y, w, h, r = 28) {
  ctx.save();
  ctx.shadowColor = "rgba(20,22,30,0.10)";
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#ffffff";
  roundRectPath(x, y, w, h, r);
  ctx.fill();
  ctx.restore();
}

/* =========================================================================
   ШАБЛОНЫ
   ========================================================================= */
const TEMPLATES = [
  /* --------------------------------------- 1. Интро-заголовок ------------ */
  {
    id: "intro",
    name: "Интро-заголовок",
    width: W,
    height: H,
    background: {
      type: "draw",
      draw(ctx, w, h) {
        drawPageCard(ctx, w, h, () => {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, w, h);
          [
            { x: 150, y: 1320, r: 560, c: "#9fb2f2", a: 0.95 },
            { x: 430, y: 1200, r: 540, c: "#c9b8f0", a: 0.85 },
            { x: 720, y: 1220, r: 540, c: "#f2c2d6", a: 0.9 },
            { x: 1000, y: 1120, r: 580, c: "#f6c6ab", a: 0.95 },
            { x: 760, y: 980, r: 430, c: "#f1d2cd", a: 0.6 },
          ].forEach((b) => meshBlob(ctx, b));
        });
      },
    },
    imageZones: [],
    topLayer(ctx, w, h) {
      drawBrandLogo(ctx, 74, h - 150, 96, "dark");
    },
    textZones: [
      { id: "headline", label: "Заголовок (1 слово)", x: 74, y: 120, w: 940, h: 300,
        text: "Solving", font: BRAND.fontDisplay, size: 170, weight: 400, color: BRAND.ink,
        lineHeight: 1.0, align: "left", autoFit: true },
      { id: "body", label: "Подзаголовок", x: 78, y: 470, w: 920, h: 380,
        text: "medical data privacy with confidential computing",
        font: BRAND.fontBody, size: 86, weight: 500, color: BRAND.ink,
        lineHeight: 1.1, align: "left", autoFit: true },
    ],
  },

  /* ----------------------------------------------- 2. Цитата ------------- */
  {
    id: "quote",
    name: "Цитата с автором",
    width: W,
    height: H,
    background: {
      type: "draw",
      draw(ctx, w, h) {
        drawPageCard(ctx, w, h, () => {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, w, h);
          meshBlob(ctx, { x: 1060, y: 80, r: 520, c: "#cdeccb", a: 0.55 });
          meshBlob(ctx, { x: 40, y: 1320, r: 560, c: "#e4eeb0", a: 0.5 });
        });
      },
    },
    overlay(ctx, w, h) {
      // крупная кавычка
      ctx.fillStyle = BRAND.ink;
      ctx.font = `600 170px "${BRAND.fontBody}", sans-serif`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillText("“", 70, 110);
    },
    imageZones: [
      { id: "avatar", label: "Фото автора", x: 74, y: 1118, w: 132, h: 132, fit: "cover", radius: 22 },
    ],
    textZones: [
      { id: "quote", label: "Текст цитаты", x: 74, y: 320, w: 940, h: 660,
        text: "Super Protocol's TEE technology helped us solve a fundamental challenge in medical data transfer. Now, Google's medical AI model MedGemma handles this within the secure environment.",
        font: BRAND.fontBody, size: 58, weight: 500, color: BRAND.ink, lineHeight: 1.3, align: "left", autoFit: true },
      { id: "name", label: "Имя", x: 240, y: 1140, w: 760,
        text: "Savvov Sergei,", font: BRAND.fontBody, size: 40, weight: 600, color: BRAND.ink, align: "left" },
      { id: "role", label: "Должность", x: 240, y: 1194, w: 760,
        text: "Co-founder, CTO, Yma Health", font: BRAND.fontBody, size: 40, weight: 400, color: BRAND.ink, align: "left" },
    ],
  },

  /* ------------------------------------------ 3. Список Top-3 ------------ */
  {
    id: "list",
    name: "Список (Top-3)",
    width: W,
    height: H,
    background: {
      type: "draw",
      draw(ctx, w, h) {
        drawPageCard(ctx, w, h, () => {
          ctx.fillStyle = "#f6f5f8";
          ctx.fillRect(0, 0, w, h);
          [
            { x: 120, y: 1320, r: 640, c: "#aebbf2", a: 0.5 },
            { x: 560, y: 1320, r: 640, c: "#e6c2d8", a: 0.5 },
            { x: 1000, y: 1260, r: 640, c: "#f6cdb4", a: 0.5 },
          ].forEach((b) => meshBlob(ctx, b));
        });
      },
    },
    imageZones: [],
    overlay(ctx, w, h) {
      whiteCard(ctx, 46, 336, 988, 300);
      whiteCard(ctx, 46, 672, 988, 300);
      whiteCard(ctx, 46, 1008, 988, 300);
    },
    textZones: [
      { id: "title", label: "Заголовок", x: 70, y: 70, w: 960, h: 220,
        text: "Top-3 hopes", font: BRAND.fontDisplay, size: 150, weight: 400, color: BRAND.ink,
        lineHeight: 1.0, align: "left", autoFit: true },

      { id: "t1", label: "Пункт 1 — заголовок", x: 92, y: 396, w: 900,
        text: "More access, less friction", font: BRAND.fontBody, size: 52, weight: 600, color: BRAND.ink, align: "left" },
      { id: "b1", label: "Пункт 1 — текст", x: 92, y: 480, w: 904, h: 120,
        text: "Make it easier for patients to get what they need, when they need it — in channels they actually use.",
        font: BRAND.fontBody, size: 34, weight: 400, color: "#3a3c40", lineHeight: 1.3, align: "left", autoFit: true },

      { id: "t2", label: "Пункт 2 — заголовок", x: 92, y: 732, w: 900,
        text: "Time back to clinicians", font: BRAND.fontBody, size: 52, weight: 600, color: BRAND.ink, align: "left" },
      { id: "b2", label: "Пункт 2 — текст", x: 92, y: 816, w: 904, h: 120,
        text: "Offload repetitive tasks so teams can focus on decisions, empathy, and outcomes.",
        font: BRAND.fontBody, size: 34, weight: 400, color: "#3a3c40", lineHeight: 1.3, align: "left", autoFit: true },

      { id: "t3", label: "Пункт 3 — заголовок", x: 92, y: 1068, w: 900,
        text: "One seamless workflow", font: BRAND.fontBody, size: 52, weight: 600, color: BRAND.ink, align: "left" },
      { id: "b3", label: "Пункт 3 — текст", x: 92, y: 1152, w: 904, h: 120,
        text: "Fewer tools to juggle, more systems that talk to each other.",
        font: BRAND.fontBody, size: 34, weight: 400, color: "#3a3c40", lineHeight: 1.3, align: "left", autoFit: true },
    ],
  },

  /* ---------------------------------------- 4. Фото-обложка -------------- */
  {
    id: "cover",
    name: "Фото-обложка",
    width: W,
    height: H,
    background: { type: "color", value: BRAND.page },
    imageZones: [
      { id: "photo", label: "Фоновое фото", x: CARD.m, y: CARD.m, w: W - 2 * CARD.m, h: H - 2 * CARD.m, fit: "cover", radius: CARD.r },
    ],
    overlay(ctx, w, h) {
      ctx.save();
      roundRectPath(CARD.m, CARD.m, w - 2 * CARD.m, h - 2 * CARD.m, CARD.r);
      ctx.clip();
      // затемнение снизу
      const gv = ctx.createLinearGradient(0, h * 0.35, 0, h);
      gv.addColorStop(0, "rgba(10,10,12,0)");
      gv.addColorStop(1, "rgba(10,10,12,0.82)");
      ctx.fillStyle = gv;
      ctx.fillRect(0, 0, w, h);
      // лёгкое затемнение слева/сверху для логотипа
      const gh = ctx.createLinearGradient(0, 0, w * 0.55, 0);
      gh.addColorStop(0, "rgba(10,10,12,0.55)");
      gh.addColorStop(1, "rgba(10,10,12,0)");
      ctx.fillStyle = gh;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    },
    topLayer(ctx, w, h) {
      drawBrandLogo(ctx, 70, 74, 78, "white");
    },
    textZones: [
      { id: "title", label: "Заголовок", x: 70, y: 980, w: 944, h: 320,
        text: "Clinician's top hopes & fears around AI",
        font: BRAND.fontDisplay, size: 96, weight: 400, color: "#ffffff", lineHeight: 1.06, align: "left", autoFit: true },
    ],
  },
];
