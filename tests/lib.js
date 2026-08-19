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

module.exports = { ROOT, ready };
