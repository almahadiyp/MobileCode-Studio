import { useState } from 'react';
import {
  Terminal, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Delete, Undo2, Redo2, CornerDownLeft,
} from 'lucide-react';
import { useIDE } from '@/lib/store';
import { editorManager } from '@/lib/editor';
import { vfs } from '@/lib/vfs';
import { undo, redo } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';

const KEY_ROWS = [
  [
    { label: 'ESC', action: 'esc', width: 'normal' },
    { label: 'TAB', action: 'tab', width: 'normal' },
    { label: 'CTRL', action: 'ctrl', width: 'toggle' },
    { label: 'ALT', action: 'alt', width: 'toggle' },
    { label: 'SHIFT', action: 'shift', width: 'toggle' },
    { label: '⌫', action: 'backspace', width: 'normal', icon: Delete },
  ],
  [
    { label: '↑', action: 'up', width: 'narrow', icon: ArrowUp },
    { label: '↓', action: 'down', width: 'narrow', icon: ArrowDown },
    { label: '←', action: 'left', width: 'narrow', icon: ArrowLeft },
    { label: '→', action: 'right', width: 'narrow', icon: ArrowRight },
    { label: '{', action: 'char', char: '{' },
    { label: '}', action: 'char', char: '}' },
    { label: '[', action: 'char', char: '[' },
    { label: ']', action: 'char', char: ']' },
    { label: '(', action: 'char', char: '(' },
    { label: ')', action: 'char', char: ')' },
  ],
  [
    { label: '<', action: 'char', char: '<' },
    { label: '>', action: 'char', char: '>' },
    { label: '/', action: 'char', char: '/' },
    { label: '\\', action: 'char', char: '\\' },
    { label: '|', action: 'char', char: '|' },
    { label: ';', action: 'char', char: ';' },
    { label: ':', action: 'char', char: ':' },
    { label: '=', action: 'char', char: '=' },
    { label: '+', action: 'char', char: '+' },
    { label: '-', action: 'char', char: '-' },
    { label: '*', action: 'char', char: '*' },
  ],
  [
    { label: '_', action: 'char', char: '_' },
    { label: '"', action: 'char', char: '"' },
    { label: "'", action: 'char', char: "'" },
    { label: '#', action: 'char', char: '#' },
    { label: '$', action: 'char', char: '$' },
    { label: '%', action: 'char', char: '%' },
    { label: '&', action: 'char', char: '&' },
    { label: '!', action: 'char', char: '!' },
    { label: '@', action: 'char', char: '@' },
    { label: '~', action: 'char', char: '~' },
  ],
];

interface KeyDef {
  label: string;
  action: string;
  char?: string;
  width?: string;
  icon?: any;
}

