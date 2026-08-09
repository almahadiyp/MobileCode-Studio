import { useState } from 'react';
import {
  Play, Plus, Trash2, Bug, FlaskConical,
  ChevronRight, Terminal, AlertCircle,
} from 'lucide-react';
import { useIDE } from '@/lib/store';
import { providers } from '@/lib/providers/registry';
import { vfs } from '@/lib/vfs';
import type { TaskItem } from '@/types';

export function TasksPanel() {
  const { themeColors, showToast, setBottomPanel } = useIDE();
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', name: 'Build', command: 'npm run build', type: 'build', status: 'idle' },
    { id: '2', name: 'Run Tests', command: 'npm test', type: 'test', status: 'idle' },
    { id: '3', name: 'Start Server', command: 'npm start', type: 'run', status: 'idle' },
    { id: '4', name: 'Lint', command: 'npm run lint', type: 'shell', status: 'idle' },
  ]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCmd, setNewCmd] = useState('');

  const runTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    showToast('Task runtime unavailable — cannot execute commands');
  };

  const addTask = () => {
    if (!newName.trim() || !newCmd.trim()) return;
    setTasks((prev) => [...prev, { id: Math.random().toString(36).slice(2), name: newName, command: newCmd, type: 'shell', status: 'idle' }]);
    setNewName('');
    setNewCmd('');
    setShowNew(false);
  };

  const typeIcons: Record<string, any> = { build: Play, test: FlaskConical, run: Play, shell: Terminal };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.sidebar }}>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
          Tasks
        </span>
        <button
          className="p-1 rounded transition-colors"
          style={{ color: themeColors.textMuted }}
          onClick={() => setShowNew(!showNew)}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="px-3 py-1.5">
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: themeColors.textSubtle }}>
          <AlertCircle size={11} />
          <span>No runtime connected — tasks cannot be executed.</span>
        </div>
      </div>

      {showNew && (
        <div className="px-2 pb-2 space-y-1">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Task name"
            className="w-full text-xs px-2 py-1 rounded outline-none"
            style={{ backgroundColor: themeColors.background, color: themeColors.text, border: `1px solid ${themeColors.panelBorder}` }}
          />
          <input
            value={newCmd}
            onChange={(e) => setNewCmd(e.target.value)}
            placeholder="Command"
            className="w-full text-xs px-2 py-1 rounded outline-none"
            style={{ backgroundColor: themeColors.background, color: themeColors.text, border: `1px solid ${themeColors.panelBorder}` }}
          />
          <button
            className="w-full py-1 rounded text-xs"
            style={{ backgroundColor: themeColors.accent, color: themeColors.accentFg }}
            onClick={addTask}
          >
            Add Task
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {tasks.map((task) => {
          const TypeIcon = typeIcons[task.type];
          return (
            <div
              key={task.id}
              className="flex items-center gap-2 px-3 py-2 border-b transition-colors"
              style={{ borderColor: themeColors.panelBorder }}
            >
              <TypeIcon size={14} style={{ color: themeColors.textMuted }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate" style={{ color: themeColors.text }}>{task.name}</div>
                <div className="text-[10px] truncate font-mono" style={{ color: themeColors.textMuted }}>{task.command}</div>
              </div>
              <button
                className="p-1 rounded"
                style={{ color: themeColors.textMuted }}
                onClick={() => runTask(task.id)}
                title="Run (requires runtime)"
              >
                <Play size={12} />
              </button>
              <button
                className="p-1 rounded"
                style={{ color: themeColors.textMuted }}
                onClick={() => { setTasks((prev) => prev.filter((t) => t.id !== task.id)); showToast('Task deleted'); }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TestingPanel() {
  const { themeColors } = useIDE();

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.sidebar }}>
      <div className="px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
          Testing
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-2">
        <AlertCircle size={24} style={{ color: themeColors.textMuted }} />
        <p className="text-xs" style={{ color: themeColors.textMuted }}>
          Test runtime unavailable
        </p>
        <p className="text-[10px]" style={{ color: themeColors.textSubtle }}>
          A native runtime with a test framework is required to run tests.
        </p>
      </div>
    </div>
  );
}

export function DebugPanel() {
  const { themeColors } = useIDE();
  const dbg = providers.debugger;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.sidebar }}>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
          Debug
        </span>
        <button
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] disabled:opacity-50"
          style={{ backgroundColor: themeColors.backgroundActive, color: themeColors.textMuted }}
          disabled={!dbg.isAvailable}
        >
          <Bug size={10} /> Start
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-2">
        <AlertCircle size={24} style={{ color: themeColors.textMuted }} />
        <p className="text-xs" style={{ color: themeColors.textMuted }}>
          Debugger runtime unavailable
        </p>
        <p className="text-[10px]" style={{ color: themeColors.textSubtle }}>
          A native runtime with debugger support is required for debugging.
        </p>
      </div>
    </div>
  );
}

export function OutlinePanel() {
  const { themeColors, groups, activeGroupId } = useIDE();
  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const activeTab = activeGroup?.tabs.find((t) => t.id === activeGroup.activeTabId);

  const symbols = activeTab ? extractSymbols(activeTab.path) : [];

  function extractSymbols(path: string) {
    const content = vfs.readFile(path) ?? '';
    const symbols: { name: string; type: string; line: number }[] = [];
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      const funcMatch = line.match(/(?:function|fun|def|void|int|public|private|protected)\s+(\w+)/);
      const classMatch = line.match(/(?:class|interface|object|struct)\s+(\w+)/);
      if (classMatch) symbols.push({ name: classMatch[1], type: 'class', line: i + 1 });
      else if (funcMatch) symbols.push({ name: funcMatch[1], type: 'function', line: i + 1 });
    });
    return symbols;
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.sidebar }}>
      <div className="px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
          Outline
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        {symbols.length === 0 ? (
          <div className="px-3 py-4 text-xs text-center" style={{ color: themeColors.textMuted }}>
            No symbols found
          </div>
        ) : (
          symbols.map((sym, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1 cursor-pointer transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColors.backgroundHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span
                className="text-[9px] px-1 rounded uppercase"
                style={{
                  backgroundColor: sym.type === 'class' ? themeColors.accent : themeColors.backgroundActive,
                  color: sym.type === 'class' ? themeColors.accentFg : themeColors.textMuted,
                }}
              >
                {sym.type}
              </span>
              <span className="text-xs font-mono" style={{ color: themeColors.text }}>{sym.name}</span>
              <span className="text-[10px] ml-auto" style={{ color: themeColors.textMuted }}>:{sym.line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function TimelinePanel() {
  const { themeColors } = useIDE();
  const events = [
    { time: '2 min ago', action: 'Edited app.js', type: 'edit' },
    { time: '5 min ago', action: 'Created Button.js', type: 'create' },
    { time: '10 min ago', action: 'Opened styles.css', type: 'open' },
    { time: '1 hour ago', action: 'Saved package.json', type: 'save' },
    { time: '2 hours ago', action: 'Created workspace', type: 'create' },
  ];

  const colors: Record<string, string> = {
    edit: themeColors.warning,
    create: themeColors.success,
    open: themeColors.info,
    save: themeColors.accent,
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.sidebar }}>
      <div className="px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
          Timeline
        </span>
      </div>
      <div className="flex-1 overflow-auto px-3 py-1">
        {events.map((event, i) => (
          <div key={i} className="flex items-start gap-2 py-2">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: colors[event.type] }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs" style={{ color: themeColors.text }}>{event.action}</div>
              <div className="text-[10px]" style={{ color: themeColors.textMuted }}>{event.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
