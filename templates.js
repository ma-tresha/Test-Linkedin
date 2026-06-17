/* =========================================================================
   TEMPLATES CONFIG
   -------------------------------------------------------------------------
   Каждый шаблон описывает: размер холста, фон, зоны для изображений и зоны
   для текста. Движок (app.js) рисует их в таком порядке:
       1) background   — фон (картинка PNG, заливка цветом или draw-функция)
       2) imageZones   — фото, которые загружает пользователь
       3) overlay()    — слой ПОВЕРХ фото (затемнение, рамки, логотип)
       4) textZones    — текст
       5) topLayer()   — слой поверх текста (опционально, напр. логотип в углу)

   КАК ПОДСТАВИТЬ ВАШИ РЕАЛЬНЫЕ ШАБЛОНЫ:
   - Положите фоновый PNG в папку templates/ (напр. templates/quote.png).
   - В шаблоне замените `background: { type: 'draw', ... }`
     на `background: { type: 'image', src: 'templates/quote.png' }`.
   - Подвиньте координаты текстовых/фото-зон под ваш дизайн (x, y, w, h
     заданы в пикселях относительно холста width × height).
   - Удалите/добавьте шаблоны в массиве TEMPLATES.
   ========================================================================= */

/* --- Демо-бренд (замените под свой брендбук) --- */
const BRAND = {
  name: "REFORMA HEALTH",
  handle: "reforma.health",
  ink: "#eafffb",
  dark: "#0b1f1e",
  teal: "#0e5e5a",
  tealLight: "#0fa3a0",
  accent: "#7ef0d6",
  fontHead: "Montserrat",
  fontBody: "Inter",
};