export function KeyboardBar() {
  const { themeColors, settings, groups, activeGroupId } = useIDE.useShallow((s) => ({
    themeColors: s.themeColors,
    settings: s.settings,
    groups: s.groups,
    activeGroupId: s.activeGroupId,
  }));
  const [modifiers, setModifiers] = useState<Record<string, boolean>>({ ctrl: false, alt: false, shift: false });

  if (!settings.shortcutBar) return null;

  const getActiveView = (): EditorView | undefined => {
    const group = groups.find((g) => g.id === activeGroupId);
    const tab = group?.tabs.find((t) => t.id === group.activeTabId);
    if (!tab) return undefined;
    return editorManager.getView(tab.id);
  };

  const insertText = (text: string) => {
    const view = getActiveView();
    if (!view) return;
    const state = view.state;
    const changes = state.changeByRange((range) => ({
      changes: { from: range.from, to: range.to, insert: text },
      range: state.selection.main,
    }));
    view.dispatch(changes);
    view.focus();
  };

  const handleKey = (key: KeyDef) => {
    const view = getActiveView();

    if (key.action === 'ctrl' || key.action === 'alt' || key.action === 'shift') {
      setModifiers((m) => ({ ...m, [key.action]: !m[key.action] }));
      return;
    }

    if (!view) return;

    switch (key.action) {
      case 'esc':
        view.contentDOM.blur();
        break;
      case 'tab':
        view.dispatch(view.state.changeByRange((range) => ({
          changes: { from: range.from, insert: ' '.repeat(settings.tabSize) },
          range,
        })));
        view.focus();
        break;
      case 'backspace':
        view.dispatch(view.state.replaceSelection(''));
        view.focus();
        break;
      case 'up':
        view.focus();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
        break;
      case 'down':
        view.focus();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
        break;
      case 'left':
        view.focus();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        break;
      case 'right':
        view.focus();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        break;
      case 'char':
        insertText(key.char!);
        break;
    }

    // Reset non-sticky modifiers after action
    setModifiers((m) => ({ ...m, ctrl: false, alt: false }));
  };

  const undoAction = () => {
    const view = getActiveView();
    if (view) { undo(view); view.focus(); }
  };

  const redoAction = () => {
    const view = getActiveView();
    if (view) { redo(view); view.focus(); }
  };

  const runShortcut = (e: React.KeyboardEvent) => {
    const view = getActiveView();
    if (!view) return;
    view.focus();
    // dispatch the actual keyboard event
    const key = e.key;
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
    }));
  };

  return (
    <div
      className="flex-shrink-0 border-t overflow-x-auto"
      style={{
        backgroundColor: themeColors.backgroundAlt,
        borderColor: themeColors.panelBorder,
      }}
    >
      {/* Quick action bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b" style={{ borderColor: themeColors.panelBorder }}>
        <KbdBtn onClick={undoAction} themeColors={themeColors} title="Undo">
          <Undo2 size={13} />
        </KbdBtn>
        <KbdBtn onClick={redoAction} themeColors={themeColors} title="Redo">
          <Redo2 size={13} />
        </KbdBtn>
        <div className="w-px h-4 mx-1" style={{ backgroundColor: themeColors.panelBorder }} />
        <KbdBtn onClick={() => insertText('  ')} themeColors={themeColors} title="Indent">
          <CornerDownLeft size={13} />
        </KbdBtn>
        <KbdBtn onClick={() => { const v = getActiveView(); if (v) { v.dispatch(v.state.replaceSelection('')); v.focus(); } }} themeColors={themeColors} title="Delete">
          <Delete size={13} />
        </KbdBtn>
        <div className="flex-1" />
        <span className="text-[9px]" style={{ color: themeColors.textSubtle }}>
          {modifiers.ctrl && 'CTRL'} {modifiers.alt && 'ALT'} {modifiers.shift && 'SHIFT'}
        </span>
      </div>

      {/* Key rows */}
      <div className="py-1 px-1">
        {KEY_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-center justify-center gap-0.5 mb-0.5">
            {row.map((key, i) => {
              const isActive = (key.action === 'ctrl' && modifiers.ctrl) ||
                (key.action === 'alt' && modifiers.alt) ||
                (key.action === 'shift' && modifiers.shift);
              return (
                <button
                  key={i}
                  className="flex items-center justify-center rounded text-[11px] font-mono transition-all active:scale-95"
                  style={{
                    minWidth: key.width === 'narrow' ? '26px' : key.width === 'normal' ? '36px' : '30px',
                    height: '28px',
                    padding: '0 4px',
                    backgroundColor: isActive ? themeColors.accent : themeColors.backgroundActive,
                    color: isActive ? themeColors.accentFg : themeColors.text,
                  }}
                  onClick={() => handleKey(key)}
                >
                  {key.icon ? <key.icon size={13} /> : key.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function KbdBtn({ children, onClick, themeColors, title }: { children: React.ReactNode; onClick: () => void; themeColors: any; title: string }) {
  return (
    <button
      className="p-1.5 rounded transition-colors active:scale-95"
      style={{ color: themeColors.text, backgroundColor: themeColors.backgroundActive }}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}
