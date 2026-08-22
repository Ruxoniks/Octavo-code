/*
  Проверки смотрят на вывод в консоли, а не на текст кода: починить цикл можно
  по-разному, и любой честный способ должен засчитываться.
*/
function printed(t) {
  var text = t.output();
  t.assert(
    text.length > 0,
    'Скрипт ничего не напечатал. Строка console.log(message) должна остаться на месте — чиним цикл, а не вывод.',
  );
  return text;
}

check('no-undefined', 'В выводе нет лишнего undefined', function (t) {
  var text = printed(t);
  t.assert(
    text.indexOf('undefined') === -1,
    'В консоли всё ещё «' +
      text.trim() +
      '». undefined появляется, когда цикл заходит за последний элемент: у массива из трёх покупок индексы 0, 1 и 2, а items[3] не существует.',
  );
  return 'Вывод чистый';
});

check('all-items', 'Все три покупки на месте', function (t) {
  var text = printed(t);
  var missing = [];
  var items = ['молоко', 'кофе', 'сахар'];

  for (var i = 0; i < items.length; i++) {
    if (text.indexOf(items[i]) === -1) missing.push(items[i]);
  }

  t.assert(
    missing.length === 0,
    'В выводе не хватает: ' +
      missing.join(', ') +
      '. Похоже, цикл теперь останавливается слишком рано — проверь, с какого числа он начинает и на каком заканчивает.',
  );
  return 'В списке: ' + items.join(', ');
});

check('list-intact', 'Список покупок не переписан', function (t) {
  var node = t.$('script[data-file="script.js"]');
  t.assert(node, 'Не нашёл script.js — он подключён из index.html, эту строку не трогай.');

  var source = node.textContent || '';
  var array = source.match(/\[([^\]]*)\]/);
  t.assert(array, 'В файле пропал массив items — он нужен, чтобы было что печатать.');

  var count = array[1].split(',').filter(function (part) {
    return part.trim().length > 0;
  }).length;

  t.assert(
    count === 3,
    'Покупок в массиве: ' +
      count +
      ', а было три. Лишнее undefined убирается починкой цикла, а не правкой списка: завтра в него добавят четвёртый товар, и ошибка вернётся.',
  );
  return 'Массив цел: ' + count + ' покупки';
});
