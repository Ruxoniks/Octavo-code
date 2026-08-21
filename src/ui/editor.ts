import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { indentWithTab } from '@codemirror/commands';
import { paperEditorTheme } from './editorTheme';
import { t } from '../core/i18n';
import { el, clear } from './dom';

/** Редактор с вкладками файлов. Файлы «только для чтения» открываются, но не правятся. */
export interface FileEditorOptions {
  files: string[];
  readonly?: string[];
  active?: string;
  getContent: (file: string) => string;
  onChange: (file: string, content: string) => void;
}

function languageFor(file: string): Extension[] {
  if (file.endsWith('.html')) return [html()];
  if (file.endsWith('.css')) return [css()];
  if (file.endsWith('.js')) return [javascript()];
  return [];
}

export class FileEditor {
  readonly element: HTMLElement;
  private tabsBar: HTMLElement;
  private host: HTMLElement;
  private view: EditorView;
  private active: string;
  private options: FileEditorOptions;

  constructor(options: FileEditorOptions) {
    this.options = options;
    this.active = options.active ?? options.files[0];

    this.tabsBar = el('div', { class: 'editor__tabs', attrs: { role: 'tablist' } });
    this.host = el('div', { class: 'editor__host' });
    this.element = el('div', { class: 'editor' }, this.tabsBar, this.host);

    this.view = new EditorView({ parent: this.host, state: this.stateFor(this.active) });
    this.renderTabs();
  }

  private isReadonly(file: string): boolean {
    return (this.options.readonly ?? []).includes(file);
  }

  private stateFor(file: string): EditorState {
    const readonly = this.isReadonly(file);
    return EditorState.create({
      doc: this.options.getContent(file),
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        paperEditorTheme,
        ...languageFor(file),
        EditorState.readOnly.of(readonly),
        EditorView.editable.of(!readonly),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !this.isReadonly(this.active)) {
            this.options.onChange(this.active, update.state.doc.toString());
          }
        }),
      ],
    });
  }

  private renderTabs(): void {
    clear(this.tabsBar);
    for (const file of this.options.files) {
      const tab = el('button', {
        class: 'editor__tab',
        attrs: { role: 'tab', 'aria-selected': String(file === this.active) },
        title: this.isReadonly(file) ? t('task.readonly') : file,
        on: { click: () => this.open(file) },
      });
      tab.append(file);
      if (this.isReadonly(file)) tab.append(el('span', { class: 'lock', text: '🔒' }));
      this.tabsBar.appendChild(tab);
    }
  }

  open(file: string): void {
    if (!this.options.files.includes(file)) return;
    this.active = file;
    this.view.setState(this.stateFor(file));
    this.renderTabs();
  }

  /** Перечитать содержимое из внешнего источника (сброс, ответ нейросети, импорт файлов). */
  reload(): void {
    this.view.setState(this.stateFor(this.active));
  }

  focus(): void {
    this.view.focus();
  }

  destroy(): void {
    this.view.destroy();
  }
}
