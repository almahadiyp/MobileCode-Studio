import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import {
  Command, Search, Save, FileX, Terminal as TerminalIcon,
  Settings as SettingsIcon, GitCommit, GitBranch as GitBranchIcon,
  Play, Hammer, Palette, X, PanelBottomClose, PanelBottomOpen,
  Menu, FileText, Replace, Undo2, Redo2, FilePlus,
  Download, Upload, RotateCw, Check, FileCode, GitBranch,
} from 'lucide-react';

import { useIDE } from '@/lib/store';
import { vfs } from '@/lib/vfs';
import { projectManager } from '@/lib/project-manager';
import { editorManager } from '@/lib/editor';
import { providers } from '@/lib/providers/registry';
import type { CommandItem } from '@/types';

import { ActivityBar, StatusBar } from '@/components/ActivityBar';
import { EditorArea } from '@/components/EditorArea';
import { CommandPalette, QuickOpen } from '@/components/CommandPalette';
import { KeyboardBar } from '@/components/KeyboardBar';

const FileExplorer = lazy(() => import('@/components/FileExplorer').then(m => ({ default: m.FileExplorer })));
const SearchPanel = lazy(() => import('@/components/SearchPanel').then(m => ({ default: m.SearchPanel })));
const GitPanel = lazy(() => import('@/components/GitPanel').then(m => ({ default: m.GitPanel })));
const TerminalPanel = lazy(() => import('@/components/TerminalPanel').then(m => ({ default: m.TerminalPanel })));
const ProblemsPanel = lazy(() => import('@/components/TerminalPanel').then(m => ({ default: m.ProblemsPanel })));
const BuildPanel = lazy(() => import('@/components/TerminalPanel').then(m => ({ default: m.BuildPanel })));
const OutputPanel = lazy(() => import('@/components/TerminalPanel').then(m => ({ default: m.OutputPanel })));
const ExtensionsPanel = lazy(() => import('@/components/ExtensionsPanel').then(m => ({ default: m.ExtensionsPanel })));
const SettingsPanel = lazy(() => import('@/components/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const TasksPanel = lazy(() => import('@/components/TasksPanel').then(m => ({ default: m.TasksPanel })));
const TestingPanel = lazy(() => import('@/components/TasksPanel').then(m => ({ default: m.TestingPanel })));
const DebugPanel = lazy(() => import('@/components/TasksPanel').then(m => ({ default: m.DebugPanel })));
const OutlinePanel = lazy(() => import('@/components/TasksPanel').then(m => ({ default: m.OutlinePanel })));
const TimelinePanel = lazy(() => import('@/components/TasksPanel').then(m => ({ default: m.TimelinePanel })));

function PanelFallback() {
  return <div className="flex items-center justify-center h-full text-xs opacity-50">Loading…</div>;
}

function App() {
  const ide = useIDE.useShallow((s) => ({
    themeColors: s.themeColors,
    activePanel: s.activePanel,
    sidebarOpen: s.sidebarOpen,
    bottomPanelOpen: s.bottomPanelOpen,
    bottomPanel: s.bottomPanel,
    commandPaletteOpen: s.commandPaletteOpen,
    quickOpenOpen: s.quickOpenOpen,
    isTablet: s.isTablet,
    toastMsg: s.toastMsg,
    groups: s.groups,
    activeGroupId: s.activeGroupId,
    settings: s.settings,
    showToast: s.showToast,
    setPanel: s.setPanel,
    setBottomPanel: s.setBottomPanel,
    toggleSidebar: s.toggleSidebar,
    setCommandPaletteOpen: s.setCommandPaletteOpen,
    setQuickOpenOpen: s.setQuickOpenOpen,
    saveTab: s.saveTab,
    saveAll: s.saveAll,
    closeTab: s.closeTab,
    reopenClosedTab: s.reopenClosedTab,
    splitEditor: s.splitEditor,
    runTerminalCommand: s.runTerminalCommand,
    newFile: s.newFile,
    newFolder: s.newFolder,
    refreshRoot: s.refreshRoot,
  }));

  const [settingsOpen, setSettingsOpen] = useState(false);

  const ideRef = useRef(ide);
  ideRef.current = ide;

  useEffect(() => {
    const handler = () => {
      const s = useIDE.getState();
      s.setTablet(window.innerWidth >= 768);
      s.setLandscape(window.innerWidth > window.innerHeight);
    };
    handler();
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = useIDE.getState();
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'p':
            e.preventDefault();
            if (e.shiftKey) s.setCommandPaletteOpen(true);
            else s.setQuickOpenOpen(true);
            break;
          case 's':
            e.preventDefault();
            if (e.shiftKey) s.saveAll();
            else {
              const group = s.groups.find((g) => g.id === s.activeGroupId);
              if (group?.activeTabId) s.saveTab(group.id, group.activeTabId);
            }
            break;
          case 'f':
            e.preventDefault();
            s.setPanel('search');
            if (!s.sidebarOpen) s.toggleSidebar();
            break;
          case 'h':
            e.preventDefault();
            s.setPanel('search');
            if (!s.sidebarOpen) s.toggleSidebar();
            break;
          case 'w':
            e.preventDefault();
            {
              const group = s.groups.find((g) => g.id === s.activeGroupId);
              if (group?.activeTabId) s.closeTab(group.id, group.activeTabId);
            }
            break;
          case '`':
            e.preventDefault();
            if (s.bottomPanelOpen && s.bottomPanel === 'terminal') s.setBottomPanel(null);
            else s.setBottomPanel('terminal');
            break;
        }
      }
      if (e.key === 'Escape') {
        s.setCommandPaletteOpen(false);
        s.setQuickOpenOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const commands = useMemo<CommandItem[]>(() => {
    const activeGroup = ide.groups.find((g) => g.id === ide.activeGroupId);
    const activeTab = activeGroup?.tabs.find((t) => t.id === activeGroup.activeTabId);

    return [
      { id: 'quick-open', title: 'Go to File', category: 'File', shortcut: 'Ctrl+P', action: () => ide.setQuickOpenOpen(true) },
      { id: 'save', title: 'Save', category: 'File', shortcut: 'Ctrl+S', action: () => activeTab && ide.saveTab(activeGroup!.id, activeTab.id) },
      { id: 'save-all', title: 'Save All', category: 'File', shortcut: 'Ctrl+Shift+S', action: () => ide.saveAll() },
      { id: 'close-editor', title: 'Close Editor', category: 'File', shortcut: 'Ctrl+W', action: () => activeTab && ide.closeTab(activeGroup!.id, activeTab.id) },
      { id: 'reopen-editor', title: 'Reopen Closed Editor', category: 'File', action: () => ide.reopenClosedTab() },
      { id: 'find', title: 'Find', category: 'Edit', shortcut: 'Ctrl+F', action: () => { ide.setPanel('search'); if (!ide.sidebarOpen) ide.toggleSidebar(); } },
      { id: 'replace', title: 'Replace', category: 'Edit', shortcut: 'Ctrl+H', action: () => { ide.setPanel('search'); if (!ide.sidebarOpen) ide.toggleSidebar(); } },
      { id: 'format-doc', title: 'Format Document', category: 'Edit', action: () => ide.showToast('Format document') },
      { id: 'rename-symbol', title: 'Rename Symbol', category: 'Edit', action: () => ide.showToast('Rename symbol') },
      { id: 'go-to-def', title: 'Go to Definition', category: 'Navigate', action: () => ide.showToast('Go to definition') },
      { id: 'command-palette', title: 'Command Palette', category: 'View', shortcut: 'Ctrl+Shift+P', action: () => ide.setCommandPaletteOpen(true) },
      { id: 'toggle-sidebar', title: 'Toggle Sidebar', category: 'View', action: () => ide.toggleSidebar() },
      { id: 'toggle-terminal', title: 'Toggle Terminal', category: 'View', shortcut: 'Ctrl+`', action: () => ide.bottomPanelOpen && ide.bottomPanel === 'terminal' ? ide.setBottomPanel(null) : ide.setBottomPanel('terminal') },
      { id: 'toggle-problems', title: 'Toggle Problems', category: 'View', action: () => ide.bottomPanelOpen && ide.bottomPanel === 'problems' ? ide.setBottomPanel(null) : ide.setBottomPanel('problems') },
      { id: 'open-terminal', title: 'Open Terminal', category: 'Terminal', action: () => ide.setBottomPanel('terminal') },
      { id: 'run-task', title: 'Run Task', category: 'Tasks', action: () => { ide.setPanel('tasks'); if (!ide.sidebarOpen) ide.toggleSidebar(); } },
      { id: 'build', title: 'Build Project', category: 'Build', action: () => ide.setBottomPanel('build') },
      { id: 'run', title: 'Run Project', category: 'Run', action: () => { ide.runTerminalCommand('run'); ide.setBottomPanel('terminal'); } },
      { id: 'git-commit', title: 'Git: Commit', category: 'Git', action: () => { ide.setPanel('git'); if (!ide.sidebarOpen) ide.toggleSidebar(); } },
      { id: 'git-push', title: 'Git: Push', category: 'Git', action: () => { if (providers.git.isAvailable) { providers.git.push().catch(() => ide.showToast('Push failed')); } else { ide.showToast('Git runtime unavailable'); } } },
      { id: 'git-pull', title: 'Git: Pull', category: 'Git', action: () => { if (providers.git.isAvailable) { providers.git.pull().catch(() => ide.showToast('Pull failed')); } else { ide.showToast('Git runtime unavailable'); } } },
      { id: 'install-ext', title: 'Install Extension', category: 'Extensions', action: () => { ide.setPanel('extensions'); if (!ide.sidebarOpen) ide.toggleSidebar(); } },
      { id: 'change-theme', title: 'Change Theme', category: 'Preferences', action: () => setSettingsOpen(true) },
      { id: 'open-settings', title: 'Open Settings', category: 'Preferences', action: () => setSettingsOpen(true) },
      { id: 'split-editor', title: 'Split Editor', category: 'View', action: () => activeGroup && ide.splitEditor(activeGroup.id, 'horizontal') },
      { id: 'new-file', title: 'New File', category: 'File', action: () => ide.newFile() },
      { id: 'new-folder', title: 'New Folder', category: 'File', action: () => ide.newFolder() },
      { id: 'toggle-explorer', title: 'Toggle Explorer', category: 'View', action: () => { ide.setPanel('explorer'); ide.toggleSidebar(); } },
      { id: 'export-json', title: 'Export Workspace (JSON)', category: 'Backup', action: () => {
        projectManager.exportAsJson();
        ide.showToast('Workspace exported as JSON');
      }},
      { id: 'export-zip', title: 'Export as ZIP', category: 'Backup', action: () => {
        projectManager.exportAsZip();
        ide.showToast('Workspace exported as ZIP');
      }},
      { id: 'import-folder', title: 'Import Folder', category: 'Import', action: async () => {
        const result = await projectManager.importProject();
        ide.refreshRoot();
        ide.showToast(result.success ? `Imported ${result.count} file(s)` : (result.reason ?? 'Import failed'));
      }},
      { id: 'import-files', title: 'Import Files', category: 'Import', action: async () => {
        const result = await projectManager.importFilesInto(vfs.getRoot().id);
        ide.refreshRoot();
        ide.showToast(result.success ? `Imported ${result.count} file(s)` : (result.reason ?? 'Import failed'));
      }},
    ];
  }, [ide.groups, ide.activeGroupId, ide.sidebarOpen, ide.bottomPanelOpen, ide.bottomPanel]);

  const theme = ide.themeColors;

  const renderSidebarPanel = () => {
    switch (ide.activePanel) {
      case 'explorer': return <FileExplorer />;
      case 'search': return <SearchPanel />;
      case 'git': return <GitPanel />;
      case 'extensions': return <ExtensionsPanel />;
      case 'tasks': return <TasksPanel />;
      case 'testing': return <TestingPanel />;
      case 'debug': return <DebugPanel />;
      case 'outline': return <OutlinePanel />;
      case 'timeline': return <TimelinePanel />;
      default: return <FileExplorer />;
    }
  };

  const renderBottomPanel = () => {
    switch (ide.bottomPanel) {
      case 'terminal': return <TerminalPanel />;
      case 'problems': return <ProblemsPanel />;
      case 'build': return <BuildPanel />;
      case 'output': return <OutputPanel />;
      default: return <TerminalPanel />;
    }
  };

  const isPhone = !ide.isTablet;

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <TopToolbar onOpenSettings={() => setSettingsOpen(true)} onOpenPalette={() => ide.setCommandPaletteOpen(true)} onOpenQuickOpen={() => ide.setQuickOpenOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <ActivityBar onOpenSettings={() => setSettingsOpen(true)} />

        {ide.sidebarOpen && (
          <div
            className={isPhone ? 'absolute inset-y-0 z-30' : 'flex-shrink-0'}
            style={{
              width: isPhone ? '240px' : '260px',
              backgroundColor: theme.sidebar,
              borderRight: `1px solid ${theme.panelBorder}`,
              left: isPhone ? '48px' : undefined,
            }}
          >
            <div className="h-full flex flex-col">
              <Suspense fallback={<PanelFallback />}>
                {renderSidebarPanel()}
              </Suspense>
            </div>
          </div>
        )}

        {isPhone && ide.sidebarOpen && (
          <div
            className="fixed inset-0 z-20"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            onClick={() => ide.toggleSidebar()}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {ide.settings.breadcrumb && <Breadcrumb />}

          <div className="flex-1 overflow-hidden">
            <EditorArea />
          </div>

          {ide.bottomPanelOpen && ide.bottomPanel && (
            <div
              className="flex-shrink-0 flex flex-col"
              style={{
                height: '220px',
                borderTop: `1px solid ${theme.panelBorder}`,
                backgroundColor: theme.terminal.bg,
              }}
            >
              <BottomPanelTabs />
              <div className="flex-1 overflow-hidden">
                <Suspense fallback={<PanelFallback />}>
                  {renderBottomPanel()}
                </Suspense>
              </div>
            </div>
          )}
        </div>
      </div>

      <KeyboardBar />
      <StatusBar />

      {ide.toastMsg && (
        <div
          className="fixed bottom-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 text-xs"
          style={{ backgroundColor: theme.backgroundActive, color: theme.text, border: `1px solid ${theme.panelBorder}` }}
        >
          {ide.toastMsg}
        </div>
      )}

      {ide.commandPaletteOpen && <CommandPalette commands={commands} />}
      {ide.quickOpenOpen && <QuickOpen />}

      {settingsOpen && (
        <Suspense fallback={<PanelFallback />}>
          <SettingsPanel onClose={() => setSettingsOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}

function TopToolbar({ onOpenSettings, onOpenPalette, onOpenQuickOpen }: { onOpenSettings: () => void; onOpenPalette: () => void; onOpenQuickOpen: () => void }) {
  const ide = useIDE.useShallow((s) => ({
    themeColors: s.themeColors,
    groups: s.groups,
    activeGroupId: s.activeGroupId,
  }));
  const theme = ide.themeColors;
  const activeGroup = ide.groups.find((g) => g.id === ide.activeGroupId);
  const activeTab = activeGroup?.tabs.find((t) => t.id === activeGroup.activeTabId);

  const save = useIDE.getState().saveTab;

  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 flex-shrink-0 border-b"
      style={{ backgroundColor: theme.backgroundAlt, borderColor: theme.panelBorder }}
    >
      <div className="flex items-center gap-3">
        <button
          className="flex items-center justify-center rounded transition-colors"
          style={{ color: theme.text }}
          onClick={() => useIDE.getState().toggleSidebar()}
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center justify-center rounded-md"
            style={{ width: '24px', height: '24px', backgroundColor: theme.accent }}
          >
            <FileCode size={14} color={theme.accentFg} />
          </div>
          <span className="text-sm font-semibold" style={{ color: theme.text }}>
            MobileCode Studio
          </span>
        </div>
      </div>

      <button
        className="flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-colors"
        style={{
          backgroundColor: theme.background,
          border: `1px solid ${theme.panelBorder}`,
          color: theme.textMuted,
        }}
        onClick={onOpenQuickOpen}
      >
        <Search size={13} />
        <span className="hidden sm:inline">Search files...</span>
        <kbd className="text-[9px] px-1 rounded" style={{ backgroundColor: theme.backgroundAlt }}>Ctrl+P</kbd>
      </button>

      <div className="flex items-center gap-1">
        <ToolbarBtn icon={Save} onClick={() => activeTab && save(activeGroup!.id, activeTab.id)} title="Save" theme={theme} />
        <ToolbarBtn icon={Command} onClick={onOpenPalette} title="Command Palette" theme={theme} />
        <ToolbarBtn icon={Hammer} onClick={() => useIDE.getState().setBottomPanel('build')} title="Build" theme={theme} />
        <ToolbarBtn icon={Play} onClick={() => { if (providers.run.isAvailable) { providers.run.run().catch(() => {}); } else { useIDE.getState().showToast('Run runtime unavailable'); } useIDE.getState().setBottomPanel('terminal'); }} title="Run" theme={theme} />
        <ToolbarBtn icon={SettingsIcon} onClick={onOpenSettings} title="Settings" theme={theme} />
      </div>
    </div>
  );
}

function ToolbarBtn({ icon: Icon, onClick, title, theme }: { icon: any; onClick: () => void; title: string; theme: any }) {
  return (
    <button
      className="p-1.5 rounded transition-colors"
      style={{ color: theme.textMuted }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.backgroundHover)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      onClick={onClick}
      title={title}
    >
      <Icon size={16} />
    </button>
  );
}

function Breadcrumb() {
  const ide = useIDE.useShallow((s) => ({
    themeColors: s.themeColors,
    groups: s.groups,
    activeGroupId: s.activeGroupId,
  }));
  const theme = ide.themeColors;
  const activeGroup = ide.groups.find((g) => g.id === ide.activeGroupId);
  const activeTab = activeGroup?.tabs.find((t) => t.id === activeGroup.activeTabId);

  if (!activeTab) return null;

  const parts = activeTab.path.split('/').filter(Boolean);

  return (
    <div
      className="flex items-center gap-1 px-3 py-1 text-[10px] flex-shrink-0 border-b overflow-x-auto"
      style={{ backgroundColor: theme.editorBg, borderColor: theme.panelBorder }}
    >
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1 whitespace-nowrap">
          {i > 0 && <span style={{ color: theme.textSubtle }}>›</span>}
          <span style={{ color: i === parts.length - 1 ? theme.text : theme.textMuted }}>{part}</span>
        </span>
      ))}
    </div>
  );
}

function BottomPanelTabs() {
  const ide = useIDE.useShallow((s) => ({
    themeColors: s.themeColors,
    bottomPanel: s.bottomPanel,
  }));
  const theme = ide.themeColors;
  const tabs: { id: 'terminal' | 'problems' | 'output' | 'build' | 'debug-console'; label: string }[] = [
    { id: 'terminal', label: 'Terminal' },
    { id: 'problems', label: 'Problems' },
    { id: 'output', label: 'Output' },
    { id: 'build', label: 'Build' },
    { id: 'debug-console', label: 'Debug Console' },
  ];

  return (
    <div
      className="flex items-center justify-between border-b flex-shrink-0"
      style={{ borderColor: theme.panelBorder, backgroundColor: theme.backgroundAlt }}
    >
      <div className="flex items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className="px-3 py-1.5 text-[10px] transition-colors"
            style={{
              color: ide.bottomPanel === tab.id ? theme.text : theme.textMuted,
              borderBottom: ide.bottomPanel === tab.id ? `2px solid ${theme.accent}` : '2px solid transparent',
            }}
            onClick={() => useIDE.getState().setBottomPanel(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <button
        className="p-1 mr-1 rounded transition-colors"
        style={{ color: theme.textMuted }}
        onClick={() => useIDE.getState().setBottomPanel(null)}
      >
        <PanelBottomClose size={14} />
      </button>
    </div>
  );
}

export default App;
