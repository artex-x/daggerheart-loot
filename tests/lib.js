/* Общее для наборов, которые открывают страницу в браузере.

   После каждого перехода тут стояла фиксированная пауза «на всякий случай»:
   по полсекунды на переход, сотни переходов за прогон - минуты ожидания,
   и всё равно наугад. На медленной машине паузы не хватало и набор падал на
   пустом месте, на быстрой она была втрое длиннее нужного.

   Вместо паузы - условие: страница готова, когда приложение что-то нарисовало
   в `#view`. Приложение рисует синхронно, так что условие выполняется в том же
   кадре, а не через полсекунды. */
const path = require('path');
const ROOT = 'file://' + path.join(__dirname, '..', 'index.html');

async function ready(page){
  await page.waitForFunction(function () {
    const v = document.querySelector('#view');
    return !!(v && v.children.length);
  }, { timeout: 8000, polling: 'raf' });
  /* Кадр сверху: разметка уже в DOM, но макет ещё не посчитан, а половина
     проверок читает именно размеры и цвета. */
  await page.evaluate(function () {
    return new Promise(function (r) {
      requestAnimationFrame(function () { requestAnimationFrame(r); });
    });
  });
}

/* Разбор снимка экрана в пиксели.

   Часть дефектов печати не видна ни в разметке, ни в размерах: тёмная полоса
   вдоль линии реза была ровно там, где всё сходилось по геометрии. Проверить её
   можно только по цвету готового изображения, а `page.screenshot` отдаёт PNG.
   Готового разборщика в наборе нет и заводить зависимость ради полусотни строк
   незачем: PNG от Chrome - всегда 8 бит на канал и без чересстрочности, а
   распаковку берёт на себя встроенный zlib. */
function readPNG(buf){
  let p = 8, w = 0, h = 0, depth = 0, type = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), tag = buf.toString('ascii', p + 4, p + 8);
    const d = buf.slice(p + 8, p + 8 + len);
    if (tag === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; type = d[9]; }
    else if (tag === 'IDAT') idat.push(d);
    else if (tag === 'IEND') break;
    p += 12 + len;                                  // длина + тег + данные + crc
  }
  if (depth !== 8 || (type !== 6 && type !== 2)) {
    throw new Error('PNG не тот: ' + depth + ' бит, тип ' + type);
  }
  const ch = type === 6 ? 4 : 3;
  const raw = require('zlib').inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(w * h * ch);
  /* Каждая строка своим способом предсказана по соседям слева и сверху -
     снимаем предсказание, иначе цвета будут разностями, а не цветами. */
  let q = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[q++], line = q;
    q += w * ch;
    for (let x = 0; x < w * ch; x++) {
      const a = x >= ch ? out[y * w * ch + x - ch] : 0;
      const b = y > 0 ? out[(y - 1) * w * ch + x] : 0;
      const c = (x >= ch && y > 0) ? out[(y - 1) * w * ch + x - ch] : 0;
      const v = raw[line + x];
      let r;
      if (f === 0) r = v;
      else if (f === 1) r = v + a;
      else if (f === 2) r = v + b;
      else if (f === 3) r = v + ((a + b) >> 1);
      else {
        const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      out[y * w * ch + x] = r & 255;
    }
  }
  return {
    w: w, h: h,
    lum: function (x, y) {
      const i = (y * w + x) * ch;
      return 0.2126 * out[i] + 0.7152 * out[i + 1] + 0.0722 * out[i + 2];
    }
  };
}

module.exports = { ROOT, ready, readPNG };
