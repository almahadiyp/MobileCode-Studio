import { useRef, useEffect } from 'react';
import { Pin, X, Lock, SplitSquareHorizontal, Copy } from 'lucide-react';
import { useIDE } from '@/lib/store';
import { editorManager, createEditorState } from '@/lib/editor';
import { vfs } from '@/lib/vfs';
import type { EditorGroup, EditorTab } from '@/types';

function Tab({ tab, group, isActive }: { tab: EditorTab; group: EditorGroup; isActive: boolean }) {
  const { themeColors, setActiveTab, closeTab, togglePinTab, toggleLockTab, dirtyTabs } = useIDE.useShallow((s) => ({
    themeColors: s.themeColors,
    setActiveTab: s.setActiveTab,
    closeTab: s.closeTab,
    togglePinTab: s.togglePinTab,
    toggleLockTab: s.toggleLockTab,
    dirtyTabs: s.dirtyTabs,
  }));
  const isDirty = dirtyTabs.has(tab.path);

  return (
    <div
      className="flex items-center gap-1 px-2 py-1.5 cursor-pointer whitespace-nowrap border-r transition-colors group"
      style={{
        backgroundColor: isActive ? themeColors.tabActive : themeColors.tabInactive,
        borderColor: themeColors.tabBorder,
        maxWidth: '180px',
      }}
      onClick={() => setActiveTab(group.id, tab.id)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {tab.isPinned && <Pin size={10} style={{ color: themeColors.accent, flexShrink: 0 }} />}
      <span
        className="text-xs truncate flex-1"
        style={{ color: isActive ? themeColors.text : themeColors.textMuted }}
      >
        {tab.name}
        {isDirty && <span style={{ color: themeColors.warning }}> •</span>}
      </span>
      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
        <button
          className="p-0.5 rounded hover:bg-white/10"
          onClick={(e) => { e.stopPropagation(); togglePinTab(group.id, tab.id); }}
          title="Pin tab"
        >
          <Pin size={10} style={{ color: tab.isPinned ? themeColors.accent : themeColors.textMuted }} />
        </button>
        <button
          className="p-0.5 rounded hover:bg-white/10"
          onClick={(e) => { e.stopPropagation(); toggleLockTab(group.id, tab.id); }}
          title="Lock tab"
        >
          <Lock size={10} style={{ color: tab.isLocked ? themeColors.warning : themeColors.textMuted }} />
        </button>
        {!tab.isLocked && (
          <button
            className="p-0.5 rounded hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); closeTab(group.id, tab.id); }}
            title="Close tab"
          >
            <X size={12} style={{ color: themeColors.textMuted }} />
          </button>
        )}
      </div>
    </div>
  );
}

function EditorPane({ group }: { group: EditorGroup }) {
  const { themeColors, settings, setDirty, setActiveGroup, activeGroupId, dirtyTabs, pendingScrollLine, clearPendingScroll } = useIDE.useShallow((s) => ({
    themeColors: s.themeColors,
    settings: s.settings,
    setDirty: s.setDirty,
    setActiveGroup: s.setActiveGroup,
    activeGroupId: s.activeGroupId,
    dirtyTabs: s.dirtyTabs,
    pendingScrollLine: s.pendingScrollLine,
    clearPendingScroll: s.clearPendingScroll,
  }));
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef<string | null>(null);

  const activeTab = group.tabs.find((t) => t.id === group.activeTabId);

  useEffect(() => {
    if (!activeTab || !containerRef.current) return;
    const file = vfs.getNodeByPath(activeTab.path);
    if (!file) return;

    setActiveGroup(group.id);

    // Destroy previous view for this container
    const existing = editorManager.getView(activeTab.id);
    if (existing && mountedRef.current === activeTab.id) return;

    if (existing) existing.destroy();

    const view = editorManager.createView(
      file,
      containerRef.current,
      themeColors,
      settings,
      (text) => {
        const current = vfs.readFile(activeTab.path);
        if (current !== text) {
          setDirty(activeTab.path, true);
        }
      },
    );
    mountedRef.current = activeTab.id;
    // Force a resize
    setTimeout(() => {
      if (view.dom) view.dom.style.height = '100%';
      if (pendingScrollLine !== null) {
        editorManager.scrollToLine(activeTab.id, pendingScrollLine);
        clearPendingScroll();
      }
    }, 0);
  }, [activeTab?.id, group.id]);

  // Reconfigure when theme or settings change
  useEffect(() => {
    if (!activeTab || !mountedRef.current) return;
    const file = vfs.getNodeByPath(activeTab.path);
    if (!file) return;
    const view = editorManager.getView(activeTab.id);
    if (!view) return;

    const onUpdate = (text: string) => {
      const current = vfs.readFile(activeTab.path);
      if (current !== text) setDirty(activeTab.path, true);
    };
    view.setState(createEditorState(file, themeColors, settings, onUpdate));
  }, [themeColors, settings.fontSize, settings.theme, settings.tabSize, settings.useTabs, settings.wordWrap, settings.lineNumbers, settings.codeFolding, settings.highlightActiveLine, settings.autoCloseBrackets, settings.showWhitespace]);

  if (!activeTab) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ backgroundColor: themeColors.editorBg, color: themeColors.textMuted }}
      >
        <div className="text-center">
          <div className="text-sm mb-1">No file open</div>
          <div className="text-xs">Tap a file in the explorer to start editing</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      style={{ backgroundColor: themeColors.editorBg }}
      onClick={() => setActiveGroup(group.id)}
    />
  );
}