/* --- Маленькие хелперы для draw/overlay-функций --- */
function bgGradient(ctx, w, h, from, to, vertical = true) {
  const g = vertical
    ? ctx.createLinearGradient(0, 0, 0, h)
    : ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/* Логотип-вордмарк бренда (текстовый, легко заменить на картинку логотипа) */
function drawWordmark(ctx, x, y, color = BRAND.ink, size = 26) {
  ctx.save();
  // маркер-точка
  ctx.fillStyle = BRAND.tealLight;
  ctx.beginPath();
  ctx.arc(x + size * 0.3, y, size * 0.34, 0, Math.PI * 2);
  ctx.fill();
  // текст
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px ${BRAND.fontHead}, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(BRAND.name, x + size * 0.9, y + 1);
  ctx.restore();
}

/* =========================================================================
   ШАБЛОНЫ
   ========================================================================= */
const TEMPLATES = [
  /* -------------------------------------------------- 1. Цитата ---------- */
  {
    id: "quote",
    name: "Цитата (1080×1080)",
    width: 1080,
    height: 1080,
    background: {
      type: "draw",
      draw(ctx, w, h) {
        bgGradient(ctx, w, h, "#0e5e5a", "#06201f");
        // крупный полупрозрачный знак кавычки-водяной
        ctx.save();
        ctx.fillStyle = "rgba(126, 240, 214, 0.10)";
        ctx.font = `800 520px Georgia, serif`;
        ctx.textBaseline = "top";
        ctx.fillText("“", 620, 380);
        ctx.restore();
      },
    },
    imageZones: [
      // Аватар автора (круглый)
      { id: "avatar", label: "Фото автора", x: 80, y: 838, w: 110, h: 110, fit: "cover", radius: 9999, optional: true },
    ],
    overlay(ctx, w, h) {
      drawWordmark(ctx, 80, 96, BRAND.ink, 30);
      // нижняя акцентная линия
      ctx.fillStyle = BRAND.tealLight;
      ctx.fillRect(80, 800, 60, 5);
    },
    textZones: [
      { id: "quote", label: "Цитата", x: 80, y: 250, w: 880, h: 470,
        text: "Мы лечим не симптомы, а возвращаем людям качество жизни.",
        font: BRAND.fontHead, size: 64, weight: 700, color: BRAND.ink, lineHeight: 1.18, align: "left", autoFit: true },
      { id: "author", label: "Имя автора", x: 215, y: 868, w: 760,
        text: "Анна Иванова", font: BRAND.fontBody, size: 30, weight: 700, color: BRAND.ink, align: "left" },
      { id: "role", label: "Должность", x: 215, y: 912, w: 760,
        text: "Медицинский директор", font: BRAND.fontBody, size: 22, weight: 500, color: BRAND.accent, align: "left" },
    ],
  },

  /* ------------------------------------------- 2. Анонс с фото ----------- */
  {
    id: "announcement",
    name: "Анонс с фото (1080×1080)",
    width: 1080,
    height: 1080,
    background: { type: "color", value: "#0b1f1e" },
    imageZones: [
      { id: "photo", label: "Главное изображение", x: 0, y: 0, w: 1080, h: 600, fit: "cover" },
    ],
    overlay(ctx, w, h) {
      // плавный переход фото -> панель
      const g = ctx.createLinearGradient(0, 470, 0, 600);
      g.addColorStop(0, "rgba(11,31,30,0)");
      g.addColorStop(1, "rgba(11,31,30,1)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 470, w, 130);
      // акцентная линия
      ctx.fillStyle = BRAND.tealLight;
      ctx.fillRect(80, 690, 56, 5);
    },
    topLayer(ctx, w, h) {
      drawWordmark(ctx, 80, h - 70, BRAND.ink, 26);
    },
    textZones: [
      { id: "kicker", label: "Рубрика (надзаголовок)", x: 80, y: 648, w: 920,
        text: "НОВОСТЬ", font: BRAND.fontBody, size: 22, weight: 700, color: BRAND.accent, align: "left", uppercase: true, letterSpacing: 2 },
      { id: "title", label: "Заголовок", x: 80, y: 716, w: 920, h: 200,
        text: "Открываем новый центр диагностики в Берлине",
        font: BRAND.fontHead, size: 56, weight: 800, color: "#ffffff", lineHeight: 1.12, align: "left", autoFit: true },
      { id: "subtitle", label: "Подзаголовок", x: 80, y: 936, w: 860,
        text: "Современное оборудование и приём с 1 июля.",
        font: BRAND.fontBody, size: 26, weight: 500, color: "#bfeae7", lineHeight: 1.3, align: "left" },
    ],
  },

  /* ---------------------------------------------- 3. Статистика ---------- */
  {
    id: "stat",
    name: "Статистика (1080×1080)",
    width: 1080,
    height: 1080,
    background: {
      type: "draw",
      draw(ctx, w, h) {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, "#0fa3a0");
        g.addColorStop(1, "#0b423f");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // декоративные круги
        ctx.strokeStyle = "rgba(255,255,255,0.10)";
        ctx.lineWidth = 2;
        [180, 320, 460].forEach((r) => {
          ctx.beginPath();
          ctx.arc(w - 60, 120, r, 0, Math.PI * 2);
          ctx.stroke();
        });
      },
    },
    imageZones: [],
    topLayer(ctx, w, h) {
      // центрируем вордмарк сверху
      ctx.save();
      ctx.font = `700 30px ${BRAND.fontHead}, sans-serif`;
      const tw = ctx.measureText(BRAND.name).width + 30;
      ctx.restore();
      drawWordmark(ctx, (w - tw) / 2, 110, "#ffffff", 30);
    },
    textZones: [
      { id: "value", label: "Цифра / показатель", x: 80, y: 330, w: 920, h: 260,
        text: "98%", font: BRAND.fontHead, size: 240, weight: 800, color: "#ffffff", align: "center", autoFit: true },
      { id: "caption", label: "Описание", x: 140, y: 640, w: 800,
        text: "пациентов рекомендуют нас друзьям и близким",
        font: BRAND.fontBody, size: 38, weight: 600, color: "#eafffb", lineHeight: 1.3, align: "center" },
    ],
  },

  /* ------------------------------------- 4. Горизонтальный баннер -------- */
  {
    id: "banner",
    name: "Баннер для ссылки (1200×628)",
    width: 1200,
    height: 628,
    background: { type: "color", value: "#0b1f1e" },
    imageZones: [
      { id: "photo", label: "Фоновое изображение", x: 0, y: 0, w: 1200, h: 628, fit: "cover" },
    ],
    overlay(ctx, w, h) {
      // затемнение слева для читабельности текста
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(7,32,31,0.92)");
      g.addColorStop(0.55, "rgba(7,32,31,0.55)");
      g.addColorStop(1, "rgba(7,32,31,0.05)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = BRAND.tealLight;
      ctx.fillRect(70, 250, 56, 5);
    },
    topLayer(ctx, w, h) {
      drawWordmark(ctx, 70, 80, BRAND.ink, 26);
    },
    textZones: [
      { id: "title", label: "Заголовок", x: 70, y: 286, w: 680, h: 200,
        text: "Здоровье, которому доверяют",
        font: BRAND.fontHead, size: 58, weight: 800, color: "#ffffff", lineHeight: 1.1, align: "left", autoFit: true },
      { id: "subtitle", label: "Подзаголовок", x: 70, y: 500, w: 620,
        text: "Запишитесь на консультацию онлайн за 2 минуты.",
        font: BRAND.fontBody, size: 24, weight: 500, color: "#cfeeeb", lineHeight: 1.3, align: "left" },
    ],
  },
];
