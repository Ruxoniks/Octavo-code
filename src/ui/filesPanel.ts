import { collapseDiff, diffLines, downloadText, downloadZip, hasChanges, readDrop } from '../core/files';
import { t } from '../core/i18n';
import { el, modal } from './dom';

/**
 * Работа с файлами глазами ученика: скачал проект, открыл в чём угодно,
 * поправил, перетащил обратно — и увидел построчно, что изменилось.
 */
export interface FilesPanelOptions {
  projectName: string;
  getFiles: () => Record<string, string>;
  getActiveFile: () => string;
  applyFiles: (files: Record<string, string>) => void;
}

export function renderDiff(filename: string, before: string, after: string): HTMLElement {
  const box = el('div', { class: 'diff' }, el('div', { class: 'diff__file', text: filename }));
  for (const line of collapseDiff(diffLines(before, after))) {
    const prefix = line.kind === 'add' ? '+ ' : line.kind === 'del' ? '- ' : '  ';
    box.appendChild(el('div', { class: `diff__line diff__line--${line.kind}`, text: prefix + line.text }));
  }
  return box;
}

export function createFilesPanel(options: FilesPanelOptions): HTMLElement {
  const dropzone = el('div', {
    class: 'dropzone',
    text: t('files.dropzone'),
  });

  const buttons = el(
    'div',
    { class: 'hints__actions' },
    el('button', {
      text: t('task.downloadFile'),
      on: {
        click: () => {
          const file = options.getActiveFile();
          downloadText(file, options.getFiles()[file] ?? '');
        },
      },
    }),
    el('button', {
      text: t('task.downloadZip'),
      on: { click: () => downloadZip(options.projectName, options.getFiles()) },
    }),
  );

  const stop = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  dropzone.addEventListener('dragover', (event) => {
    stop(event);
    dropzone.classList.add('is-over');
  });
  dropzone.addEventListener('dragleave', (event) => {
    stop(event);
    dropzone.classList.remove('is-over');
  });
  dropzone.addEventListener('drop', async (event) => {
    stop(event);
    dropzone.classList.remove('is-over');
    if (!event.dataTransfer) return;

    const incoming = await readDrop(event.dataTransfer);
    const current = options.getFiles();
    const changed: Record<string, string> = {};

    for (const [name, content] of Object.entries(incoming)) {
      if (!(name in current)) continue;
      if (current[name] !== content) changed[name] = content;
    }

    if (!Object.keys(changed).length) {
      dropzone.textContent = t('files.nothing');
      setTimeout(() => (dropzone.textContent = t('files.dropzone')), 2500);
      return;
    }

    showDiffModal(changed, current, options.applyFiles);
  });

  return el(
    'div',
    { class: 'files' },
    el('h3', { text: t('files.title') }),
    buttons,
    el('div', { style: 'height:8px' }),
    dropzone,
  );
}

export function showDiffModal(
  changed: Record<string, string>,
  current: Record<string, string>,
  apply: (files: Record<string, string>) => void,
): void {
  const body = el('div', {});
  for (const [name, content] of Object.entries(changed)) {
    const diff = diffLines(current[name] ?? '', content);
    if (!hasChanges(diff)) continue;
    body.appendChild(renderDiff(name, current[name] ?? '', content));
    body.appendChild(el('div', { style: 'height:12px' }));
  }

  const applyButton = el('button', { class: 'primary', text: t('files.apply') });
  const cancelButton = el('button', { text: t('files.cancel') });

  const close = modal(t('files.diffTitle'), body, [cancelButton, applyButton]);
  cancelButton.addEventListener('click', close);
  applyButton.addEventListener('click', () => {
    apply(changed);
    close();
  });
}
