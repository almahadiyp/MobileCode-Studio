import { EditorState, Extension, StateEffect, StateField } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, highlightSpecialChars, rectangularSelection, crosshairCursor, dropCursor, tooltips, ViewPlugin, Decoration, WidgetType } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab, undo, redo, selectAll } from '@codemirror/commands';
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, indentUnit, LanguageDescription, StreamLanguage } from '@codemirror/language';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches, search, openSearchPanel } from '@codemirror/search';
import { lintGutter, linter, lintKeymap } from '@codemirror/lint';

import { HighlightStyle, syntaxHighlighting as sh } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

import type { Settings } from '@/types';
import type { ThemeColors } from '@/lib/settings';
import { getLanguageExtension } from './languages';
import type { FileNode } from '@/types';
import { getLanguageByFile } from './languages';

// Theme tag mapping — maps CodeMirror highlight tags to our theme colors
export function createHighlightStyle(theme: ThemeColors) {
  const s = theme.syntax;
  return HighlightStyle.define([
    { tag: t.keyword, color: s.keyword, fontWeight: 'bold' },
    { tag: [t.name, t.deleted, t.character, t.macroName], color: s.variable },
    { tag: [t.function(t.variableName), t.labelName], color: s.function },
    { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: s.constant },
    { tag: [t.definition(t.name), t.separator], color: s.definition },
    { tag: [t.typeName, t.className, t.number, t.propertyName, t.constant(t.className)], color: s.type },
    { tag: [t.string, t.special(t.string)], color: s.string },
    { tag: [t.number, t.bool, t.null], color: s.number },
    { tag: [t.comment, t.invalid], color: s.comment, fontStyle: 'italic' },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: s.builtin },
    { tag: [t.propertyName, t.variableName], color: s.property },
    { tag: [t.operator, t.punctuation, t.separator, t.bracket], color: s.punctuation },
    { tag: [t.tagName], color: s.tag },
    { tag: [t.attributeName], color: s.attribute },
    { tag: t.variableName, color: s.variable },
    { tag: t.definitionKeyword, color: s.keyword },
    { tag: t.modifier, color: s.keyword },
  ]);
}

export function createEditorTheme(theme: ThemeColors, settings: Settings): Extension {
  return EditorView.theme(
    {
      '&': {
        backgroundColor: theme.editorBg,
        color: theme.text,
        height: '100%',
        fontSize: `${settings.fontSize}px`,
        fontFamily: settings.fontFamily,
        fontVariantLigatures: settings.fontLigatures ? 'normal' : 'none',
      },
      '.cm-content': {
        caretColor: theme.editorCursor,
        padding: '0 4px',
        maxWidth: '100%',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: theme.editorCursor,
        borderLeftWidth: '2px',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
        { backgroundColor: theme.editorSelection },
      '.cm-gutters': {
        backgroundColor: theme.editorGutter,
        color: theme.textMuted,
        border: 'none',
        borderRight: `1px solid ${theme.panelBorder}`,
      },
      '.cm-activeLine': { backgroundColor: theme.editorActiveLine },
      '.cm-activeLineGutter': { backgroundColor: theme.editorActiveLine, color: theme.text },
      '.cm-foldPlaceholder': {
        backgroundColor: theme.backgroundActive,
        color: theme.textMuted,
        border: 'none',
        borderRadius: '3px',
        padding: '0 4px',
      },
      '.cm-tooltip': {
        backgroundColor: theme.panel,
        border: `1px solid ${theme.panelBorder}`,
        borderRadius: '6px',
      },
      '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
        backgroundColor: theme.accent,
        color: theme.accentFg,
      },
      '.cm-tooltip-autocomplete > ul > li': {
        padding: '2px 8px',
      },
      '.cm-tooltip-lint': {
        backgroundColor: theme.panel,
        border: `1px solid ${theme.panelBorder}`,
      },
      '.cm-diagnosticText': { color: theme.text },
      '.cm-lineNumbers .cm-gutterElement': { padding: '0 6px 0 4px' },
      '.cm-searchMatch': { backgroundColor: theme.editorSelection, color: theme.text },
      '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: theme.accent,
        color: theme.accentFg,
      },
      '.cm-panels': {
        backgroundColor: theme.panel,
        color: theme.text,
        borderBottom: `1px solid ${theme.panelBorder}`,
      },
      '.cm-panels.cm-panels-top button': {
        backgroundColor: theme.backgroundAlt,
        color: theme.text,
        border: `1px solid ${theme.panelBorder}`,
      },
      '.cm-textfield': {
        backgroundColor: theme.background,
        color: theme.text,
        border: `1px solid ${theme.panelBorder}`,
      },
      '.cm-foldGutter .cm-gutterElement': {
        color: theme.textMuted,
        cursor: 'pointer',
      },
      '.cm-whitespace::before': {
        color: theme.editorWhitespace,
        position: 'absolute',
        pointerEvents: 'none',
      },
      '.cm-indent-markers': { color: theme.editorIndent },
    },
    { dark: theme.mode === 'dark' || theme.mode === 'amoled' || theme.mode === 'high-contrast' },
  );
}

