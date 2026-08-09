export type FileNodeType = 'file' | 'folder';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: FileNodeType;
  content?: string;
  children?: FileNode[];
  parentId: string | null;
  isOpen?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface EditorTab {
  id: string;
  path: string;
  name: string;
  isPinned: boolean;
  isLocked: boolean;
  isDirty: boolean;
  view?: unknown;
}

export interface EditorGroup {
  id: string;
  tabs: EditorTab[];
  activeTabId: string | null;
  orientation: 'horizontal' | 'vertical';
}

export interface DiagnosticItem {
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface CommandItem {
  id: string;
  title: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

export interface SearchResult {
  path: string;
  name: string;
  line: number;
  column: number;
  preview: string;
  matchStart: number;
  matchEnd: number;
}

export interface GitFileChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed';
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

export interface TaskItem {
  id: string;
  name: string;
  command: string;
  type: 'build' | 'test' | 'shell' | 'run';
  status: 'idle' | 'running' | 'success' | 'failed';
  output?: string;
}

export type ThemeMode = 'dark' | 'light' | 'amoled' | 'high-contrast';

export interface Settings {
  theme: ThemeMode;
  accentColor: string;
  fontSize: number;
  fontFamily: string;
  fontLigatures: boolean;
  tabSize: number;
  useTabs: boolean;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  codeFolding: boolean;
  autoSave: boolean;
  formatOnSave: boolean;
  autoIndent: boolean;
  autoCloseBrackets: boolean;
  autoCloseQuotes: boolean;
  highlightActiveLine: boolean;
  showWhitespace: boolean;
  stickyScroll: boolean;
  breadcrumb: boolean;
  hardwareKeyboard: boolean;
  shortcutBar: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  hiddenFiles: boolean;
  sortFilesBy: 'name' | 'type' | 'size' | 'date';
}

export interface ExtensionInfo {
  id: string;
  name: string;
  publisher: string;
  description: string;
  version: string;
  installed: boolean;
  enabled: boolean;
  downloads: string;
  rating: number;
  categories: string[];
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  path: string;
  lastOpened: number;
}

export type PanelType =
  | 'explorer'
  | 'search'
  | 'git'
  | 'debug'
  | 'extensions'
  | 'tasks'
  | 'testing'
  | 'outline'
  | 'timeline';

export type BottomPanelType = 'terminal' | 'problems' | 'output' | 'debug-console' | 'build';
