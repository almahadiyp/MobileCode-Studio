import { useState } from 'react';
import {
  Files, Search, GitBranch, Bug, Package, ListTodo, FlaskConical,
  List, Clock, Settings, X, Download, Check,
} from 'lucide-react';
import { useIDE } from '@/lib/store';
import type { PanelType } from '@/types';
import type { ThemeColors } from '@/lib/settings';

const PANELS: { id: PanelType; icon: any; label: string }[] = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'git', icon: GitBranch, label: 'Source Control' },
  { id: 'debug', icon: Bug, label: 'Debug' },
  { id: 'extensions', icon: Package, label: 'Extensions' },
  { id: 'tasks', icon: ListTodo, label: 'Tasks' },
  { id: 'testing', icon: FlaskConical, label: 'Testing' },
  { id: 'outline', icon: List, label: 'Outline' },
  { id: 'timeline', icon: Clock, label: 'Timeline' },
];

export function ActivityBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { themeColors, activePanel, setPanel, sidebarOpen, toggleSidebar } = useIDE.useShallow((s) => ({
    themeColors: s.themeColors,
    activePanel: s.activePanel,
    setPanel: s.setPanel,
    sidebarOpen: s.sidebarOpen,
    toggleSidebar: s.toggleSidebar,
  }));

  return (
    <div
      className="flex flex-col items-center py-2 gap-1 flex-shrink-0"
      style={{
        width: '48px',
        backgroundColor: themeColors.activityBar,
        borderRight: `1px solid ${themeColors.panelBorder}`,
      }}
    >
      {PANELS.map((panel) => {
        const Icon = panel.icon;
        const isActive = activePanel === panel.id && sidebarOpen;
        return (
          <button
            key={panel.id}
            className="p-2 rounded-lg transition-all active:scale-90"
            style={{
              color: isActive ? themeColors.accent : themeColors.textMuted,
              backgroundColor: isActive ? themeColors.backgroundHover : 'transparent',
              borderLeft: isActive ? `2px solid ${themeColors.accent}` : '2px solid transparent',
            }}
            onClick={() => {
              if (activePanel === panel.id && sidebarOpen) toggleSidebar();
              else {
                if (!sidebarOpen) toggleSidebar();
                setPanel(panel.id);
              }
            }}
            title={panel.label}
          >
            <Icon size={22} />
          </button>
        );
      })}
      <div className="flex-1" />
      <button
        className="p-2 rounded-lg transition-all active:scale-90"
        style={{
          color: themeColors.textMuted,
        }}
        onClick={onOpenSettings}
        title="Settings"
      >
        <Settings size={22} />
      </button>
    </div>
  );
}

export function StatusBar() {
  const {
    themeColors, settings, groups, activeGroupId,
    gitChanges, dirtyTabs, terminalLines,
    setBottomPanel, bottomPanel, bottomPanelOpen,
    isTablet, showToast, setPanel, sidebarOpen, toggleSidebar,
  } = useIDE.useShallow((s) => ({
    themeColors: s.themeColors,
    settings: s.settings,
    groups: s.groups,
    activeGroupId: s.activeGroupId,
    gitChanges: s.gitChanges,
    dirtyTabs: s.dirtyTabs,
    terminalLines: s.terminalLines,
    setBottomPanel: s.setBottomPanel,
    bottomPanel: s.bottomPanel,
    bottomPanelOpen: s.bottomPanelOpen,
    isTablet: s.isTablet,
    showToast: s.showToast,
    setPanel: s.setPanel,
    sidebarOpen: s.sidebarOpen,
    toggleSidebar: s.toggleSidebar,
  }));

  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const activeTab = activeGroup?.tabs.find((t) => t.id === activeGroup.activeTabId);
  const line = 1, col = 1;
  const dirtyCount = dirtyTabs.size;
  const langName = activeTab?.path.split('.').pop()?.toUpperCase() ?? 'TEXT';

  return (
    <div
      className="flex items-center justify-between px-2 py-0.5 text-[10px] flex-shrink-0"
      style={{
        backgroundColor: themeColors.accent,
        color: themeColors.accentFg,
      }}
    >
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1" onClick={() => showToast('Git: main')}>
          <GitBranch size={10} />
          main
        </button>
        {gitChanges.length > 0 && (
          <button className="flex items-center gap-1" onClick={() => { setPanel('git'); if (!sidebarOpen) toggleSidebar(); }}>
            {gitChanges.length} changes
          </button>
        )}
        {dirtyCount > 0 && (
          <span className="flex items-center gap-1">
            {dirtyCount} unsaved
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {activeTab && (
          <>
            <span>Ln {line}, Col {col}</span>
            <span>Spaces: {settings.tabSize}</span>
            <span>UTF-8</span>
            <span>{settings.useTabs ? 'Tabs' : 'Spaces'}</span>
            <span>{langName}</span>
          </>
        )}
        <button
          onClick={() => {
            if (bottomPanelOpen && bottomPanel === 'terminal') setBottomPanel(null);
            else setBottomPanel('terminal');
          }}
          className="flex items-center gap-1"
        >
          Terminal
        </button>
      </div>
    </div>
  );
}


