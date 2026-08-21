check('link', 'Есть ссылка с адресом и текстом', function (t) {
  var link = t.$('a[href]');
  t.assert(link, 'Ссылки нет. Тег <a> без атрибута href — не ссылка, а просто текст.');
  var href = t.attr(link, 'href') || '';
  t.assert(href.indexOf('https://') === 0, 'Адрес «' + href + '» не похож на внешнюю ссылку — он должен начинаться с https://');
  var text = t.text(link);
  t.assert(text.length >= 4, 'У ссылки нет понятного текста. «Тут» и «ссылка» не считаются.');
  t.assert(
    t.attr(link, 'target') === '_blank',
    'Ссылка откроется в этой же вкладке и твоя страница исчезнет. Добавь target="_blank", а рядом rel="noopener".',
  );
  return 'Ссылка: «' + text + '», откроется в новой вкладке';
});

check('image', 'Картинка с осмысленным alt', function (t) {
  var image = t.$('img');
  t.assert(image, 'Тега <img> нет.');
  var src = t.attr(image, 'src') || '';
  t.assert(src.length > 0, 'У картинки пустой src — браузеру нечего загружать.');
  var alt = t.normalize(t.attr(image, 'alt') || '');
  t.assert(alt.length > 0, 'У картинки нет alt. Это описание для тех, кто её не видит.');
  t.assert(alt.split(' ').length >= 3, 'alt слишком короткий: «' + alt + '». Опиши картинку хотя бы тремя словами.');
  return 'Картинка описана: «' + alt + '»';
});

check('ordered-list', 'Нумерованный список из трёх пунктов', function (t) {
  var list = t.$('ol');
  t.assert(list, 'Нумерованного списка <ol> нет. У <ul> кружочки, у <ol> номера.');
  var items = list.querySelectorAll('li');
  t.assert(
    items.length > 0,
    'Список <ol> есть, но пунктов в нём нет. Текст пишут не в сам <ol>, а в отдельные <li> внутри него.',
  );
  t.assert(items.length >= 3, 'Пунктов в списке: ' + items.length + '. Нужно минимум три.');
  return 'Пунктов: ' + items.length;
});
