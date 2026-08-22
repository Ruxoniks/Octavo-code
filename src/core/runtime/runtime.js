/*
 * Рантайм песочницы Octavo-code.
 *
 * Этот файл исполняется ВНУТРИ iframe с sandbox="allow-scripts" (без
 * allow-same-origin), то есть в отдельном origin. Родительская страница
 * физически не может читать DOM песочницы — значит и проверки должны
 * выполняться здесь, а наверх уходить только результат.
 *
 * Написан на обычном JS без импортов специально: он подставляется в srcdoc
 * как текст, и ровно тот же текст исполняется в тестах (happy-dom),
 * поэтому проверки в CI и в браузере ведут себя одинаково.
 */
(function (global) {
  'use strict';

  var doc = global.document;

  /*
   * Всё, что скрипт ученика напечатал в консоль, складываем сюда: проверкам
   * в заданиях про JavaScript нужно смотреть на вывод, а не на текст кода.
   * Рантайм подставляется в <head> раньше пользовательских скриптов, поэтому
   * к моменту проверки здесь уже лежит всё, что успело напечататься.
   */
  var consoleLog = [];

  // ---------- мост с родителем ----------

  function send(message) {
    if (global.parent && global.parent !== global) {
      global.parent.postMessage(message, '*');
    }
  }

  function stringifyArg(value) {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.name + ': ' + value.message;
    try {
      return JSON.stringify(value);
    } catch (err) {
      return String(value);
    }
  }

  ['log', 'info', 'warn', 'error'].forEach(function (level) {
    if (!global.console) return;
    var original = global.console[level];
    global.console[level] = function () {
      var args = Array.prototype.slice.call(arguments).map(stringifyArg);
      var text = args.join(' ');
      consoleLog.push({ level: level, text: text });
      send({ type: 'octavo:console', level: level, text: text });
      if (original) original.apply(global.console, arguments);
    };
  });

  global.addEventListener('error', function (event) {
    send({
      type: 'octavo:console',
      level: 'error',
      text: event.message + (event.lineno ? ' (строка ' + event.lineno + ')' : ''),
    });
  });

  global.addEventListener('unhandledrejection', function (event) {
    send({
      type: 'octavo:console',
      level: 'error',
      text: 'Необработанная ошибка: ' + stringifyArg(event.reason),
    });
  });

  // ---------- ссылки наружу ----------

  /*
   * Превью — это окошко внутри игры. Обычная ссылка заменила бы в нём
   * страницу ученика, и он решил бы, что сломал свой код. Поэтому внешние
   * ссылки без target мы открываем в новой вкладке сами и объясняем, что
   * произошло. Ссылку с target="_blank" не трогаем: там вкладку открывает
   * сам браузер, и это заслуга атрибута, который написал ученик.
   */
  doc.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;

    var href = link.getAttribute('href') || '';
    if (!/^https?:\/\//i.test(href)) return;
    if ((link.getAttribute('target') || '') === '_blank') return;

    event.preventDefault();
    global.open(href, '_blank', 'noopener');
    send({
      type: 'octavo:console',
      level: 'info',
      text:
        'Ссылка открыта в новой вкладке. У этой ссылки нет target="_blank", ' +
        'поэтому на настоящем сайте она заменила бы страницу, а здесь заменила бы превью.',
    });
  });

  // ---------- вспомогательные функции для проверок ----------

  function CheckFailure(message) {
    this.name = 'CheckFailure';
    this.message = message;
  }
  CheckFailure.prototype = Object.create(Error.prototype);

  function normalize(text) {
    return String(text == null ? '' : text)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function rectOf(target) {
    // Селектор принимается наравне с элементом: t.rect('.card') раньше молча
    // возвращал нули, и проверка сравнивала ноль с нулём.
    var el = typeof target === 'string' ? doc.querySelector(target) : target;
    if (!el || typeof el.getBoundingClientRect !== 'function') {
      return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
    }
    var r = el.getBoundingClientRect();
    return {
      top: r.top,
      left: r.left,
      right: r.right,
      bottom: r.bottom,
      width: r.width,
      height: r.height,
    };
  }

  function plural(n, one, few, many) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
  }

  /** Ступеньки, отсортированные снизу вверх — база всей механики маскота. */
  function ladderSteps(selector) {
    var nodes = Array.prototype.slice.call(doc.querySelectorAll(selector || '.step'));
    return nodes
      .map(function (el, index) {
        return { el: el, index: index, rect: rectOf(el) };
      })
      .sort(function (a, b) {
        return b.rect.top - a.rect.top;
      });
  }

  /**
   * Может ли курсор подняться по ступенькам?
   * Возвращает человеческое объяснение, а не просто false: ошибка должна
   * объясняться физикой, а не словом «неверно».
   */
  function canClimb(options) {
    var opts = options || {};
    var maxRise = opts.maxRise || 90;
    var maxGap = opts.maxGap || 140;
    var steps = ladderSteps(opts.target);

    if (steps.length < 2) {
      return {
        ok: false,
        message: 'Ступенек меньше двух — курсору не по чему подниматься.',
        reached: steps.length,
      };
    }

    var hasGeometry = steps.some(function (s) {
      return s.rect.width > 0 || s.rect.height > 0;
    });
    if (!hasGeometry) {
      return {
        ok: true,
        message: 'Геометрия недоступна в этой среде — проверка пропущена.',
        reached: steps.length,
        skipped: true,
      };
    }

    for (var i = 1; i < steps.length; i++) {
      var from = steps[i - 1].rect;
      var to = steps[i].rect;
      var rise = from.top - to.top;
      if (rise <= 0) {
        return {
          ok: false,
          message: 'Ступенька №' + (i + 1) + ' не выше предыдущей — лесенка не поднимается вверх.',
          reached: i,
        };
      }
      if (rise > maxRise) {
        return {
          ok: false,
          message:
            'Курсор поднялся на ' +
            i +
            ' ' +
            plural(i, 'ступеньку', 'ступеньки', 'ступенек') +
            ' и застрял: следующая на ' +
            Math.round(rise) +
            'px выше, а дотягивается он на ' +
            maxRise +
            'px.',
          reached: i,
        };
      }
      var gap = to.left - from.right;
      if (gap > maxGap) {
        return {
          ok: false,
          message:
            'Между ступенькой №' +
            i +
            ' и №' +
            (i + 1) +
            ' разрыв ' +
            Math.round(gap) +
            'px — курсор не дотягивается (максимум ' +
            maxGap +
            'px).',
          reached: i,
        };
      }
    }

    return {
      ok: true,
      message:
        'Курсор добрался до верха: ' +
        steps.length +
        ' ' +
        plural(steps.length, 'ступенька', 'ступеньки', 'ступенек') +
        '.',
      reached: steps.length,
    };
  }

  // ---------- линейка композиции ----------

  /*
   * Помощники для заданий про раскладку. Всё, что меряет расстояния, работает
   * только в настоящем браузере: вне его getBoundingClientRect отдаёт нули,
   * а Range.getClientRects — пустой список. Поэтому проверки, которые сюда
   * ходят, объявляются через check.browser, а available() честно об этом говорит.
   */

  function layoutAvailable() {
    var body = doc.body;
    if (!body || typeof body.getBoundingClientRect !== 'function') return false;
    var r = body.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  }

  /**
   * Строчные боксы текста — по одному на каждую отрисованную строку.
   * Range отдаёт прямоугольник на каждый кусок инлайна, а не на строку,
   * поэтому куски, стоящие на одной высоте, склеиваются в одну строку.
   */
  function lineBoxes(target) {
    var el = typeof target === 'string' ? doc.querySelector(target) : target;
    if (!el || typeof doc.createRange !== 'function') return [];

    var range = doc.createRange();
    try {
      range.selectNodeContents(el);
    } catch (err) {
      return [];
    }

    var raw = typeof range.getClientRects === 'function' ? range.getClientRects() : [];
    var rows = [];

    for (var i = 0; i < raw.length; i++) {
      var r = raw[i];
      if (!(r.width > 0.5 && r.height > 0)) continue;

      var key = Math.round(r.top / 2);
      var row = null;
      for (var j = 0; j < rows.length; j++) {
        if (rows[j].key === key) row = rows[j];
      }

      if (row) {
        row.left = Math.min(row.left, r.left);
        row.right = Math.max(row.right, r.right);
        row.top = Math.min(row.top, r.top);
      } else {
        rows.push({ key: key, top: r.top, left: r.left, right: r.right, height: r.height });
      }
    }

    return rows
      .sort(function (a, b) {
        return a.top - b.top;
      })
      .map(function (row) {
        return {
          top: row.top,
          left: row.left,
          right: row.right,
          width: row.right - row.left,
          height: row.height,
        };
      });
  }

  function nodesOf(selector) {
    return Array.prototype.slice.call(doc.querySelectorAll(selector));
  }

  /** Видимый левый край: начало первой строки текста, а у картинки — край самой картинки. */
  function leftEdges(selector) {
    return nodesOf(selector).map(function (el) {
      var lines = lineBoxes(el);
      return lines.length ? lines[0].left : rectOf(el).left;
    });
  }

  function spread(numbers) {
    if (!numbers || !numbers.length) return 0;
    var min = numbers[0];
    var max = numbers[0];
    for (var i = 1; i < numbers.length; i++) {
      if (numbers[i] < min) min = numbers[i];
      if (numbers[i] > max) max = numbers[i];
    }
    return max - min;
  }

  /**
   * Путь читающего глаза: точка в начале каждой строки, в порядке разметки.
   * Горизонтальные скачки между точками и есть цена композиции — у текста,
   * выровненного по левому краю, они равны нулю.
   */
  function gazePath(selector) {
    var points = [];

    nodesOf(selector).forEach(function (el) {
      var lines = lineBoxes(el);
      if (lines.length) {
        lines.forEach(function (line) {
          points.push({ x: line.left, y: line.top, el: el });
        });
        return;
      }
      var r = rectOf(el);
      if (r.width > 0 || r.height > 0) points.push({ x: r.left, y: r.top, el: el });
    });

    var jumps = [];
    var total = 0;
    var max = 0;

    for (var i = 1; i < points.length; i++) {
      var jump = Math.abs(points[i].x - points[i - 1].x);
      jumps.push(jump);
      total += jump;
      if (jump > max) max = jump;
    }

    return {
      points: points,
      jumps: jumps,
      maxJump: max,
      meanJump: jumps.length ? total / jumps.length : 0,
    };
  }

  /** Какую долю площади контейнера занимает элемент. */
  function areaShare(target, container) {
    var inner = rectOf(target);
    var outer = rectOf(container);
    var area = outer.width * outer.height;
    if (!area) return 0;
    return (inner.width * inner.height) / area;
  }

  /** Во сколько раз кегль одного элемента крупнее другого. */
  function fontScale(bigger, smaller) {
    var big = parseFloat(helpers.style(bigger, 'font-size'));
    var small = parseFloat(helpers.style(smaller, 'font-size'));
    if (!big || !small) return 0;
    return big / small;
  }

  /**
   * Межстрочный интервал числом, без единиц.
   * Браузер отдаёт line-height в пикселях, тестовая среда — как написано,
   * поэтому перед сравнением всё приводится к отношению к кеглю.
   */
  function lineHeightRatio(target) {
    var raw = helpers.style(target, 'line-height');
    if (!raw || raw === 'normal') return null;
    var size = parseFloat(helpers.style(target, 'font-size')) || 16;
    var value = parseFloat(raw);
    if (!value) return null;
    return /px$/.test(raw) ? value / size : value;
  }

  /**
   * Сколько колонок в grid-template-columns.
   * Браузер раскладывает значение в пиксели («212px 212px 212px»), тестовая
   * среда оставляет как написано («repeat(3, 1fr)») — понимаем обе формы.
   */
  function columnCount(value) {
    var text = String(value || '').trim();
    if (!text || text === 'none') return 0;

    var repeated = text.match(/^repeat\(\s*(\d+)\s*,/);
    if (repeated) return parseInt(repeated[1], 10);

    return text.split(/\s+(?![^(]*\))/).filter(Boolean).length;
  }

  var helpers = {
    $: function (selector) {
      return doc.querySelector(selector);
    },
    /** Всё, что скрипт напечатал в консоль: [{ level, text }, …]. */
    logs: function (level) {
      return consoleLog.filter(function (entry) {
        return !level || entry.level === level;
      });
    },
    /** Тот же вывод одной строкой — так удобнее искать в нём подстроку. */
    output: function (level) {
      return helpers
        .logs(level)
        .map(function (entry) {
          return entry.text;
        })
        .join('\n');
    },
    $$: function (selector) {
      return Array.prototype.slice.call(doc.querySelectorAll(selector));
    },
    text: function (target) {
      var el = typeof target === 'string' ? doc.querySelector(target) : target;
      return normalize(el && el.textContent);
    },
    attr: function (target, name) {
      var el = typeof target === 'string' ? doc.querySelector(target) : target;
      return el ? el.getAttribute(name) : null;
    },
    style: function (target, prop) {
      var el = typeof target === 'string' ? doc.querySelector(target) : target;
      if (!el || !global.getComputedStyle) return '';
      return String(global.getComputedStyle(el).getPropertyValue(prop) || '').trim();
    },
    /**
     * Проверка вычисленного стиля. Если среда стили не считает (например,
     * прогон контента в тестах), проверка не падает, а честно сообщает,
     * что была пропущена.
     */
    expectStyle: function (target, prop, matcher, message) {
      var value = helpers.style(target, prop);
      if (!value) return helpers.skip('Свойство ' + prop + ' не вычисляется в этой среде');
      var ok = typeof matcher === 'function' ? matcher(value) : String(matcher) === value;
      if (!ok) throw new CheckFailure(message + ' (сейчас: ' + prop + ': ' + value + ')');
      return prop + ': ' + value;
    },
    /** '#1a7f37' или 'rgb(26, 127, 55)' → [26,127,55] */
    parseColor: function (value) {
      var text = String(value || '').trim();
      var hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (hex) {
        var digits = hex[1];
        if (digits.length === 3) {
          digits = digits[0] + digits[0] + digits[1] + digits[1] + digits[2] + digits[2];
        }
        return [
          parseInt(digits.slice(0, 2), 16),
          parseInt(digits.slice(2, 4), 16),
          parseInt(digits.slice(4, 6), 16),
        ];
      }
      var rgb = text.match(/rgba?\(([^)]+)\)/i);
      if (rgb) {
        var parts = rgb[1].split(',').map(function (n) {
          return parseInt(n, 10);
        });
        return [parts[0], parts[1], parts[2]];
      }
      return null;
    },
    rect: rectOf,
    html: function () {
      return doc.documentElement.outerHTML;
    },
    normalize: normalize,
    plural: plural,
    assert: function (condition, message) {
      if (!condition) throw new CheckFailure(message || 'Проверка не прошла');
    },
    /** Проверка неприменима в текущей среде — засчитываем, но помечаем как пропущенную. */
    skip: function (message) {
      return { skipped: true, message: message || 'Проверка пропущена' };
    },
    fail: function (message) {
      throw new CheckFailure(message);
    },
    count: function (selector) {
      return doc.querySelectorAll(selector).length;
    },
    mascot: { canClimb: canClimb, steps: ladderSteps },
    layout: {
      available: layoutAvailable,
      rects: function (selector) {
        return nodesOf(selector).map(rectOf);
      },
      lines: lineBoxes,
      leftEdges: leftEdges,
      spread: spread,
      gaze: gazePath,
      areaShare: areaShare,
      fontScale: fontScale,
      lineHeight: lineHeightRatio,
      columnCount: columnCount,
    },
  };

  // ---------- запуск проверок ----------

  function runChecks(source, options) {
    var opts = options || {};
    var registry = [];

    function check(id, title, fn, checkOptions) {
      registry.push({ id: id, title: title, fn: fn, options: checkOptions || {} });
    }
    /** Проверка, которой нужен настоящий браузер (геометрия, вычисленные стили). */
    check.browser = function (id, title, fn) {
      registry.push({ id: id, title: title, fn: fn, options: { browserOnly: true } });
    };

    try {
      var factory = new Function('check', 't', 'helpers', source);
      factory(check, helpers, helpers);
    } catch (err) {
      return {
        ok: false,
        results: [],
        error: 'Ошибка в файле проверок: ' + (err && err.message ? err.message : String(err)),
      };
    }

    var results = registry.map(function (item) {
      if (item.options.browserOnly && opts.skipBrowserOnly) {
        return {
          id: item.id,
          title: item.title,
          ok: true,
          skipped: true,
          message: 'Пропущено вне браузера',
          browserOnly: true,
        };
      }
      try {
        var value = item.fn(helpers);
        var skipped = !!(value && typeof value === 'object' && value.skipped);
        var message = skipped ? value.message : typeof value === 'string' ? value : 'Готово';
        return {
          id: item.id,
          title: item.title,
          ok: true,
          skipped: skipped,
          message: message,
          browserOnly: !!item.options.browserOnly,
        };
      } catch (err) {
        var text = err && err.message ? err.message : String(err);
        if (!(err instanceof CheckFailure) && (!err || err.name !== 'CheckFailure')) {
          text = 'Код упал с ошибкой: ' + text;
        }
        return {
          id: item.id,
          title: item.title,
          ok: false,
          message: text,
          browserOnly: !!item.options.browserOnly,
        };
      }
    });

    return {
      ok:
        results.length > 0 &&
        results.every(function (r) {
          return r.ok;
        }),
      results: results,
    };
  }

  // ---------- маскот: курсор ----------

  var MASCOT_ID = '__octavo-mascot';
  var CURSOR_SVG =
    '<svg viewBox="0 0 28 34" width="28" height="34" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M5 2.5 L5 27.5 L11.6 21.2 L15.7 30.4 L20.2 28.3 L16.2 19.4 L24 19.4 Z" ' +
    'fill="#5f3f54" stroke="#fff9e4" stroke-width="2" stroke-linejoin="round" /></svg>';

  function ensureMascot() {
    var existing = doc.getElementById(MASCOT_ID);
    if (existing) return existing;
    var el = doc.createElement('div');
    el.id = MASCOT_ID;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = CURSOR_SVG;
    el.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'width:28px',
      'height:34px',
      'z-index:2147483000',
      'line-height:0',
      'pointer-events:none',
      'filter:drop-shadow(0 3px 6px rgba(61,40,55,.35))',
      'transition:transform .34s cubic-bezier(.34,1.4,.64,1)',
      'will-change:transform',
    ].join(';');
    doc.body.appendChild(el);
    return el;
  }

  function moveTo(el, x, y) {
    el.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
  }

  /** Короткая «волна» на цели — курсор по ней кликнул. */
  function clickEffect(target) {
    if (!target || !target.style) return;
    var previous = target.style.boxShadow;
    target.style.transition = 'box-shadow .2s ease';
    target.style.boxShadow = '0 0 0 6px rgba(95, 63, 84, 0.35)';
    global.setTimeout(function () {
      target.style.boxShadow = previous;
    }, 420);
  }

  var activeTimer = null;

  function playMascot(config) {
    var cfg = config || {};
    if (cfg.mode === 'off' || !doc.body) return;
    if (typeof global.requestAnimationFrame !== 'function') return;
    if (activeTimer) clearInterval(activeTimer);

    var width = 28;
    var height = 34;
    var speed = cfg.speed || 1;
    var viewportH = global.innerHeight || 400;
    var viewportW = global.innerWidth || 300;

    /*
     * Путь взгляда. Идём по строкам в порядке разметки — так, как читает
     * человек, — а не снизу вверх, как по лесенке. На выровненном по левому
     * краю тексте курсор падает ровно вниз, на центрированном мечется.
     *
     * Точки считаются до того, как появится курсор: если считать нечего
     * (нет геометрии или не нашлось текста), лучше не показывать стрелку
     * в углу превью вообще.
     */
    if (cfg.mode === 'gaze') {
      var path = gazePath(cfg.target || 'h1, h2, h3, p, li, blockquote, a, button, img');
      if (path.points.length < 2) return;

      var reader = ensureMascot();
      var point = 0;
      moveTo(reader, path.points[0].x - 6, path.points[0].y - 4);

      activeTimer = setInterval(function () {
        point++;
        if (point >= path.points.length) {
          clearInterval(activeTimer);
          activeTimer = null;
          send({ type: 'octavo:mascot-finished' });
          return;
        }
        moveTo(reader, path.points[point].x - 6, path.points[point].y - 4);
      }, 300 / speed);
      return;
    }

    var el = ensureMascot();
    var steps = ladderSteps(cfg.target);

    if (cfg.mode === 'walk' || steps.length === 0) {
      var groundY = viewportH - height - 8;
      var x = 8;
      moveTo(el, x, groundY);
      activeTimer = setInterval(function () {
        x += 26;
        if (x > viewportW - width) {
          clearInterval(activeTimer);
          activeTimer = null;
          return;
        }
        moveTo(el, x, groundY);
      }, 360 / speed);
      return;
    }

    // Стартуем от земли под самой нижней ступенькой и поднимаемся вверх.
    var lowest = steps[0].rect;
    moveTo(el, lowest.left + 4, viewportH - height - 4);

    var i = 0;
    activeTimer = setInterval(function () {
      if (i >= steps.length) {
        clearInterval(activeTimer);
        activeTimer = null;

        // Наверху курсора ждёт цель — он до неё дотягивается и жмёт.
        var goal = cfg.goal ? doc.querySelector(cfg.goal) : null;
        if (goal) {
          var g = rectOf(goal);
          moveTo(el, g.left + g.width / 2 - 4, g.top + g.height / 2 - 4);
          global.setTimeout(function () {
            clickEffect(goal);
          }, 360);
        }

        send({ type: 'octavo:mascot-finished' });
        return;
      }
      var r = steps[i].rect;
      moveTo(el, r.left + Math.max(0, (r.width - width) / 2), r.top - height + 6);
      i++;
    }, 400 / speed);
  }

  // ---------- приём сообщений от родителя ----------

  global.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'octavo:run-checks') {
      // Маскота отсюда не запускаем: решение о запуске принимает родитель,
      // который один знает итог целиком — вместе с проверками, считающимися
      // вне песочницы, и с критериями заказчика. Иначе он играл бы дважды.
      send({ type: 'octavo:results', runId: data.runId, outcome: runChecks(data.source, {}) });
      return;
    }

    if (data.type === 'octavo:play-mascot') {
      playMascot(data.mascot);
    }
  });

  global.__octavo = { runChecks: runChecks, playMascot: playMascot, helpers: helpers };

  /*
   * О готовности сообщаем не сразу. Этот скрипт стоит в <head> и выполняется
   * раньше, чем разобрано тело документа: если ответить «готов» отсюда,
   * родитель тут же пришлёт проверки, и они измерят страницу, которой ещё
   * нет — все координаты выйдут нулевыми. Поэтому ждём разбора документа
   * и одного кадра отрисовки, после которого раскладка уже посчитана.
   */
  function announceReady() {
    // Именно setTimeout, а не requestAnimationFrame: кадры не рисуются, когда
    // вкладка в фоне, и тогда сигнал не ушёл бы никогда. Один тик очереди
    // задач достаточен — getBoundingClientRect всё равно считает раскладку
    // синхронно, ему нужен только разобранный документ.
    global.setTimeout(function () {
      send({ type: 'octavo:ready' });
    }, 0);
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', announceReady);
  } else {
    announceReady();
  }
})(typeof window !== 'undefined' ? window : this);
