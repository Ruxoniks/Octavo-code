import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import type { Extension } from '@codemirror/state';

/**
 * Тема редактора под бумагу и сливу.
 *
 * Готовые тёмные темы здесь не годятся: редактор — часть страницы, а не
 * отдельное окно, и он должен читаться как продолжение листа бумаги.
 */
const paperTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--paper-raised)',
      color: 'var(--ink)',
    },
    '.cm-content': {
      caretColor: 'var(--plum)',
      padding: '12px 0',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--paper-sunk)',
      color: 'var(--faint)',
      border: 'none',
      borderRight: '1px solid var(--line)',
    },
    '.cm-activeLine': { backgroundColor: 'var(--plum-veil)' },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--plum-veil)',
      color: 'var(--plum)',
    },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--plum)', borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'var(--plum-veil-strong)',
    },
    '.cm-selectionMatch': { backgroundColor: 'var(--plum-veil-strong)' },
    '.cm-matchingBracket, .cm-nonmatchingBracket': {
      backgroundColor: 'var(--plum-veil-strong)',
      outline: 'none',
    },
    '.cm-tooltip': {
      backgroundColor: 'var(--paper-raised)',
      border: '1px solid var(--line-strong)',
      color: 'var(--ink)',
    },
    '.cm-tooltip-autocomplete ul li[aria-selected]': {
      backgroundColor: 'var(--plum)',
      color: 'var(--paper)',
    },
  },
  { dark: false },
);

// Цвета берутся из токенов: подсветка кода меняется вместе с темой.
const paperHighlight = HighlightStyle.define([
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--syn-comment)', fontStyle: 'italic' },
  { tag: [tags.keyword, tags.controlKeyword, tags.moduleKeyword], color: 'var(--syn-keyword)', fontWeight: '600' },
  { tag: [tags.tagName, tags.heading], color: 'var(--syn-tag)', fontWeight: '600' },
  { tag: [tags.attributeName, tags.propertyName], color: 'var(--syn-attr)' },
  { tag: [tags.string, tags.attributeValue], color: 'var(--syn-string)' },
  { tag: [tags.number, tags.bool, tags.atom, tags.unit], color: 'var(--syn-number)' },
  { tag: [tags.variableName, tags.definition(tags.variableName)], color: 'var(--syn-name)' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: 'var(--syn-function)' },
  { tag: [tags.operator, tags.punctuation, tags.bracket], color: 'var(--syn-punct)' },
  { tag: tags.invalid, color: 'var(--fail)', textDecoration: 'underline' },
]);

export const paperEditorTheme: Extension = [paperTheme, syntaxHighlighting(paperHighlight)];
