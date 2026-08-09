import { create } from './store-utils';
import type { FileNode, EditorTab, EditorGroup, Settings, PanelType, BottomPanelType, TerminalLine, GitFileChange, GitCommit, SearchResult } from '@/types';
import { vfs } from './vfs';
import { getSettings, updateSettings, subscribeSettings, THEMES } from './settings';
import { providers } from './providers/registry';

interface IDEState {
  root: FileNode;
  settings: Settings;
  groups: EditorGroup[];
  activeGroupId: string | null;
  activePanel: PanelType;
  bottomPanel: BottomPanelType | null;
  bottomPanelOpen: boolean;
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  quickOpenOpen: boolean;
  searchResults: SearchResult[];
  gitChanges: GitFileChange[];
  gitCommits: GitCommit[];
  terminalLines: TerminalLine[];
  selectedFileId: string | null;
  clipboardNodeId: string | null;
  clipboardCut: boolean;
  openTabs: string[];
  closedTabs: { path: string; name: string; content: string }[];
  dirtyTabs: Set<string>;
  themeColors: ReturnType<typeof getThemeColors>;
  isTablet: boolean;
  isLandscape: boolean;
  showToast: (msg: string) => void;
  toastMsg: string | null;

  // actions
  openFile: (file: FileNode) => void;
  closeTab: (groupId: string, tabId: string) => void;
  reopenClosedTab: () => void;
  setActiveTab: (groupId: string, tabId: string) => void;
  togglePinTab: (groupId: string, tabId: string) => void;
  toggleLockTab: (groupId: string, tabId: string) => void;
  saveTab: (groupId: string, tabId: string) => void;
  saveAll: () => void;
  setDirty: (path: string, dirty: boolean) => void;
  splitEditor: (groupId: string, orientation: 'horizontal' | 'vertical') => void;
  closeGroup: (groupId: string) => void;
  setActiveGroup: (groupId: string) => void;
  moveTabToGroup: (fromGroupId: string, tabId: string, toGroupId: string) => void;

  createNode: (parentId: string, name: string, type: 'file' | 'folder') => void;
  renameNode: (id: string, name: string) => void;
  deleteNode: (id: string) => void;
  toggleFolder: (id: string) => void;
  copyNode: (id: string) => void;
  cutNode: (id: string) => void;
  pasteNode: (targetId: string) => void;
  duplicateNode: (id: string) => void;
  selectFile: (id: string | null) => void;

  setPanel: (panel: PanelType) => void;
  setBottomPanel: (panel: BottomPanelType | null) => void;
  toggleBottomPanel: () => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickOpenOpen: (open: boolean) => void;

  setSearchResults: (results: SearchResult[]) => void;
  setGitChanges: (changes: GitFileChange[]) => void;
  setGitCommits: (commits: GitCommit[]) => void;
  addTerminalLine: (line: TerminalLine) => void;
  clearTerminal: () => void;
  runTerminalCommand: (cmd: string) => Promise<void>;

  updateSettings: (patch: Partial<Settings>) => void;
  refreshRoot: () => void;
  setTablet: (v: boolean) => void;
  setLandscape: (v: boolean) => void;

