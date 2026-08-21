import { QuestionSet, renderCodeView } from '../questions';
import { el } from '../dom';
import { t } from '../../core/i18n';
import type { Runner, RunnerContext } from './index';

/**
 * Чтение чужого кода: найти строку с ошибкой, понять, что выведет скрипт.
 * Код здесь не редактируется — работает только голова.
 */
export function createReadRunner(context: RunnerContext): Runner {
  const config = context.task.manifest.read;
  if (!config) throw new Error('Задание типа read без блока read в манифесте');

  const questions = new QuestionSet(config.questions);
  const source = context.getFiles()[config.file] ?? '';

  const element = el(
    'div',
    { class: 'editor' },
    el('header', { class: 'pane__header' }, config.file),
    el(
      'div',
      { class: 'editor__host' },
      renderCodeView(source, (line) => questions.setLine(line)),
    ),
    el(
      'div',
      { class: 'editor__aside' },
      el('header', { class: 'pane__header' }, t('task.checks')),
      questions.element,
    ),
  );

  return {
    element,
    reload: () => {},
    localChecks: () => questions.results(),
  };
}
