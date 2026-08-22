check('notes-are-articles', 'Заметки стали самостоятельными', function (t) {
  var articles = t.count('main article');
  t.assert(
    articles > 0,
    'Ни одной <article> на полосе нет. Заметку можно вырезать и показать в чужой ленте — она останется понятной. Это ровно то, про что тег <article>.',
  );
  t.assert(
    articles >= 4,
    'Заметок в <article>: ' +
      articles +
      '. Их должно быть четыре: три готовых плюс та, которую ты дописываешь сам.',
  );
  return 'Самостоятельных заметок: ' + articles;
});

check('articles-have-titles', 'У каждой заметки свой заголовок', function (t) {
  var articles = t.$$('article');
  var without = [];

  for (var i = 0; i < articles.length; i++) {
    if (!articles[i].querySelector('h1, h2, h3, h4, h5, h6')) without.push(i + 1);
  }

  t.assert(
    without.length === 0,
    'Заметка без заголовка (номер ' +
      without[0] +
      '). Вынесенная в чужую ленту заметка начинается с заголовка — иначе непонятно, что это.',
  );
  return 'Заголовок есть у каждой из ' + articles.length;
});

check('about-stays-section', 'Блок «О редакции» остался разделом', function (t) {
  var about = t.$('.about');
  t.assert(about, 'Блок «О редакции» пропал со страницы. Он должен остаться — меняется только тег у заметок.');
  t.assert(
    about.tagName.toLowerCase() !== 'article',
    'Блок «О редакции» стал <article>. Но вынести его со страницы нельзя: в чужой ленте «мы делаем газету вчетвером» — это про кого? Такой блок остаётся <section>.',
  );
  t.assert(
    about.tagName.toLowerCase() === 'section',
    'Блок «О редакции» теперь <' + about.tagName.toLowerCase() + '>. Это смысловой раздел страницы — его тег <section>.',
  );
  return 'Раздел «О редакции» на месте';
});

check('no-section-notes', 'Заметок-разделов не осталось', function (t) {
  var leftovers = t.count('section.note');
  t.assert(
    leftovers === 0,
    'Ещё осталось заметок с тегом <section>: ' +
      leftovers +
      '. Раздел — это часть страницы, а заметка — вещь в себе.',
  );
  return 'Все заметки переведены в <article>';
});

check('no-nested-articles', 'Заметки не вложены друг в друга', function (t) {
  t.assert(
    t.count('article article') === 0,
    'Одна <article> оказалась внутри другой. Так бывает — например, комментарий внутри поста, — но здесь это значит, что закрывающий тег попал не туда.',
  );
  return 'Каждая заметка сама по себе';
});

function noteAbout(t, word) {
  var articles = t.$$('main article');
  for (var i = 0; i < articles.length; i++) {
    if (t.text(articles[i]).toLowerCase().indexOf(word) !== -1) return articles[i];
  }
  return null;
}

check('fourth-note-written', 'Четвёртая заметка написана', function (t) {
  var note = noteAbout(t, 'ленивый курсор');
  t.assert(
    note,
    'Заметки про кофейню «Ленивый курсор» на полосе нет. Её нужно написать целиком: описание лежит в комментарии внутри index.html, а разметку подсмотри у трёх соседних заметок.',
  );
  t.assert(
    note.querySelector('h1, h2, h3, h4, h5, h6'),
    'У новой заметки нет заголовка. Унесённая в чужую ленту заметка начинается с него — иначе непонятно, что это.',
  );
  t.assert(
    note.tagName.toLowerCase() === 'article',
    'Заметка про кофейню написана тегом <' +
      note.tagName.toLowerCase() +
      '>. Она такая же самостоятельная, как три соседние: её тег — <article>.',
  );
  return 'Заметка про кофейню на месте';
});

check('fourth-note-details', 'В новой заметке есть дата, текст и подпись', function (t) {
  var note = noteAbout(t, 'ленивый курсор');
  if (!note) return t.skip('Сначала напиши саму заметку');

  var text = t.text(note).toLowerCase();
  t.assert(
    text.indexOf('20 август') !== -1,
    'В заметке нет даты. Редакция дала её: 20 августа — без даты новость в ленте не отличить от прошлогодней.',
  );
  t.assert(
    text.indexOf('ремизов') !== -1,
    'В заметке нет подписи автора. Заметку написал Пётр Ремизов — уедет заметка в чужую ленту, уедет и он.',
  );
  t.assert(
    note.querySelectorAll('p').length >= 2,
    'Абзацев в заметке: ' +
      note.querySelectorAll('p').length +
      '. Кроме даты и подписи нужен сам текст новости — иначе читать нечего.',
  );
  return 'Дата, текст и подпись на месте';
});
