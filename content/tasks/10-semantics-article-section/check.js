check('notes-are-articles', 'Заметки стали самостоятельными', function (t) {
  var articles = t.count('main article');
  t.assert(
    articles > 0,
    'Ни одной <article> на полосе нет. Заметку можно вырезать и показать в чужой ленте — она останется понятной. Это ровно то, про что тег <article>.',
  );
  t.assert(
    articles >= 3,
    'Заметок, обёрнутых в <article>: ' + articles + ', а на полосе их три. Проверь каждую.',
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
