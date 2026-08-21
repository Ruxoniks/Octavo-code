import { tasks } from '../core/registry';
import { getState, isDone, setSetting } from '../core/progress';
import { navigate } from '../core/router';
import { t } from '../core/i18n';
import { cursorSvg } from './mascot';
import { append, clear, el } from './dom';

/** Оболочка приложения: верхняя панель с навигацией и прогрессом. */

export interface ShellOptions {
  /** Показать кнопку возврата к карте: мы внутри задания. */
  back?: boolean;
  /** Название задания рядом с кнопкой — чтобы шапка отвечала «где я». */
  title?: string;
}

export function applyTheme(): void {
  document.documentElement.dataset.theme = getState().settings.theme ?? 'light';
}

export function toggleTheme(): void {
  const next = (getState().settings.theme ?? 'light') === 'light' ? 'dark' : 'light';
  setSetting('theme', next);
  applyTheme();
}

/**
 * Кнопка темы обновляет себя сама: перерисовывать всю оболочку нельзя,
 * иначе задание потеряет введённый код.
 */
function themeButton(initiallyDark: boolean): HTMLElement {
  const label = (dark: boolean): string => (dark ? t('nav.themeLight') : t('nav.themeDark'));

  const button = el('button', {
    class: 'ghost',
    text: initiallyDark ? '☀' : '☾',
    title: label(initiallyDark),
    attrs: { 'aria-label': label(initiallyDark) },
  });

  button.addEventListener('click', () => {
    toggleTheme();
    const dark = (getState().settings.theme ?? 'light') === 'dark';
    button.textContent = dark ? '☀' : '☾';
    button.title = label(dark);
    button.setAttribute('aria-label', label(dark));
  });

  return button;
}

function topbar(options: ShellOptions): HTMLElement {
  const done = tasks.filter((task) => isDone(task.manifest.id)).length;
  const total = tasks.length || 1;
  const percent = Math.round((done / total) * 100);
  const dark = (getState().settings.theme ?? 'light') === 'dark';

  const bar = el(
    'header',
    { class: 'topbar' },
    el(
      'a',
      { class: 'topbar__logo', href: '#/' },
      el('span', { html: cursorSvg({ size: 18, className: 'mascot-mark' }), style: 'color:var(--plum)' }),
      el('span', {}, 'Octavo', el('span', { class: 'accent', text: '-code' })),
    ),
  );

  if (options.back) {
    append(bar, [
      el('span', { class: 'topbar__divider' }),
      el('button', {
        class: 'topbar__back',
        text: '← ' + t('task.back'),
        on: { click: () => navigate('/') },
      }),
      options.title ? el('span', { class: 'topbar__task', text: options.title }) : null,
    ]);
  }

  append(bar, [
    el('span', { class: 'topbar__spacer' }),
    el(
      'div',
      { class: 'topbar__progress' },
      el('span', { text: t('nav.progress', { done, total: tasks.length }) }),
      el('div', { class: 'progressbar' }, el('div', { class: 'progressbar__fill', style: `width:${percent}%` })),
    ),
    themeButton(dark),
    el('button', {
      class: 'ghost',
      text: t('nav.settings'),
      on: { click: () => navigate('/settings') },
    }),
  ]);

  return bar;
}

export function mount(root: HTMLElement, screen: HTMLElement, options: ShellOptions = {}): void {
  clear(root);
  root.appendChild(el('div', { class: 'app' }, topbar(options), screen));
}
