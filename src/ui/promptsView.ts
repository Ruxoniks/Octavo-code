import { promptTags, searchPrompts, type Prompt } from '../core/prompts';
import { t } from '../core/i18n';
import { clear, el, modal } from './dom';

/**
 * Архив промптов.
 *
 * Один и тот же список работает в двух местах: как отдельный экран с карты
 * и как окно поверх панели «Спросить нейросеть» — там у промпта появляется
 * кнопка «Вставить в запрос».
 */
export interface PromptListOptions {
  onInsert?: (prompt: Prompt) => void;
}

function promptCard(prompt: Prompt, options: PromptListOptions): HTMLElement {
  const body = el('pre', { class: 'prompt__body', text: prompt.body, hidden: true });

  const copyButton = el('button', {
    class: 'primary',
    text: t('prompts.copy'),
    on: {
      click: async () => {
        await navigator.clipboard.writeText(prompt.body);
        copyButton.textContent = t('ai.copied');
        setTimeout(() => (copyButton.textContent = t('prompts.copy')), 1800);
      },
    },
  });

  const toggleButton = el('button', {
    class: 'ghost',
    text: t('prompts.show'),
    on: {
      click: () => {
        body.hidden = !body.hidden;
        toggleButton.textContent = body.hidden ? t('prompts.show') : t('prompts.hide');
      },
    },
  });

  return el(
    'article',
    { class: 'prompt' },
    el(
      'div',
      { class: 'prompt__head' },
      el('h3', { text: prompt.title }),
      el('div', { class: 'prompt__tags' }, ...prompt.tags.map((tag) => el('span', { class: 'chip', text: tag }))),
    ),
    prompt.summary ? el('p', { class: 'prompt__summary', text: prompt.summary }) : null,
    prompt.source ? el('p', { class: 'tiny muted', text: t('prompts.source', { source: prompt.source }) }) : null,
    el(
      'div',
      { class: 'prompt__actions' },
      copyButton,
      options.onInsert
        ? el('button', { text: t('prompts.insert'), on: { click: () => options.onInsert?.(prompt) } })
        : null,
      toggleButton,
    ),
    body,
  );
}

export function renderPromptList(options: PromptListOptions = {}): HTMLElement {
  let query = '';
  let activeTag: string | undefined;

  const list = el('div', { class: 'prompts__list' });
  const tagsBar = el('div', { class: 'prompts__tags' });

  const renderList = (): void => {
    clear(list);
    const found = searchPrompts(query, activeTag);

    if (!found.length) {
      list.appendChild(el('p', { class: 'muted', text: t('prompts.empty') }));
      return;
    }
    for (const prompt of found) list.appendChild(promptCard(prompt, options));
  };

  const renderTags = (): void => {
    clear(tagsBar);
    const tags = [undefined, ...promptTags()];

    for (const tag of tags) {
      tagsBar.appendChild(
        el('button', {
          class: `prompts__tag${tag === activeTag ? ' is-active' : ''}`,
          text: tag ?? t('prompts.allTags'),
          on: {
            click: () => {
              activeTag = tag;
              renderTags();
              renderList();
            },
          },
        }),
      );
    }
  };

  const search = el('input', {
    type: 'text',
    placeholder: t('prompts.search'),
    on: {
      input: (event: Event) => {
        query = (event.target as HTMLInputElement).value;
        renderList();
      },
    },
  });

  renderTags();
  renderList();

  return el('div', { class: 'prompts' }, search, tagsBar, list);
}

export function renderPromptsScreen(): HTMLElement {
  const page = el(
    'div',
    { class: 'map' },
    el('h1', { text: t('prompts.title') }),
    el('p', { class: 'muted', style: 'max-width:70ch', text: t('prompts.intro') }),
    renderPromptList(),
  );

  return el('div', { class: 'screen' }, page);
}

/** Тот же архив, но окном поверх панели работы с нейросетью. */
export function openPromptLibrary(onInsert: (prompt: Prompt) => void): void {
  const close = modal(
    t('prompts.title'),
    renderPromptList({
      onInsert: (prompt) => {
        onInsert(prompt);
        close();
      },
    }),
    [el('button', { text: t('common.close'), on: { click: () => close() } })],
  );
}