  openFileAtLine: (file: FileNode, line: number) => void;
  newFile: () => void;
  newFolder: () => void;
  pendingScrollLine: number | null;
  clearPendingScroll: () => void;
  restoreSession: () => void;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function getThemeColors(settings: Settings) {
  const base = THEMES[settings.theme];
  if (settings.accentColor !== '#3b82f6' && settings.accentColor !== '#007acc') {
    return {
      ...base,
      accent: settings.accentColor,
      accentHover: settings.accentColor,
    };
  }
  return base;
}

function makeTab(file: FileNode): EditorTab {
  return {
    id: file.id,
    path: file.path,
    name: file.name,
    isPinned: false,
    isLocked: false,
    isDirty: false,
  };
}

function makeGroup(tabs: EditorTab[] = [], activeTabId: string | null = null): EditorGroup {
  return {
    id: uid(),
    tabs,
    activeTabId,
    orientation: 'horizontal',
  };
}

const initialSettings = getSettings();
const initialRoot = vfs.getRoot();
const session = vfs.getSession();
let initialTabs: EditorTab[] = [];
let initialActiveTabId: string | null = null;
if (session && session.openTabs.length > 0) {
  for (const path of session.openTabs) {
    const node = vfs.getNodeByPath(path);
    if (node && node.type === 'file') {
      const tab = makeTab(node);
      initialTabs.push(tab);
      if (path === session.activeTabPath) initialActiveTabId = tab.id;
    }
  }
  if (initialTabs.length > 0 && !initialActiveTabId) initialActiveTabId = initialTabs[0].id;
}
const firstGroup = makeGroup(initialTabs.length > 0 ? initialTabs : [], initialActiveTabId);

export const useIDE = create<IDEState>((set, get) => ({
  root: initialRoot,
  settings: initialSettings,
  groups: [firstGroup],
  activeGroupId: firstGroup.id,
  activePanel: 'explorer',
  bottomPanel: null,
  bottomPanelOpen: false,
  sidebarOpen: true,
  commandPaletteOpen: false,
  quickOpenOpen: false,
  searchResults: [],
  gitChanges: [],
  gitCommits: [],
  terminalLines: providers.terminal.getIntro(),
  selectedFileId: null,
  clipboardNodeId: null,
  clipboardCut: false,
  openTabs: [],
  closedTabs: [],
  dirtyTabs: new Set(),
  themeColors: getThemeColors(initialSettings),
  isTablet: typeof window !== 'undefined' ? window.innerWidth >= 768 : false,
  isLandscape: typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false,
  toastMsg: null,
  showToast: (msg) => {
    set({ toastMsg: msg });
    setTimeout(() => set({ toastMsg: null }), 2500);
  },

  openFile: (file) => {
    if (file.type === 'folder') {
      get().toggleFolder(file.id);
      return;
    }
    const state = get();
    const activeGroup = state.groups.find((g) => g.id === state.activeGroupId);
    if (!activeGroup) return;

    const existing = activeGroup.tabs.find((t) => t.path === file.path);
    if (existing) {
      set({
        groups: state.groups.map((g) =>
          g.id === activeGroup.id ? { ...g, activeTabId: existing.id } : g,
        ),
        selectedFileId: file.id,
        openTabs: [...new Set([...state.openTabs, file.path])],
      });
      return;
    }

    const tab = makeTab(file);
    set({
      groups: state.groups.map((g) =>
        g.id === activeGroup.id
          ? { ...g, tabs: [...g.tabs, tab], activeTabId: tab.id }
          : g,
      ),
      selectedFileId: file.id,
      openTabs: [...new Set([...state.openTabs, file.path])],
    });
  },

  closeTab: (groupId, tabId) => {
    const state = get();
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) return;
    const tab = group.tabs.find((t) => t.id === tabId);
    if (tab?.isLocked) return;

    if (tab?.isDirty) {
      // preserve for recovery
      const content = vfs.readFile(tab.path) ?? '';
      set({
        closedTabs: [
          { path: tab.path, name: tab.name, content },
          ...get().closedTabs.slice(0, 10),
        ],
      });
    }

    const newTabs = group.tabs.filter((t) => t.id !== tabId);
    let newActive = group.activeTabId === tabId
      ? newTabs[newTabs.length - 1]?.id ?? null
      : group.activeTabId;
    if (!newActive && newTabs.length > 0) newActive = newTabs[0].id;

    editorManager.destroyView(tabId);

    if (newTabs.length === 0 && state.groups.length > 1) {
      set({
        groups: state.groups.filter((g) => g.id !== groupId),
        activeGroupId: state.groups.find((g) => g.id !== groupId)?.id ?? null,
      });
    } else {
      set({
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, tabs: newTabs, activeTabId: newActive } : g,
        ),
      });
    }
  },

  reopenClosedTab: () => {
    const state = get();
    const last = state.closedTabs[0];
    if (!last) return;
    const node = vfs.getNodeByPath(last.path);
    if (node) {
      get().openFile(node);
      set({ closedTabs: state.closedTabs.slice(1) });
    }
  },

