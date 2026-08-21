import { describe, expect, it } from 'vitest';
import { Window } from 'happy-dom';
import { buildSrcDoc } from '../src/core/sandbox';
import { chapters, tasks } from '../src/core/registry';
import { parseBeats } from '../src/ui/briefBeats';
import { isKnownVoice } from '../src/ui/voices';
import type { CheckRun } from '../src/core/types';

/**
 * Главный тест проекта: для каждого задания эталонное решение обязано пройти
 * проверки, а стартовые файлы — не пройти. Это ловит и сломанный чекер,
 * и задание, которое «решается само», и опечатку в манифесте.
 *
 * Проверки исполняются тем же рантаймом, что и в браузере (runtime.js),
 * только внутри happy-dom. Проверки, помеченные check.browser (геометрия,
 * вычисленные стили), здесь пропускаются — им нужен настоящий движок.
 */
async function runChecksInDom(
  files: Record<string, string>,
  entry: string,
  checkSource: string,
): Promise<CheckRun> {
  const window = new Window({ url: 'https://octavo.local/' });
  const document = window.document;

  document.write(buildSrcDoc(files, entry));
  document.close();
  await window.happyDOM.waitUntilComplete();

  const runtime = (window as unknown as { __octavo?: { runChecks: (src: string, opts: unknown) => CheckRun } })
    .__octavo;

  if (!runtime) throw new Error('Рантайм песочницы не загрузился в тестовой среде');

  const outcome = runtime.runChecks(checkSource, { skipBrowserOnly: true });
  await window.happyDOM.close();
  return outcome;
}

function describeFailures(run: CheckRun): string {
  return [run.error, ...run.results.filter((r) => !r.ok).map((r) => `${r.id}: ${r.message}`)]
    .filter(Boolean)
    .join('\n');
}

describe('структура контента', () => {
  it('задания и главы согласованы', () => {
    expect(tasks.length).toBeGreaterThan(0);

    const ids = tasks.map((task) => task.manifest.id);
    expect(new Set(ids).size).toBe(ids.length);

    const chapterIds = new Set(chapters.map((chapter) => chapter.id));
    for (const task of tasks) {
      expect(chapterIds.has(task.manifest.chapter)).toBe(true);
      for (const required of task.manifest.requires ?? []) {
        expect(ids).toContain(required);
      }
    }
  });

  it('у каждого задания есть бриф, файлы и решение', () => {
    for (const task of tasks) {
      const id = task.manifest.id;
      expect(task.brief.length, `${id}: пустой brief.ru.md`).toBeGreaterThan(50);
      expect(Object.keys(task.files).length, `${id}: нет стартовых файлов`).toBeGreaterThan(0);
      expect(Object.keys(task.solution).length, `${id}: нет эталонного решения`).toBeGreaterThan(0);
      expect(task.files[task.preview.entry], `${id}: нет входного файла превью`).toBeTruthy();

      for (const file of task.editor.files) {
        expect(task.files[file], `${id}: файл ${file} указан в editor.files, но его нет`).toBeTruthy();
      }
      for (const file of task.editor.readonly ?? []) {
        expect(task.editor.files, `${id}: readonly-файл ${file} не открыт в редакторе`).toContain(file);
      }
    }
  });

  it('подсказки идут по уровням и не пустые', () => {
    for (const task of tasks) {
      const levels = task.hints.map((hint) => hint.level);
      expect(levels, `${task.manifest.id}: уровни подсказок должны идти по порядку`).toEqual(
        [...levels].sort((a, b) => a - b),
      );
      for (const hint of task.hints) {
        expect(hint.text.length, `${task.manifest.id}: пустая подсказка`).toBeGreaterThan(10);
      }
    }
  });

  it('бриф каждого задания разложен на реплики известных голосов', () => {
    for (const task of tasks) {
      const beats = parseBeats(task.brief);
      expect(beats.length, `${task.manifest.id}: бриф не разбит на реплики`).toBeGreaterThan(0);

      for (const beat of beats) {
        expect(isKnownVoice(beat.speaker), `${task.manifest.id}: неизвестный голос «${beat.speaker}»`).toBe(true);
      }
    }
  });

  it('вопросы ссылаются на существующие варианты ответа', () => {
    for (const task of tasks) {
      const questions = [...(task.manifest.read?.questions ?? []), ...(task.manifest.ai?.review ?? [])];
      for (const question of questions) {
        if (question.kind !== 'choice') continue;
        expect(question.options?.length, `${task.manifest.id}/${question.id}: нет вариантов`).toBeGreaterThan(1);
        expect(question.answer).toBeLessThan(question.options!.length);
      }
    }
  });
});

describe('проверки заданий', () => {
  const checkable = tasks.filter((task) => task.checkSource.trim().length > 0);

  for (const task of checkable) {
    const id = task.manifest.id;

    it(`${id}: эталонное решение проходит проверки`, async () => {
      const run = await runChecksInDom(
        { ...task.files, ...task.solution },
        task.preview.entry,
        task.checkSource,
      );
      expect(describeFailures(run)).toBe('');
      expect(run.ok).toBe(true);
    });

    it(`${id}: стартовые файлы проверки не проходят`, async () => {
      const run = await runChecksInDom(task.files, task.preview.entry, task.checkSource);
      const meaningful = run.results.filter((result) => !result.skipped);

      // Задания, целиком построенные на геометрии и вычисленных стилях, вне
      // браузера проверить нечем — там гарантию даёт ручной прогон и e2e.
      if (meaningful.length === 0) return;

      expect(
        meaningful.some((result) => !result.ok),
        'стартовый набор не должен проходить — иначе задание решается само',
      ).toBe(true);
    });
  }
});
