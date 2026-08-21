import { exportProgress, getState, importProgress, resetProgress, setSetting } from '../core/progress';
import { downloadText } from '../core/files';
import { navigate } from '../core/router';
import { t } from '../core/i18n';
import { el } from './dom';
import { applyTheme } from './layout';

export function renderSettings(): HTMLElement {
  const fileInput = el('input', {
    type: 'file',
    accept: '.json',
    style: 'display:none',
    on: {
      change: async (event: Event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        try {
          importProgress(await file.text());
          navigate('/');
        } catch (error) {
          alert(`${t('common.error')}: ${(error as Error).message}`);
        }
      },
    },
  }) as HTMLInputElement;

  const themeButton = (theme: 'light' | 'dark', label: string): HTMLElement =>
    el('button', {
      class: (getState().settings.theme ?? 'light') === theme ? 'primary' : '',
      text: label,
      on: {
        click: () => {
          setSetting('theme', theme);
          applyTheme();
          navigate('/settings');
        },
      },
    });

  const map = el(
    'div',
    { class: 'map settings' },
    el('h1', { text: t('settings.title') }),

    el('h2', { text: t('settings.theme') }),
    el(
      'div',
      { class: 'hints__actions' },
      themeButton('light', t('settings.themeLight')),
      themeButton('dark', t('settings.themeDark')),
    ),

    el('h2', { text: t('settings.progress') }),
    el('p', {
      class: 'muted',
      text: 'Прогресс хранится только в этом браузере. Скачай файл, если хочешь перенести его на другой компьютер.',
    }),
    el(
      'div',
      { class: 'hints__actions' },
      el('button', {
        text: t('settings.export'),
        on: { click: () => downloadText('octavo-code-progress.json', exportProgress()) },
      }),
      el('button', { text: t('settings.import'), on: { click: () => fileInput.click() } }),
      el('button', {
        class: 'ghost',
        text: t('settings.reset'),
        on: {
          click: () => {
            if (!confirm(t('settings.resetConfirm'))) return;
            resetProgress();
            navigate('/');
          },
        },
      }),
      fileInput,
    ),

    el('h2', { text: t('settings.about') }),
    el('p', {
      class: 'muted',
      text: 'Octavo-code — открытый проект. Код под лицензией MIT, задания под CC BY-SA. Любое задание можно добавить папкой в content/tasks.',
    }),
  );

  return el('div', { class: 'screen' }, map);
}