  setActiveTab: (groupId, tabId) => {
    const state = get();
    set({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, activeTabId: tabId } : g,
      ),
      activeGroupId: groupId,
    });
  },

  togglePinTab: (groupId, tabId) => {
    const state = get();
    set({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              tabs: g.tabs.map((t) =>
                t.id === tabId ? { ...t, isPinned: !t.isPinned } : t,
              ),
            }
          : g,
      ),
    });
  },

  toggleLockTab: (groupId, tabId) => {
    const state = get();
    set({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              tabs: g.tabs.map((t) =>
                t.id === tabId ? { ...t, isLocked: !t.isLocked } : t,
              ),
            }
          : g,
      ),
    });
  },

  saveTab: (groupId, tabId) => {
    const state = get();
    const group = state.groups.find((g) => g.id === groupId);
    const tab = group?.tabs.find((t) => t.id === tabId);
    if (!tab) return;
    const view = editorManager.getView(tabId);
    if (view) {
      vfs.writeFile(tab.path, view.state.doc.toString());
    }
    const newDirty = new Set(state.dirtyTabs);
    newDirty.delete(tab.path);
    set({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? { ...g, tabs: g.tabs.map((t) => t.id === tabId ? { ...t, isDirty: false } : t) }
          : g,
      ),
      dirtyTabs: newDirty,
    });
    get().showToast(`Saved ${tab.name}`);
  },

  saveAll: () => {
    const state = get();
    for (const group of state.groups) {
      for (const tab of group.tabs) {
        const view = editorManager.getView(tab.id);
        if (view) {
          vfs.writeFile(tab.path, view.state.doc.toString());
        }
      }
    }
    set({
      groups: state.groups.map((g) => ({
        ...g,
        tabs: g.tabs.map((t) => ({ ...t, isDirty: false })),
      })),
      dirtyTabs: new Set(),
    });
    get().showToast('Saved all files');
  },

  setDirty: (path, dirty) => {
    const state = get();
    const newDirty = new Set(state.dirtyTabs);
    if (dirty) newDirty.add(path);
    else newDirty.delete(path);
    set({
      dirtyTabs: newDirty,
      groups: state.groups.map((g) => ({
        ...g,
        tabs: g.tabs.map((t) =>
          t.path === path ? { ...t, isDirty: dirty } : t,
        ),
      })),
    });
  },

  splitEditor: (groupId, orientation) => {
    const state = get();
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) return;
    const activeTab = group.tabs.find((t) => t.id === group.activeTabId);
    const newGroup = makeGroup(
      activeTab ? [makeTab(vfs.getNodeByPath(activeTab.path)!) ] : [],
      activeTab?.id ?? null,
    );
    newGroup.orientation = orientation;
    set({
      groups: [...state.groups, newGroup],
      activeGroupId: newGroup.id,
    });
  },

  closeGroup: (groupId) => {
    const state = get();
    if (state.groups.length <= 1) return;
    const group = state.groups.find((g) => g.id === groupId);
    group?.tabs.forEach((t) => editorManager.destroyView(t.id));
    const remaining = state.groups.filter((g) => g.id !== groupId);
    set({
      groups: remaining,
      activeGroupId: remaining[0].id,
    });
  },

  setActiveGroup: (groupId) => set({ activeGroupId: groupId }),

  moveTabToGroup: (fromGroupId, tabId, toGroupId) => {
    const state = get();
    const fromGroup = state.groups.find((g) => g.id === fromGroupId);
    const tab = fromGroup?.tabs.find((t) => t.id === tabId);
    if (!tab || !fromGroup) return;
    set({
      groups: state.groups.map((g) => {
        if (g.id === fromGroupId) {
          const newTabs = g.tabs.filter((t) => t.id !== tabId);
          return {
            ...g,
            tabs: newTabs,
            activeTabId: g.activeTabId === tabId ? newTabs[0]?.id ?? null : g.activeTabId,
          };
        }
        if (g.id === toGroupId) {
          return { ...g, tabs: [...g.tabs, tab], activeTabId: tab.id };
        }
        return g;
      }),
      activeGroupId: toGroupId,
    });
  },

  createNode: (parentId, name, type) => {
    vfs.createNode(parentId, name, type);
    get().refreshRoot();
    get().showToast(`Created ${name}`);
  },

  renameNode: (id, name) => {
    vfs.renameNode(id, name);
    get().refreshRoot();
  },

  deleteNode: (id) => {
    const node = vfs.getNodeById(id);
    vfs.deleteNode(id);
    if (node) {
      editorManager.destroyView(node.id);
    }
    get().refreshRoot();
    get().showToast(`Deleted ${node?.name ?? 'item'}`);
  },

  toggleFolder: (id) => {
    vfs.toggleFolder(id);
    get().refreshRoot();
  },

  copyNode: (id) => {
    set({ clipboardNodeId: id, clipboardCut: false });
    get().showToast('Copied');
  },

  cutNode: (id) => {
    set({ clipboardNodeId: id, clipboardCut: true });
    get().showToast('Cut');
  },

  pasteNode: (targetId) => {
    const state = get();
    if (!state.clipboardNodeId) return;
    const node = vfs.getNodeById(state.clipboardNodeId);
    if (!node) return;
    if (state.clipboardCut) {
      vfs.moveNode(state.clipboardNodeId, targetId);
      set({ clipboardNodeId: null, clipboardCut: false });
    } else {
      vfs.duplicateNode(state.clipboardNodeId);
    }
    get().refreshRoot();
  },

  duplicateNode: (id) => {
    vfs.duplicateNode(id);
    get().refreshRoot();
    get().showToast('Duplicated');
  },

  selectFile: (id) => set({ selectedFileId: id }),

  setPanel: (panel) => set({ activePanel: panel }),
  setBottomPanel: (panel) => set({ bottomPanel: panel, bottomPanelOpen: panel !== null }),
  toggleBottomPanel: () => set((s) => ({ bottomPanelOpen: !s.bottomPanelOpen })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setQuickOpenOpen: (open) => set({ quickOpenOpen: open }),

  setSearchResults: (results) => set({ searchResults: results }),
  setGitChanges: (changes) => set({ gitChanges: changes }),
  setGitCommits: (commits) => set({ gitCommits: commits }),

  addTerminalLine: (line) => set((s) => ({ terminalLines: [...s.terminalLines, line] })),
  clearTerminal: () => set({ terminalLines: [] }),

  runTerminalCommand: async (cmd) => {
    const state = get();
    state.addTerminalLine({ id: uid(), type: 'input', text: `$ ${cmd}` });
    const result = await providers.terminal.execute(cmd);
    if (result.lines.length === 0) {
      state.clearTerminal();
      return;
    }
    for (const line of result.lines) {
      state.addTerminalLine(line);
    }
  },

  updateSettings: (patch) => {
    updateSettings(patch);
    const newSettings = getSettings();
    set({ settings: newSettings, themeColors: getThemeColors(newSettings) });
  },

  refreshRoot: () => {
    set({ root: { ...vfs.getRoot() } });
  },

  setTablet: (v) => set({ isTablet: v }),
  setLandscape: (v) => set({ isLandscape: v }),

  pendingScrollLine: null,
  clearPendingScroll: () => set({ pendingScrollLine: null }),

  openFileAtLine: (file, line) => {
    get().openFile(file);
    set({ pendingScrollLine: line });
  },

  newFile: () => {
    const state = get();
    let parentId = null as string | null;
    const selected = state.selectedFileId ? vfs.getNodeById(state.selectedFileId) : null;
    if (selected) {
      parentId = selected.type === 'folder' ? selected.id : selected.parentId;
    } else {
      parentId = vfs.getRoot().id;
    }
    if (!parentId) return;
    const name = `untitled-${Date.now().toString(36).slice(-4)}.js`;
    const node = vfs.createNode(parentId, name, 'file');
    if (node) {
      get().refreshRoot();
      get().openFile(node);
      get().showToast(`Created ${name}`);
    }
  },

  newFolder: () => {
    const state = get();
    let parentId = null as string | null;
    const selected = state.selectedFileId ? vfs.getNodeById(state.selectedFileId) : null;
    if (selected) {
      parentId = selected.type === 'folder' ? selected.id : selected.parentId;
    } else {
      parentId = vfs.getRoot().id;
    }
    if (!parentId) return;
    const name = `new-folder-${Date.now().toString(36).slice(-4)}`;
    const node = vfs.createNode(parentId, name, 'folder');
    if (node) {
      get().refreshRoot();
      get().showToast(`Created ${name}`);
    }
  },

  restoreSession: () => {
    const session = vfs.getSession();
    if (!session || session.openTabs.length === 0) return;
    const state = get();
    const tabs: EditorTab[] = [];
    let activeTabId: string | null = null;
    for (const path of session.openTabs) {
      const node = vfs.getNodeByPath(path);
      if (node && node.type === 'file') {
        const tab = makeTab(node);
        tabs.push(tab);
        if (path === session.activeTabPath) activeTabId = tab.id;
      }
    }
    if (tabs.length === 0) return;
    if (!activeTabId) activeTabId = tabs[0].id;
    set({
      groups: state.groups.map((g, i) =>
        i === 0 ? { ...g, tabs, activeTabId } : g,
      ),
      openTabs: session.openTabs,
    });
  },
}));

// Subscribe to external settings changes
subscribeSettings((s) => {
  useIDE.setState({ settings: s, themeColors: getThemeColors(s) });
});

// Persist open tabs whenever groups change
let saveSessionTimer: ReturnType<typeof setTimeout> | null = null;
useIDE.subscribe(() => {
  if (saveSessionTimer) clearTimeout(saveSessionTimer);
  saveSessionTimer = setTimeout(() => {
    const state = useIDE.getState();
    const openPaths: string[] = [];
    let activePath: string | null = null;
    for (const group of state.groups) {
      for (const tab of group.tabs) {
        openPaths.push(tab.path);
      }
    }
    const activeGroup = state.groups.find((g) => g.id === state.activeGroupId);
    if (activeGroup?.activeTabId) {
      const activeTab = activeGroup.tabs.find((t) => t.id === activeGroup.activeTabId);
      if (activeTab) activePath = activeTab.path;
    }
    vfs.saveSessionState(openPaths, activePath);
  }, 200);
});

import { editorManager } from './editor';
