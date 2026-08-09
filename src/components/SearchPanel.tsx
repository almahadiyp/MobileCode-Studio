import { useState, useRef } from 'react';
import {
  Search, Replace, CaseSensitive, WholeWord, Regex,
  ChevronRight, ChevronDown, FileCode, X,
} from 'lucide-react';
import { useIDE } from '@/lib/store';
import { vfs } from '@/lib/vfs';
import type { SearchResult } from '@/types';

export function SearchPanel() {
  const { themeColors, searchResults, setSearchResults, openFileAtLine, settings } = useIDE();
  const [query, setQuery] = useState('');
  const [replace, setReplace] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [includePattern, setIncludePattern] = useState('');
  const [excludePattern, setExcludePattern] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const performSearch = () => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchHistory((h) => [query, ...h.filter((s) => s !== query)].slice(0, 10));

    const results: SearchResult[] = [];
    const files = vfs.getAllFiles();

    let regex: RegExp;
    try {
      const pattern = useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const flags = caseSensitive ? 'g' : 'gi';
      const fullPattern = wholeWord ? `\\b${pattern}\\b` : pattern;
      regex = new RegExp(fullPattern, flags);
    } catch {
      return;
    }

    for (const file of files) {
      if (includePattern && !file.name.match(globToRegex(includePattern))) continue;
      if (excludePattern && file.name.match(globToRegex(excludePattern))) continue;

      const content = file.content ?? '';
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(lines[i])) !== null) {
          results.push({
            path: file.path,
            name: file.name,
            line: i + 1,
            column: match.index + 1,
            preview: lines[i].trim(),
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });
          if (match.index === regex.lastIndex) regex.lastIndex++;
          if (results.length >= 500) break;
        }
        if (results.length >= 500) break;
      }
    }

    setSearchResults(results);
    const fileSet = new Set(results.map((r) => r.path));
    setExpandedFiles(fileSet);
  };

  const globToRegex = (glob: string): RegExp => {
    const re = glob.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${re}$`);
  };

  const performReplace = () => {
    if (!query.trim()) return;
    const files = vfs.getAllFiles();
    for (const file of files) {
      if (!file.content) continue;
      let regex: RegExp;
      try {
        const pattern = useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const flags = caseSensitive ? 'g' : 'gi';
        const fullPattern = wholeWord ? `\\b${pattern}\\b` : pattern;
        regex = new RegExp(fullPattern, flags);
      } catch {
        continue;
      }
      const newContent = file.content.replace(regex, replace);
      if (newContent !== file.content) {
        vfs.writeFile(file.path, newContent);
      }
    }
    performSearch();
  };

  const groupedResults = searchResults.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.path] ??= []).push(r);
    return acc;
  }, {});

  const toggleFile = (path: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.sidebar }}>
      <div className="px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
          Search
        </span>
      </div>
      <div className="px-2 pb-2 space-y-1.5">
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded transition-colors"
            style={{ color: themeColors.textMuted }}
            onClick={() => setShowReplace(!showReplace)}
          >
            {showReplace ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: themeColors.background, border: `1px solid ${themeColors.panelBorder}` }}>
            <Search size={12} style={{ color: themeColors.textMuted }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
              placeholder="Search"
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: themeColors.text }}
            />
            <div className="flex items-center gap-0.5">
              <ToggleBtn active={caseSensitive} onClick={() => setCaseSensitive(!caseSensitive)} title="Case sensitive" themeColors={themeColors}>
                <CaseSensitive size={12} />
              </ToggleBtn>
              <ToggleBtn active={wholeWord} onClick={() => setWholeWord(!wholeWord)} title="Whole word" themeColors={themeColors}>
                <WholeWord size={12} />
              </ToggleBtn>
              <ToggleBtn active={useRegex} onClick={() => setUseRegex(!useRegex)} title="Regex" themeColors={themeColors}>
                <Regex size={12} />
              </ToggleBtn>
            </div>
          </div>
        </div>
        {showReplace && (
          <div className="flex items-center gap-1 pl-5">
            <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: themeColors.background, border: `1px solid ${themeColors.panelBorder}` }}>
              <Replace size={12} style={{ color: themeColors.textMuted }} />
              <input
                value={replace}
                onChange={(e) => setReplace(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performReplace()}
                placeholder="Replace"
                className="flex-1 bg-transparent outline-none text-xs"
                style={{ color: themeColors.text }}
              />
            </div>
            <button
              className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
              style={{ backgroundColor: themeColors.accent, color: themeColors.accentFg }}
              onClick={performReplace}
            >
              Replace All
            </button>
          </div>
        )}
        <button
          className="flex items-center gap-1 text-[10px] pl-5"
          style={{ color: themeColors.textMuted }}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Filters
        </button>
        {showFilters && (
          <div className="pl-5 space-y-1">
            <input
              value={includePattern}
              onChange={(e) => setIncludePattern(e.target.value)}
              placeholder="Include: *.js, *.ts"
              className="w-full text-xs px-2 py-1 rounded outline-none"
              style={{ backgroundColor: themeColors.background, color: themeColors.text, border: `1px solid ${themeColors.panelBorder}` }}
            />
            <input
              value={excludePattern}
              onChange={(e) => setExcludePattern(e.target.value)}
              placeholder="Exclude: node_modules"
              className="w-full text-xs px-2 py-1 rounded outline-none"
              style={{ backgroundColor: themeColors.background, color: themeColors.text, border: `1px solid ${themeColors.panelBorder}` }}
            />
          </div>
        )}
      </div>

      <div className="px-3 py-1 text-[10px]" style={{ color: themeColors.textMuted }}>
        {searchResults.length > 0
          ? `${searchResults.length} results in ${Object.keys(groupedResults).length} files`
          : 'No results'}
      </div>

      <div className="flex-1 overflow-auto">
        {Object.entries(groupedResults).map(([path, matches]) => (
          <div key={path}>
            <button
              className="flex items-center gap-1 w-full px-2 py-1 text-left transition-colors"
              style={{ color: themeColors.text }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColors.backgroundHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => toggleFile(path)}
            >
              {expandedFiles.has(path) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <FileCode size={12} style={{ color: themeColors.accent }} />
              <span className="text-xs truncate flex-1">{path.split('/').pop()}</span>
              <span className="text-[10px] px-1 rounded" style={{ backgroundColor: themeColors.backgroundActive, color: themeColors.textMuted }}>
                {matches.length}
              </span>
            </button>
            {expandedFiles.has(path) && (
              <div>
                {matches.map((r, i) => (
                  <button
                    key={i}
                    className="flex items-start gap-2 w-full pl-7 pr-2 py-0.5 text-left transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColors.backgroundHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => {
                      const node = vfs.getNodeByPath(r.path);
                      if (node) openFileAtLine(node, r.line);
                    }}
                  >
                    <span className="text-[10px] flex-shrink-0" style={{ color: themeColors.textMuted }}>
                      {r.line}:{r.column}
                    </span>
                    <span className="text-[11px] truncate flex-1 font-mono" style={{ color: themeColors.text }}>
                      {r.preview}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {searchHistory.length > 0 && (
        <div className="border-t px-2 py-1" style={{ borderColor: themeColors.panelBorder }}>
          <div className="text-[10px] mb-1" style={{ color: themeColors.textMuted }}>Recent</div>
          <div className="flex flex-wrap gap-1">
            {searchHistory.slice(0, 5).map((s) => (
              <button
                key={s}
                className="text-[10px] px-1.5 py-0.5 rounded transition-colors"
                style={{ backgroundColor: themeColors.backgroundActive, color: themeColors.textMuted }}
                onClick={() => { setQuery(s); }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleBtn({ active, onClick, title, children, themeColors }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode; themeColors: any }) {
  return (
    <button
      className="p-0.5 rounded transition-colors"
      style={{
        backgroundColor: active ? themeColors.accent : 'transparent',
        color: active ? themeColors.accentFg : themeColors.textMuted,
      }}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}
