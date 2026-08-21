import { chapters, getTask, globalConfig, tasks, tasksOfChapter } from '../core/registry';
import { isDone } from '../core/progress';
import { navigate } from '../core/router';
import { t } from '../core/i18n';
import type { ResolvedTask } from '../core/types';
import { cursorSvg } from './mascot';
import { el } from './dom';

/**
 * Карта глав.
 *
 * Ничего не заперто: любая глава открывается сразу. Поле requires в манифесте
 * осталось, но теперь это совет («удобнее после…»), а не замок — человек сам
 * решает, с чего начать.
 */

function typeLabel(manifest: ResolvedTask['manifest']): string {
  // Итог главы важнее типа: человек должен видеть, что это контрольная точка.
  if (manifest.tags?.includes('итог')) return 'итог главы';
  if (manifest.type === 'dnd') return 'блоки';
  if (manifest.type === 'read') return 'чтение кода';
  if (manifest.type === 'ai') return 'нейросеть';
  if (manifest.type === 'terminal') return 'терминал';
  return 'код';
}

function recommendedAfter(task: ResolvedTask): string | null {
  const unfinished = (task.manifest.requires ?? [])
    .filter((id) => !isDone(id))
    .map((id) => getTask(id)?.manifest.title)
    .filter((title): title is string => Boolean(title));

  return unfinished.length ? t('map.after', { title: unfinished.join(', ') }) : null;
}

function taskCard(task: ResolvedTask): HTMLElement {
  const done = isDone(task.manifest.id);
  const after = recommendedAfter(task);

  return el(
    'a',
    {
      class: `task-card${done ? ' task-card--done' : ''}`,
      href: `#/task/${task.manifest.id}`,
    },
    el(
      'div',
      { class: 'task-card__top' },
      el('span', { text: typeLabel(task.manifest) }),
      el('span', { style: 'flex:1' }),
      done ? el('span', { class: 'task-card__check', text: '✓' }) : null,
    ),
    el('div', { class: 'task-card__title', text: task.manifest.title }),
    el('div', { class: 'task-card__desc', text: task.manifest.summary }),
    after ? el('div', { class: 'task-card__after', text: after }) : null,
    el(
      'div',
      { class: 'task-card__foot' },
      el('span', { text: t('map.minutes', { n: task.manifest.estimateMin }) }),
      el(
        'span',
        { class: 'dots' },
        ...Array.from({ length: 5 }, (_unused, i) =>
          el('span', { class: `dot${i < task.manifest.difficulty ? ' dot--on' : ''}` }),
        ),
      ),
    ),
  );
}

/** Закреплённые ссылки: архив промптов и репозиторий проекта. */
function pinned(): HTMLElement {
  return el(
    'section',
    { class: 'pinned' },
    el(
      'a',
      { class: 'pinned-card', href: '#/prompts' },
      el('span', { class: 'pinned-card__mark', text: '❝' }),
      el(
        'span',
        {},
        el('span', { class: 'pinned-card__title', text: t('map.pinned.prompts') }),
        el('span', { class: 'pinned-card__text', text: t('map.pinned.promptsText') }),
      ),
    ),
    el(
      'a',
      {
        class: 'pinned-card',
        href: globalConfig.links.github,
        target: '_blank',
        rel: 'noopener',
      },
      el('span', { class: 'pinned-card__mark', text: '↗' }),
      el(
        'span',
        {},
        el('span', { class: 'pinned-card__title', text: t('map.pinned.github') }),
        el('span', { class: 'pinned-card__text', text: t('map.pinned.githubText') }),
      ),
    ),
  );
}

export function renderMap(): HTMLElement {
  const map = el(
    'div',
    { class: 'map' },
    el(
      'section',
      { class: 'hero' },
      el('span', {
        html: cursorSvg({ size: 96, className: 'hero__mascot' }),
        style: 'color:var(--plum);line-height:0',
      }),
      el(
        'div',
        {},
        el('h1', { text: t('map.intro.title') }),
        el('p', { text: t('map.intro.text') }),
      ),
    ),
    pinned(),
  );

  for (const chapter of chapters) {
    const chapterTasks = tasksOfChapter(chapter.id);
    const doneCount = chapterTasks.filter((task) => isDone(task.manifest.id)).length;

    map.appendChild(
      el(
        'section',
        { class: 'chapter' },
        el(
          'div',
          { class: 'chapter__head' },
          el('span', { class: 'chapter__num', text: String(chapter.order + 1).padStart(2, '0') }),
          el('h2', { text: chapter.title }),
          el('span', { class: 'chapter__count', text: `${doneCount} / ${chapterTasks.length}` }),
        ),
        el('p', { class: 'chapter__desc', text: chapter.description }),
        el('div', { class: 'tasks' }, ...chapterTasks.map(taskCard)),
      ),
    );
  }

  if (!tasks.length) {
    map.appendChild(el('p', { class: 'muted', text: t('map.empty') }));
  }

  map.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest('a.task-card, a.pinned-card') as HTMLAnchorElement | null;
    if (!link || !link.hash || link.target === '_blank') return;
    event.preventDefault();
    navigate(link.hash.replace('#', ''));
  });

  return el('div', { class: 'screen' }, map);
}
