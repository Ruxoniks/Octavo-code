import { FileEditor } from '../editor';
import { QuestionSet } from '../questions';
import { el } from '../dom';
import { t } from '../../core/i18n';
import type { CheckResult } from '../../core/types';
import type { Runner, RunnerContext } from './index';

/**
 * Обычное задание: редактор с вкладками файлов и живое превью.
 * Для заданий типа ai сюда же добавляются вопросы на разбор кода,
 * который принесла нейросеть.
 */
export function createCodeRunner(context: RunnerContext): Runner {
  const { task } = context;
  let timer: number | undefined;

  const editor = new FileEditor({
    files: task.editor.files,
    readonly: task.editor.readonly,
    active: task.editor.primary,
    getContent: (file) => context.getFiles()[file] ?? '',
    onChange: (file, content) => {
      context.setFile(file, content);
      if (task.preview.autorun) {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => context.requestPreview(), 450);
      }
    },
  });

  const review = task.manifest.ai?.review?.length ? new QuestionSet(task.manifest.ai.review) : null;

  const element = el(
    'div',
    { class: 'editor' },
    editor.element,
    review
      ? el(
          'div',
          { class: 'editor__aside' },
          el('header', { class: 'pane__header' }, t('ai.step3')),
          review.element,
        )
      : null,
  );

  return {
    element,
    reload: () => editor.reload(),
    localChecks: review ? (): CheckResult[] => review.results() : undefined,
    destroy: () => editor.destroy(),
  };
}
