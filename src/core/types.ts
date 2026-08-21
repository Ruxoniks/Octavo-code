/**
 * Общие типы Octavo-code.
 *
 * Ключевая идея структуры: каждое задание лежит в своей папке и описывается
 * манифестом, но все манифесты сливаются с глобальными параметрами из
 * content/global.json. Задание переопределяет только то, что ему нужно.
 */

export type TaskType = 'code' | 'dnd' | 'read' | 'ai' | 'terminal';

export interface HintDef {
  level: number;
  text: string;
}

export interface EditorConfig {
  /** Файлы, которые ученик видит во вкладках редактора. */
  files: string[];
  /** Файлы, доступные только для чтения (например, готовый CSS). */
  readonly?: string[];
  /** Файл, открытый первым. */
  primary?: string;
  tabSize?: number;
  wrap?: boolean;
}

export interface MascotConfig {
  /** ladder — курсор поднимается по ступенькам; walk — едет по земле; off — не показывать. */
  mode: 'ladder' | 'walk' | 'off';
  /** CSS-селектор ступенек. */
  target?: string;
  /** Максимальная высота прыжка в пикселях. */
  maxRise?: number;
  /** Максимальный горизонтальный разрыв между ступеньками. */
  maxGap?: number;
  /** Селектор цели наверху: курсор доедет до неё и кликнет. */
  goal?: string;
  /** Множитель скорости анимации, приходит из global.json. */
  speed?: number;
}

export interface PreviewConfig {
  /** HTML-файл, который рендерится в превью. */
  entry: string;
  /** Перезапускать превью автоматически при вводе. */
  autorun?: boolean;
  /** Таймаут выполнения проверок, мс. */
  timeoutMs?: number;
  mascot?: MascotConfig;
}

export interface HintsConfig {
  maxLevels?: number;
  /** Разрешено ли показывать эталонное решение. */
  allowSolution?: boolean;
}

/** Вариант компонента для заданий типа dnd. */
export interface DndOption {
  id: string;
  label: string;
  tag: string;
  description?: string;
}

export interface DndConfig {
  pool: DndOption[];
  /** Правильный порядок id сверху вниз. */
  correct: string[];
}

/** Вопрос для заданий типа read и для разбора ответа нейросети. */
export interface Question {
  id: string;
  prompt: string;
  /** line — выбрать строку в коде; choice — выбрать вариант ответа. */
  kind: 'line' | 'choice';
  options?: string[];
  /** Для kind=line — номер строки (с 1); для kind=choice — индекс варианта. */
  answer: number;
  explain: string;
}

export interface ReadConfig {
  file: string;
  questions: Question[];
}

export interface AiConfig {
  /** Что ученик должен получить от нейросети — попадает в промпт. */
  goal: string;
  /** Файлы, которые разрешено заменить ответом нейросети. */
  targetFiles: string[];
  /** Вопросы на разбор того, что принесла нейросеть. */
  review?: Question[];
  /** Дополнительные требования в промпт. */
  requirements?: string[];
}

/** Ожидаемая вставка вывода настоящей консоли ученика. */
export interface TerminalPasteRequest {
  command: string;
  label: string;
  /** Регулярка, которой должен соответствовать вывод. */
  pattern: string;
  hint?: string;
}

export interface TerminalConfig {
  /** Домашняя папка симулятора. */
  home?: string;
  /** Рабочая папка на старте, если она отличается от домашней. */
  cwd?: string;
  /** Что уже лежит на «диске» в начале задания. */
  files?: Record<string, { type: 'dir' | 'file'; content?: string }>;
  /** Состояние репозитория на старте: продолжаем с того места, где закончили. */
  git?: {
    initialized?: boolean;
    branch?: string;
    commits?: { message: string; files: string[] }[];
    remote?: string;
    pushed?: boolean;
    snapshot?: Record<string, string>;
  };
  paste?: TerminalPasteRequest[];
}

export interface TaskManifest {
  id: string;
  chapter: string;
  order: number;
  type: TaskType;
  title: string;
  summary: string;
  difficulty: number;
  estimateMin: number;
  requires?: string[];
  tags?: string[];
  editor?: Partial<EditorConfig>;
  preview?: Partial<PreviewConfig>;
  hints?: HintDef[];
  hintsConfig?: HintsConfig;
  dnd?: DndConfig;
  read?: ReadConfig;
  ai?: AiConfig;
  terminal?: TerminalConfig;
  /** Задание принадлежит заказчику из content/clients/<id>. */
  client?: string;
}

export interface GlobalConfig {
  editor: EditorConfig;
  preview: PreviewConfig;
  hints: HintsConfig;
  ai: {
    enabled: boolean;
    chatLinks: { label: string; url: string }[];
  };
  mascot: { speed: number };
  links: { github: string };
}

/** Манифест после слияния с глобальными параметрами. */
export interface ResolvedTask {
  manifest: TaskManifest;
  editor: EditorConfig;
  preview: PreviewConfig;
  hints: HintDef[];
  hintsConfig: Required<HintsConfig>;
  /** Стартовые файлы: путь → содержимое. */
  files: Record<string, string>;
  /** Эталонные файлы. */
  solution: Record<string, string>;
  /** Текст брифа (markdown). */
  brief: string;
  /** Исходник check.js — исполняется внутри песочницы. */
  checkSource: string;
}

export interface ChapterDef {
  id: string;
  title: string;
  description: string;
  order: number;
  /** Глава открывается, когда пройдены все задания перечисленных глав. */
  requires?: string[];
}

/** Результат одной проверки. */
export interface CheckResult {
  id: string;
  title: string;
  ok: boolean;
  message: string;
  /** Проверку невозможно выполнить вне настоящего браузера (геометрия, стили). */
  browserOnly?: boolean;
  /** Проверка не выполнялась в этой среде и засчитана автоматически. */
  skipped?: boolean;
}

export interface CheckRun {
  ok: boolean;
  results: CheckResult[];
  /** Ошибка выполнения самого кода ученика или чекера. */
  error?: string;
}

export interface TaskProgress {
  status: 'todo' | 'done';
  attempts: number;
  hintsUsed: number;
  solutionShown: boolean;
  completedAt?: string;
  /** Черновик файлов ученика. */
  draft?: Record<string, string>;
}

export interface ProgressState {
  version: 1;
  tasks: Record<string, TaskProgress>;
}

export interface ClientPersona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  /** Первое сообщение — ТЗ своими словами. */
  brief: string;
  /** Критерии приёмки: id совпадает с id проверки в check.js. */
  acceptance: { id: string; label: string }[];
  /** Правка, которую заказчик присылает после N попыток или после первого успеха. */
  revision?: {
    afterAttempts: number;
    message: string;
    /** Дополнительные критерии, включающиеся вместе с правкой. */
    acceptance: { id: string; label: string }[];
  };
}
