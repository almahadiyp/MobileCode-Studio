import { useState, useRef, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useIDE } from '@/lib/store';
import { vfs } from '@/lib/vfs';
import type { CommandItem } from '@/types';

export function CommandPalette({ commands }: { commands: CommandItem[] }) {
  const { themeColors, setCommandPaletteOpen, settings } = useIDE();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query
    ? commands.filter((c) =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (listRef.current) {
      const child = listRef.current.children[selectedIndex] as HTMLElement;
      child?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const execute = (cmd: CommandItem) => {
    cmd.action();
    setCommandPaletteOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) execute(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: themeColors.panel,
          border: `1px solid ${themeColors.panelBorder}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: themeColors.panelBorder }}>
          <Search size={16} style={{ color: themeColors.textMuted }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: themeColors.text }}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: themeColors.backgroundAlt, color: themeColors.textMuted }}>
            ESC
          </kbd>
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs" style={{ color: themeColors.textMuted }}>
              No commands found
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                className="flex items-center gap-3 px-4 py-2 w-full text-left transition-colors"
                style={{
                  backgroundColor: i === selectedIndex ? themeColors.backgroundHover : 'transparent',
                }}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => execute(cmd)}
              >
                <ChevronRight size={14} style={{ color: themeColors.textMuted }} />
                <span className="text-sm flex-1" style={{ color: themeColors.text }}>
                  {cmd.title}
                </span>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
                  {cmd.category}
                </span>
                {cmd.shortcut && (
                  <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: themeColors.backgroundAlt, color: themeColors.textMuted }}>
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function QuickOpen() {
  const { themeColors, setQuickOpenOpen, openFile } = useIDE();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const files = vfs.getAllFiles();
  const filtered = query
    ? files.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()) || f.path.toLowerCase().includes(query.toLowerCase()))
    : files;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const execute = (path: string) => {
    const node = vfs.getNodeByPath(path);
    if (node) openFile(node);
    setQuickOpenOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) execute(filtered[selectedIndex].path);
    } else if (e.key === 'Escape') {
      setQuickOpenOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={() => setQuickOpenOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: themeColors.panel,
          border: `1px solid ${themeColors.panelBorder}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: themeColors.panelBorder }}>
          <Search size={16} style={{ color: themeColors.textMuted }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Go to file..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: themeColors.text }}
          />
        </div>
        <div className="max-h-[50vh] overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs" style={{ color: themeColors.textMuted }}>
              No files found
            </div>
          ) : (
            filtered.slice(0, 50).map((file, i) => (
              <button
                key={file.id}
                className="flex items-center gap-3 px-4 py-2 w-full text-left transition-colors"
                style={{
                  backgroundColor: i === selectedIndex ? themeColors.backgroundHover : 'transparent',
                }}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => execute(file.path)}
              >
                <span className="text-sm" style={{ color: themeColors.text }}>
                  {file.name}
                </span>
                <span className="text-[10px] truncate" style={{ color: themeColors.textMuted }}>
                  {file.path}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
