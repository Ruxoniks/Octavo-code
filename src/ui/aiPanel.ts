import { askClaude, buildPrompt, parseAiResponse } from '../core/ai';
import { globalConfig } from '../core/registry';
import { getState, setSetting } from '../core/progress';
import type { ResolvedTask } from '../core/types';
import { t } from '../core/i18n';
import { el, modal } from './dom';
import { showDiffModal } from './filesPanel';
import { openPromptLibrary } from './promptsView';

/**
 * Панель работы с нейросетью.
 *
 * Промпт показывается целиком и его можно править: цель — научить ставить
 * задачу словами, а не нажимать волшебную кнопку. Ответ разбирается на файлы,
 * и прежде чем что-то заменить, ученик видит дифф.
 */
export interface AiPanelOptions {
  task: ResolvedTask;
  getFiles: () => Record<string, string>;
  applyFiles: (files: Record<string, string>) => void;
  goal?: string;
}

export function openAiPanel(options: AiPanelOptions): void {
  const files = options.getFiles();
  const known = Object.keys(files);

  const promptArea = el('textarea', {
    class: 'ai__prompt',
    value: buildPrompt({ task: options.task, files, goal: options.goal }),
    rows: 12,
  });

  const copyButton = el('button', {
    class: 'primary',
    text: t('ai.copy'),
    on: {
      click: async () => {
        await navigator.clipboard.writeText(promptArea.value);
        copyButton.textContent = t('ai.copied');
        setTimeout(() => (copyButton.textContent = t('ai.copy')), 1800);
      },
    },
  });

  const libraryButton = el('button', {
    text: t('prompts.open'),
    title: t('prompts.openHint'),
    on: {
      click: () =>
        openPromptLibrary((prompt) => {
          // Промпт из архива дописывается к запросу, а не затирает его:
          // контекст задачи и файлы уже собраны выше.
          promptArea.value = `${promptArea.value.trim()}

${prompt.body}`;
          promptArea.focus();
          promptArea.scrollTop = promptArea.scrollHeight;
        }),
    },
  });

  const links = el(
    'div',
    { class: 'ai__links' },
    el('span', { class: 'muted', text: t('ai.openChat') }),
    ...globalConfig.ai.chatLinks.map((link) =>
      el('a', { href: link.url, target: '_blank', rel: 'noopener', text: link.label }),
    ),
  );

  const answerArea = el('textarea', {
    rows: 10,
    placeholder: t('ai.paste'),
  });

  const status = el('p', { class: 'tiny muted' });

  const parseButton = el('button', {
    text: t('ai.parse'),
    on: {
      click: () => {
        const blocks = parseAiResponse(answerArea.value, known);
        const allowed = options.task.manifest.ai?.targetFiles;
        const changed: Record<string, string> = {};

        for (const block of blocks) {
          if (allowed && !allowed.includes(block.file)) continue;
          if ((files[block.file] ?? '') !== block.content) changed[block.file] = block.content;
        }

        if (!Object.keys(changed).length) {
          status.textContent = blocks.length ? t('files.nothing') : t('ai.noBlocks');
          return;
        }

        status.textContent = '';
        showDiffModal(changed, options.getFiles(), (applied) => {
          options.applyFiles(applied);
          close();
        });
      },
    },
  });

  const body = el(
    'div',
    { class: 'ai' },
    el(
      'div',
      { class: 'ai__step' },
      el('h3', { text: t('ai.step1') }),
      promptArea,
      el('div', { class: 'ai__actions' }, copyButton, libraryButton),
      links,
    ),
    el('div', { class: 'ai__step' }, el('h3', { text: t('ai.step2') }), answerArea, parseButton, status),
    globalConfig.ai.byokEnabled ? byokSection(promptArea, answerArea) : null,
  );

  const close = modal(t('ai.title'), body, [
    el('button', { text: t('common.close'), on: { click: () => close() } }),
  ]);
}

/** Необязательный прямой вызов Claude с ключом самого ученика. */
function byokSection(promptArea: HTMLTextAreaElement, answerArea: HTMLTextAreaElement): HTMLElement {
  const keyInput = el('input', {
    type: 'password',
    placeholder: 'sk-ant-…',
    value: getState().settings.aiKey ?? '',
  }) as HTMLInputElement;

  const sendButton = el('button', {
    text: t('ai.send'),
    on: {
      click: async () => {
        const key = keyInput.value.trim();
        if (!key) return;
        setSetting('aiKey', key);
        sendButton.disabled = true;
        sendButton.textContent = t('ai.sending');
        try {
          answerArea.value = await askClaude(key, promptArea.value);
        } catch (error) {
          answerArea.value = `${t('common.error')}: ${(error as Error).message}`;
        } finally {
          sendButton.disabled = false;
          sendButton.textContent = t('ai.send');
        }
      },
    },
  }) as HTMLButtonElement;

  return el(
    'div',
    { class: 'ai__step' },
    el('h3', { text: t('ai.byok') }),
    el('p', { class: 'tiny muted', text: t('ai.byokHint') }),
    keyInput,
    el('div', { style: 'height:8px' }),
    sendButton,
  );
}
