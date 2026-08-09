import { useState } from 'react';
import { Download, Star, Package, Search, Check, X, Settings as SettingsIcon } from 'lucide-react';
import { useIDE } from '@/lib/store';
import type { ExtensionInfo } from '@/types';

const SAMPLE_EXTENSIONS: ExtensionInfo[] = [
  { id: '1', name: 'Prettier', publisher: 'Prettier', description: 'Code formatter using prettier', version: '3.0.0', installed: true, enabled: true, downloads: '42M', rating: 4.8, categories: ['Formatters'] },
  { id: '2', name: 'ESLint', publisher: 'Microsoft', description: 'Integrates ESLint JavaScript into IDE', version: '2.4.1', installed: true, enabled: true, downloads: '38M', rating: 4.6, categories: ['Linters'] },
  { id: '3', name: 'Python', publisher: 'Microsoft', description: 'IntelliSense, linting, debugging for Python', version: '2024.0.1', installed: false, enabled: false, downloads: '120M', rating: 4.7, categories: ['Programming Languages'] },
  { id: '4', name: 'GitLens', publisher: 'GitKraken', description: 'Supercharge Git capabilities', version: '14.0.0', installed: false, enabled: false, downloads: '32M', rating: 4.9, categories: ['SCM Providers'] },
  { id: '5', name: 'Material Icon Theme', publisher: 'Philipp Kief', description: 'Material Design Icons for files', version: '5.0.0', installed: true, enabled: true, downloads: '25M', rating: 4.8, categories: ['Themes'] },
  { id: '6', name: 'Dart', publisher: 'Dart Code', description: 'Dart language support and debugger', version: '3.0.0', installed: false, enabled: false, downloads: '8M', rating: 4.5, categories: ['Programming Languages'] },
  { id: '7', name: 'Rust Analyzer', publisher: 'The Rust Project', description: 'Rust language support for IDE', version: '0.4.0', installed: false, enabled: false, downloads: '5M', rating: 4.7, categories: ['Programming Languages'] },
  { id: '8', name: 'Live Server', publisher: 'Ritwick Dey', description: 'Launch a local development server with live reload', version: '5.7.0', installed: false, enabled: false, downloads: '45M', rating: 4.6, categories: ['Other'] },
];

export function ExtensionsPanel() {
  const { themeColors, showToast } = useIDE();
  const [extensions, setExtensions] = useState<ExtensionInfo[]>(SAMPLE_EXTENSIONS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'installed'>('all');

  const filtered = extensions.filter((ext) => {
    if (filter === 'installed' && !ext.installed) return false;
    if (search && !ext.name.toLowerCase().includes(search.toLowerCase()) && !ext.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleInstall = (id: string) => {
    setExtensions((prev) =>
      prev.map((ext) =>
        ext.id === id
          ? { ...ext, installed: !ext.installed, enabled: !ext.installed }
          : ext,
      ),
    );
    const ext = extensions.find((e) => e.id === id);
    showToast(ext?.installed ? `Uninstalled ${ext.name}` : `Installed ${ext?.name}`);
  };

  const toggleEnable = (id: string) => {
    setExtensions((prev) =>
      prev.map((ext) =>
        ext.id === id ? { ...ext, enabled: !ext.enabled } : ext,
      ),
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.sidebar }}>
      <div className="px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
          Extensions
        </span>
      </div>
      <div className="px-2 pb-2">
        <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: themeColors.background, border: `1px solid ${themeColors.panelBorder}` }}>
          <Search size={12} style={{ color: themeColors.textMuted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search extensions..."
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: themeColors.text }}
          />
        </div>
        <div className="flex gap-1 mt-1.5">
          <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} themeColors={themeColors}>All</FilterBtn>
          <FilterBtn active={filter === 'installed'} onClick={() => setFilter('installed')} themeColors={themeColors}>Installed</FilterBtn>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {filtered.map((ext) => (
          <div
            key={ext.id}
            className="px-3 py-2 border-b transition-colors"
            style={{ borderColor: themeColors.panelBorder }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColors.backgroundHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div className="flex items-start gap-2">
              <div
                className="flex items-center justify-center rounded flex-shrink-0"
                style={{ width: '32px', height: '32px', backgroundColor: themeColors.backgroundActive }}
              >
                <Package size={16} style={{ color: themeColors.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold truncate" style={{ color: themeColors.text }}>{ext.name}</span>
                  {!ext.enabled && ext.installed && (
                    <span className="text-[9px] px-1 rounded" style={{ backgroundColor: themeColors.backgroundActive, color: themeColors.textMuted }}>disabled</span>
                  )}
                </div>
                <div className="text-[10px] truncate" style={{ color: themeColors.textMuted }}>{ext.description}</div>
                <div className="flex items-center gap-2 mt-1 text-[9px]" style={{ color: themeColors.textSubtle }}>
                  <span>{ext.publisher}</span>
                  <span>v{ext.version}</span>
                  <span className="flex items-center gap-0.5"><Download size={9} /> {ext.downloads}</span>
                  <span className="flex items-center gap-0.5"><Star size={9} /> {ext.rating}</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  {ext.installed ? (
                    <>
                      <button
                        className="text-[10px] px-2 py-0.5 rounded transition-colors"
                        style={{ backgroundColor: themeColors.backgroundActive, color: themeColors.text }}
                        onClick={() => toggleEnable(ext.id)}
                      >
                        {ext.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="text-[10px] px-2 py-0.5 rounded transition-colors"
                        style={{ color: themeColors.error }}
                        onClick={() => toggleInstall(ext.id)}
                      >
                        Uninstall
                      </button>
                    </>
                  ) : (
                    <button
                      className="text-[10px] px-2 py-0.5 rounded transition-colors"
                      style={{ backgroundColor: themeColors.accent, color: themeColors.accentFg }}
                      onClick={() => toggleInstall(ext.id)}
                    >
                      Install
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 py-1.5 border-t text-[9px]" style={{ borderColor: themeColors.panelBorder, color: themeColors.textSubtle }}>
        Extensions are sandboxed and cannot access unrestricted permissions.
      </div>
    </div>
  );
}

function FilterBtn({ active, onClick, children, themeColors }: { active: boolean; onClick: () => void; children: React.ReactNode; themeColors: any }) {
  return (
    <button
      className="text-[10px] px-2 py-0.5 rounded transition-colors"
      style={{
        backgroundColor: active ? themeColors.accent : themeColors.backgroundActive,
        color: active ? themeColors.accentFg : themeColors.textMuted,
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
