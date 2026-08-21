/*
  Итог главы. Каждая проверка — одно умение, которому учило одно из заданий,
  и в сообщении об ошибке названо, какое именно.
*/
function documentOf(t) {
  var body = t.$('body');
  t.assert(body, 'На странице нет <body> — без него браузеру нечего показывать.');
  return body.ownerDocument;
}

check('page-declares-itself', 'Страница представляется браузеру', function (t) {
  var doc = documentOf(t);

  t.assert(
    doc.doctype,
    'Пропала первая строка <!doctype html>. Без неё браузер включает режим совместимости со старым вебом, и вёрстка может поехать без всякой причины.',
  );

  var lang = t.attr('html', 'lang') || '';
  t.assert(
    lang.length > 0,
    'У тега <html> нет атрибута lang. Он говорит, на каком языке страница: по нему работают переводчики и программы чтения вслух.',
  );

  var title = t.text('title');
  t.assert(title.length > 0, 'Подпись вкладки пустая. За неё отвечает <title> внутри <head>.');
  t.assert(
    title !== 'Документ',
    'В <title> так и осталось стандартное «Документ». Это первое, что человек видит во вкладке и в закладках.',
  );

  return 'Вкладка подписана: «' + title + '»';
});

check('semantic-structure', 'Страница разложена на смысловые части', function (t) {
  var missing = [];
  if (!t.$('header')) missing.push('<header>');
  if (!t.$('main')) missing.push('<main>');
  if (!t.$('footer')) missing.push('<footer>');

  t.assert(
    missing.length === 0,
    'Не хватает частей страницы: ' + missing.join(', ') + '. Это было в задании «Вложенность и структура».',
  );
  t.assert(t.count('main') === 1, 'Тегов <main> на странице ' + t.count('main') + '. Основное содержимое у страницы одно.');

  return 'Шапка, основная часть и подвал на месте';
});

check('one-heading', 'Главный заголовок один и стоит в шапке', function (t) {
  var count = t.count('h1');
  t.assert(count > 0, 'Заголовка <h1> нет. Он отвечает на вопрос «о чём эта страница».');
  t.assert(count === 1, 'Заголовков <h1> на странице: ' + count + '. Главная мысль одна — и <h1> должен быть один.');
  t.assert(
    t.$('header h1'),
    '<h1> оказался за пределами шапки. Это было в задании «Вложенность и структура»: тег лежит внутри того, к чему относится по смыслу.',
  );

  return 'Заголовок: «' + t.text('h1') + '»';
});

check('paragraphs', 'На странице есть связный текст', function (t) {
  var paragraphs = t.$$('main p');
  var filled = 0;

  for (var i = 0; i < paragraphs.length; i++) {
    if (t.text(paragraphs[i]).length >= 40) filled += 1;
  }

  t.assert(
    filled >= 2,
    'Внутри <main> нашлось абзацев с текстом: ' +
      filled +
      '. Нужно хотя бы два, и не из двух слов — расскажи о себе так, чтобы это было интересно читать.',
  );
  return 'Абзацев с текстом: ' + filled;
});

check('list', 'Перечисление сделано списком', function (t) {
  var lists = t.$$('main ul, main ol');
  t.assert(
    lists.length > 0,
    'Внутри <main> нет списка. Перечисление умений — это как раз список, а не абзац через запятую. Это было в заданиях «Вложенность и структура» и «Ссылки, картинки и атрибуты».',
  );

  var biggest = 0;
  for (var i = 0; i < lists.length; i++) {
    biggest = Math.max(biggest, lists[i].querySelectorAll('li').length);
  }

  t.assert(biggest >= 3, 'В самом длинном списке пунктов: ' + biggest + '. Ты научился большему — перечисли хотя бы три вещи.');
  return 'Пунктов в списке: ' + biggest;
});

check('image', 'Картинка подписана словами', function (t) {
  var image = t.$('img');
  t.assert(image, 'Картинки нет. Рядом с index.html лежит файл avatar.svg.');

  var src = t.attr(image, 'src') || '';
  t.assert(src.length > 0, 'У картинки пустой src — браузеру нечего загружать.');

  var alt = t.normalize(t.attr(image, 'alt') || '');
  t.assert(alt.length > 0, 'У картинки нет alt. Это описание для тех, кто её не видит, — задание «Ссылки, картинки и атрибуты».');
  t.assert(alt.split(' ').length >= 3, 'Описание «' + alt + '» слишком короткое. Опиши картинку хотя бы тремя словами.');

  return 'Картинка описана: «' + alt + '»';
});

check('link', 'Ссылка уводит наружу, но не уводит человека', function (t) {
  var links = t.$$('a[href]');
  var external = null;

  for (var i = 0; i < links.length; i++) {
    if ((t.attr(links[i], 'href') || '').indexOf('https://') === 0) external = links[i];
  }

  t.assert(external, 'На странице нет ни одной внешней ссылки. Сошлись на что угодно: справочник, свой профиль, эту игру.');
  t.assert(t.text(external).length >= 4, 'У ссылки нет понятного текста. «Тут» и «ссылка» не считаются.');
  t.assert(
    t.attr(external, 'target') === '_blank',
    'Ссылка заменит собой твою страницу. Открой её в новой вкладке через target="_blank" — задание «Ссылки, картинки и атрибуты».',
  );

  return 'Ссылка: «' + t.text(external) + '»';
});

check('nothing-loose', 'Ничего не потерялось между частями', function (t) {
  var body = t.$('body');
  var loose = [];

  for (var i = 0; i < body.children.length; i++) {
    var tag = body.children[i].tagName.toLowerCase();
    if (tag === 'header' || tag === 'main' || tag === 'footer' || tag === 'script') continue;
    loose.push('<' + tag + '>');
  }

  t.assert(
    loose.length === 0,
    'Прямо в <body> лежит ' +
      loose.join(', ') +
      ' — мимо шапки, основной части и подвала. У каждого куска страницы должно быть своё место.',
  );

  return 'Всё содержимое разложено по местам';
});