export function EditorArea() {
  const { groups, activeGroupId, splitEditor, closeGroup, themeColors, dirtyTabs } = useIDE.useShallow((s) => ({
    groups: s.groups,
    activeGroupId: s.activeGroupId,
    splitEditor: s.splitEditor,
    closeGroup: s.closeGroup,
    themeColors: s.themeColors,
    dirtyTabs: s.dirtyTabs,
  }));

  if (groups.length === 1) {
    const group = groups[0];
    return (
      <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.editorBg }}>
        <TabBar group={group} />
        <EditorPane group={group} />
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ backgroundColor: themeColors.editorBg }}>
      {groups.map((group, idx) => (
        <div
          key={group.id}
          className="flex flex-col flex-1 min-w-0"
          style={{
            borderRight: idx < groups.length - 1 ? `1px solid ${themeColors.panelBorder}` : 'none',
          }}
        >
          <TabBar group={group} />
          <EditorPane group={group} />
        </div>
      ))}
    </div>
  );
}

function TabBar({ group }: { group: EditorGroup }) {
  const { themeColors, splitEditor, closeGroup, groups, activeGroupId } = useIDE.useShallow((s) => ({
    themeColors: s.themeColors,
    splitEditor: s.splitEditor,
    closeGroup: s.closeGroup,
    groups: s.groups,
    activeGroupId: s.activeGroupId,
  }));
  const activeTab = group.tabs.find((t) => t.id === group.activeTabId);

  return (
    <div
      className="flex items-center border-b overflow-x-auto"
      style={{
        backgroundColor: themeColors.tabBar,
        borderColor: themeColors.panelBorder,
      }}
    >
      <div className="flex items-center flex-1 min-w-0 overflow-x-auto">
        {group.tabs.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            group={group}
            isActive={tab.id === group.activeTabId}
          />
        ))}
      </div>
      <div className="flex items-center gap-1 px-2 flex-shrink-0">
        {activeTab && (
          <>
            <button
              className="p-1 rounded transition-colors"
              style={{ color: themeColors.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColors.backgroundHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => splitEditor(group.id, 'horizontal')}
              title="Split editor"
            >
              <SplitSquareHorizontal size={14} />
            </button>
          </>
        )}
        {groups.length > 1 && (
          <button
            className="p-1 rounded transition-colors"
            style={{ color: themeColors.textMuted }}
            onClick={() => closeGroup(group.id)}
            title="Close editor group"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
