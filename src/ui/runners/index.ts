import type { CheckResult, ResolvedTask } from '../../core/types';

/**
 * Раннер — то, чем ученик решает задание: редактор кода, сборка блоков мышкой
 * или чтение чужого кода. Всё остальное (бриф, подсказки, превью, проверка,
 * прогресс, файлы, нейросеть) общее для всех типов заданий.
 */
export interface RunnerContext {
  task: ResolvedTask;
  getFiles: () => Record<string, string>;
  setFile: (name: string, content: string) => void;
  requestPreview: () => void;
}

export interface Runner {
  element: HTMLElement;
  /** Перечитать файлы после внешней замены (сброс, импорт, ответ нейросети). */
  reload: () => void;
  /** Проверки, которые считаются вне песочницы (например, ответы на вопросы). */
  localChecks?: () => CheckResult[];
  destroy?: () => void;
}