// Simple diagnostic source — provides basic error detection for JS/TS
function createDiagnostics(file: FileNode) {
  const lang = getLanguageByFile(file);
  if (!lang) return [];

  return linter((view) => {
    const diagnostics: { from: number; to: number; severity: 'error' | 'warning'; message: string }[] = [];
    const text = view.state.doc.toString();
    const langId = lang.id;

    // Basic bracket balance check
    if (['javascript', 'typescript', 'java', 'kotlin', 'cpp', 'rust', 'go', 'php', 'csharp'].includes(langId)) {
      const stack: { ch: string; pos: number }[] = [];
      const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '(' || ch === '[' || ch === '{') stack.push({ ch, pos: i });
        else if (pairs[ch]) {
          const top = stack.pop();
          if (!top || top.ch !== pairs[ch]) {
            diagnostics.push({
              from: i,
              to: i + 1,
              severity: 'error',
              message: `Mismatched "${ch}"`,
            });
          }
        }
      }
      while (stack.length) {
        const open = stack.pop()!;
        diagnostics.push({
          from: open.pos,
          to: open.pos + 1,
          severity: 'error',
          message: `Unclosed "${open.ch}"`,
        });
      }
    }

    // Trailing whitespace warning
    const lines = text.split('\n');
    let pos = 0;
    for (const line of lines) {
      const m = line.match(/\s+$/);
      if (m && line.trim().length > 0) {
        diagnostics.push({
          from: pos + line.length - m[0].length,
          to: pos + line.length,
          severity: 'warning',
          message: 'Trailing whitespace',
        });
      }
      pos += line.length + 1;
    }

    return diagnostics.slice(0, 100); // limit
  });
}

// Completion provider — language-aware keyword completion
function createCompletionProvider(file: FileNode) {
  const lang = getLanguageByFile(file);
  const keywords = lang?.autoComplete ?? [];

  return autocompletion({
    override: [
      (context: CompletionContext): CompletionResult | null => {
        const word = context.matchBefore(/\w+/);
        if (!word || (word.from === word.to && !context.explicit)) return null;
        if (keywords.length === 0) return null;

        return {
          from: word.from,
          options: keywords.map((kw) => ({
            label: kw,
            type: 'keyword',
            apply: kw,
          })),
          filter: true,
        };
      },
    ],
    activateOnTyping: true,
    closeOnBlur: true,
  });
}

export function createEditorState(
  file: FileNode,
  theme: ThemeColors,
  settings: Settings,
  onUpdate: (text: string) => void,
): EditorState {
  const extensions: Extension[] = [
    history(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    sh(createHighlightStyle(theme)),
    createEditorTheme(theme, settings),
    EditorState.tabSize.of(settings.tabSize),
    indentUnit.of(settings.useTabs ? '\t' : ' '.repeat(settings.tabSize)),
    EditorView.lineWrapping,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onUpdate(update.state.doc.toString());
      }
    }),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...completionKeymap,
      ...lintKeymap,
      indentWithTab,
    ]),
    highlightSelectionMatches(),
    search({ top: true }),
    tooltips({ position: 'absolute' }),
    rectangularSelection(),
    crosshairCursor(),
  ];

  if (settings.lineNumbers) {
    extensions.push(lineNumbers());
  }
  if (settings.highlightActiveLine) {
    extensions.push(highlightActiveLine(), highlightActiveLineGutter());
  }
  if (settings.autoCloseBrackets) {
    extensions.push(closeBrackets());
  }
  if (settings.codeFolding) {
    extensions.push(
      foldGutter({
        markerDOM: (open) => {
          const span = document.createElement('span');
          span.textContent = open ? '▾' : '▸';
          span.style.color = theme.textMuted;
          span.style.fontSize = '10px';
          return span;
        },
      }),
    );
  }
  if (settings.showWhitespace) {
    extensions.push(highlightSpecialChars());
  }

  extensions.push(...getLanguageExtension(file));
  extensions.push(createDiagnostics(file));
  extensions.push(createCompletionProvider(file));
  extensions.push(lintGutter());

  return EditorState.create({
    doc: file.content ?? '',
    extensions,
  });
}

export function reconfigureEditor(
  view: EditorView,
  file: FileNode,
  theme: ThemeColors,
  settings: Settings,
) {
  const state = createEditorState(file, theme, settings, () => {});
  view.setState(state);
}

export function applyThemeToView(view: EditorView, theme: ThemeColors, settings: Settings) {
  // Reconfigure by dispatching effects — simpler: just rebuild
  // CodeMirror doesn't support full theme swap without reconfig
}

export class EditorManager {
  private views = new Map<string, EditorView>();

  createView(
    file: FileNode,
    parent: HTMLElement,
    theme: ThemeColors,
    settings: Settings,
    onUpdate: (text: string) => void,
  ): EditorView {
    const existing = this.views.get(file.id);
    if (existing) {
      existing.destroy();
    }

    const view = new EditorView({
      state: createEditorState(file, theme, settings, onUpdate),
      parent,
    });
    this.views.set(file.id, view);
    return view;
  }

  destroyView(id: string) {
    const view = this.views.get(id);
    if (view) {
      view.destroy();
      this.views.delete(id);
    }
  }

  getView(id: string): EditorView | undefined {
    return this.views.get(id);
  }

  scrollToLine(id: string, line: number) {
    const view = this.views.get(id);
    if (!view) return;
    const linePos = view.state.doc.line(Math.min(line, view.state.doc.lines)).from;
    view.dispatch({
      selection: { anchor: linePos },
      effects: EditorView.scrollIntoView(linePos, { y: 'center' }),
    });
    view.focus();
  }

  destroyAll() {
    for (const view of this.views.values()) view.destroy();
    this.views.clear();
  }
}

export const editorManager = new EditorManager();
