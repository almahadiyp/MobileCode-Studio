import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X, ChevronRight, Trash2, AlertCircle } from 'lucide-react';
import { useIDE } from '@/lib/store';
import { providers } from '@/lib/providers/registry';
import type { TerminalLine } from '@/types';

export function TerminalPanel() {
  const { themeColors, terminalLines, runTerminalCommand, clearTerminal } = useIDE();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const MAX_LINES = 500;
  const visibleLines = terminalLines.length > MAX_LINES
    ? terminalLines.slice(terminalLines.length - MAX_LINES)
    : terminalLines;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLines.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      runTerminalCommand(input.trim());
      setInput('');
    }
  };

  const lineColor = (line: TerminalLine) => {
    switch (line.type) {
      case 'input': return themeColors.terminal.input;
      case 'error': return themeColors.terminal.error;
      case 'system': return themeColors.terminal.system;
      case 'output': return themeColors.terminal.fg;
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.terminal.bg }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: themeColors.panelBorder }}>
        <div className="flex items-center gap-2">
          <TerminalIcon size={13} style={{ color: themeColors.textMuted }} />
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
            Terminal
          </span>
          {!providers.terminal.isAvailable && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: themeColors.backgroundActive, color: themeColors.textMuted }}
            >
              prototype
            </span>
          )}
        </div>
        <button
          className="p-1 rounded transition-colors"
          style={{ color: themeColors.textMuted }}
          onClick={clearTerminal}
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto px-3 py-1.5 font-mono text-xs">
        {visibleLines.map((line) => (
          <div key={line.id} style={{ color: lineColor(line), whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {line.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-1.5 border-t" style={{ borderColor: themeColors.panelBorder }}>
        <ChevronRight size={12} style={{ color: themeColors.terminal.prompt }} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command..."
          className="flex-1 bg-transparent outline-none font-mono text-xs"
          style={{ color: themeColors.terminal.fg }}
          autoFocus
        />
      </form>
    </div>
  );
}

export function ProblemsPanel() {
  const { themeColors, groups } = useIDE();
  const problems: { path: string; line: number; message: string; severity: string }[] = [];

  for (const group of groups) {
    for (const tab of group.tabs) {
      // No language server connected — no diagnostics available
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.terminal.bg }}>
      <div className="px-3 py-1.5 border-b" style={{ borderColor: themeColors.panelBorder }}>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
          Problems
        </span>
      </div>
      <div className="flex-1 overflow-auto px-3 py-2">
        {problems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <AlertCircle size={20} style={{ color: themeColors.textMuted }} />
            <p className="text-xs text-center" style={{ color: themeColors.textMuted }}>
              No language server connected
            </p>
            <p className="text-[10px] text-center" style={{ color: themeColors.textSubtle }}>
              Diagnostics require a native runtime with LSP support.
            </p>
          </div>
        ) : (
          problems.map((p, i) => (
            <div key={i} className="py-1 text-xs">
              <span style={{ color: p.severity === 'error' ? themeColors.error : themeColors.warning }}>
                {p.severity === 'error' ? '●' : '⚠'}
              </span>
              <span style={{ color: themeColors.text }}> {p.message}</span>
              <span style={{ color: themeColors.textMuted }}> {p.path}:{p.line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function BuildPanel() {
  const { themeColors } = useIDE();
  const build = providers.build;
  const [output, setOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const runBuild = async () => {
    if (!build.isAvailable) {
      setOutput(['Build runtime unavailable', 'A native Android runtime is required to build projects.']);
      return;
    }
    setRunning(true);
    setOutput([]);
    try {
      const result = await build.build();
      setOutput(result.output);
    } catch (err) {
      setOutput(['Build failed: ' + String(err)]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.terminal.bg }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: themeColors.panelBorder }}>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
          Build Output
        </span>
        <button
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors disabled:opacity-50"
          style={{ backgroundColor: build.isAvailable ? themeColors.accent : themeColors.backgroundActive, color: build.isAvailable ? themeColors.accentFg : themeColors.textMuted }}
          onClick={runBuild}
          disabled={running || !build.isAvailable}
        >
          Build
        </button>
      </div>
      <div className="flex-1 overflow-auto px-3 py-2 font-mono text-xs">
        {output.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <AlertCircle size={20} style={{ color: themeColors.textMuted }} />
            <p className="text-xs text-center" style={{ color: themeColors.textMuted }}>
              {build.isAvailable ? 'Click Build to start' : 'Build runtime unavailable'}
            </p>
            {!build.isAvailable && (
              <p className="text-[10px] text-center" style={{ color: themeColors.textSubtle }}>
                A native Android runtime is required to build projects.
              </p>
            )}
          </div>
        ) : (
          output.map((line, i) => (
            <div key={i} style={{ color: line.includes('unavailable') || line.includes('failed') ? themeColors.terminal.error : themeColors.terminal.fg, whiteSpace: 'pre-wrap' }}>
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function OutputPanel() {
  const { themeColors, terminalLines } = useIDE();
  const outputLines = terminalLines.filter((l) => l.type === 'output' || l.type === 'system');

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.terminal.bg }}>
      <div className="px-3 py-1.5 border-b" style={{ borderColor: themeColors.panelBorder }}>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
          Output
        </span>
      </div>
      <div className="flex-1 overflow-auto px-3 py-2 font-mono text-xs">
        {outputLines.length === 0 ? (
          <div className="text-center py-4" style={{ color: themeColors.textMuted }}>
            No output
          </div>
        ) : (
          outputLines.map((line) => (
            <div key={line.id} style={{ color: line.type === 'system' ? themeColors.terminal.system : themeColors.terminal.fg, whiteSpace: 'pre-wrap' }}>
              {line.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
