import type { Settings, ThemeMode } from '@/types';

const STORAGE_KEY = 'mobilecode-settings';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  accentColor: '#3b82f6',
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Fira Code, Menlo, monospace',
  fontLigatures: false,
  tabSize: 2,
  useTabs: false,
  wordWrap: false,
  minimap: true,
  lineNumbers: true,
  codeFolding: true,
  autoSave: false,
  formatOnSave: false,
  autoIndent: true,
  autoCloseBrackets: true,
  autoCloseQuotes: true,
  highlightActiveLine: true,
  showWhitespace: false,
  stickyScroll: true,
  breadcrumb: true,
  hardwareKeyboard: false,
  shortcutBar: true,
  reducedMotion: false,
  highContrast: false,
  hiddenFiles: false,
  sortFilesBy: 'name',
};

const listeners = new Set<(s: Settings) => void>();
let current: Settings = loadSettings();

function loadSettings(): Settings {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function getSettings(): Settings {
  return current;
}

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  persist();
  listeners.forEach((fn) => fn(current));
}

export function resetSettings() {
  current = { ...DEFAULT_SETTINGS };
  persist();
  listeners.forEach((fn) => fn(current));
}

export function subscribeSettings(fn: (s: Settings) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export interface ThemeColors {
  name: string;
  mode: ThemeMode;
  background: string;
  backgroundAlt: string;
  backgroundHover: string;
  backgroundActive: string;
  panel: string;
  panelBorder: string;
  sidebar: string;
  activityBar: string;
  tabBar: string;
  tabActive: string;
  tabInactive: string;
  tabBorder: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentFg: string;
  accentHover: string;
  error: string;
  warning: string;
  info: string;
  success: string;
  editorBg: string;
  editorGutter: string;
  editorActiveLine: string;
  editorSelection: string;
  editorCursor: string;
  editorWhitespace: string;
  editorIndent: string;
  syntax: {
    keyword: string;
    variable: string;
    function: string;
    string: string;
    number: string;
    comment: string;
    operator: string;
    property: string;
    type: string;
    tag: string;
    attribute: string;
    punctuation: string;
    definition: string;
    constant: string;
    builtin: string;
  };
  terminal: {
    bg: string;
    fg: string;
    prompt: string;
    input: string;
    error: string;
    system: string;
  };
}

export const THEMES: Record<ThemeMode, ThemeColors> = {
  dark: {
    name: 'Dark',
    mode: 'dark',
    background: '#1e1e1e',
    backgroundAlt: '#252526',
    backgroundHover: '#2a2d2e',
    backgroundActive: '#37373d',
    panel: '#252526',
    panelBorder: '#3c3c3c',
    sidebar: '#252526',
    activityBar: '#333333',
    tabBar: '#252526',
    tabActive: '#1e1e1e',
    tabInactive: '#2d2d2d',
    tabBorder: '#252526',
    text: '#d4d4d4',
    textMuted: '#858585',
    textSubtle: '#6a6a6a',
    accent: '#3b82f6',
    accentFg: '#ffffff',
    accentHover: '#2563eb',
    error: '#f87171',
    warning: '#fbbf24',
    info: '#60a5fa',
    success: '#4ade80',
    editorBg: '#1e1e1e',
    editorGutter: '#1e1e1e',
    editorActiveLine: '#2a2d2e',
    editorSelection: '#264f78',
    editorCursor: '#aeafad',
    editorWhitespace: '#404040',
    editorIndent: '#404040',
    syntax: {
      keyword: '#c586c0',
      variable: '#9cdcfe',
      function: '#dcdcaa',
      string: '#ce9178',
      number: '#b5cea8',
      comment: '#6a9955',
      operator: '#d4d4d4',
      property: '#9cdcfe',
      type: '#4ec9b0',
      tag: '#569cd6',
      attribute: '#9cdcfe',
      punctuation: '#d4d4d4',
      definition: '#9cdcfe',
      constant: '#4fc1ff',
      builtin: '#4ec9b0',
    },
    terminal: {
      bg: '#1e1e1e',
      fg: '#d4d4d4',
      prompt: '#4ade80',
      input: '#60a5fa',
      error: '#f87171',
      system: '#858585',
    },
  },
  light: {
    name: 'Light',
    mode: 'light',
    background: '#ffffff',
    backgroundAlt: '#f3f3f3',
    backgroundHover: '#e8e8e8',
    backgroundActive: '#d4d4d4',
    panel: '#f3f3f3',
    panelBorder: '#d4d4d4',
    sidebar: '#f3f3f3',
    activityBar: '#2c2c2c',
    tabBar: '#ececec',
    tabActive: '#ffffff',
    tabInactive: '#ececec',
    tabBorder: '#ececec',
    text: '#333333',
    textMuted: '#6a6a6a',
    textSubtle: '#999999',
    accent: '#007acc',
    accentFg: '#ffffff',
    accentHover: '#0062a3',
    error: '#d32f2f',
    warning: '#e65100',
    info: '#0288d1',
    success: '#388e3c',
    editorBg: '#ffffff',
    editorGutter: '#ffffff',
    editorActiveLine: '#eaf0f5',
    editorSelection: '#add6ff',
    editorCursor: '#333333',
    editorWhitespace: '#c0c0c0',
    editorIndent: '#d4d4d4',
    syntax: {
      keyword: '#0000ff',
      variable: '#001080',
      function: '#795e26',
      string: '#a31515',
      number: '#098658',
      comment: '#008000',
      operator: '#000000',
      property: '#001080',
      type: '#267f99',
      tag: '#800000',
      attribute: '#ff0000',
      punctuation: '#000000',
      definition: '#001080',
      constant: '#0070c1',
      builtin: '#267f99',
    },
    terminal: {
      bg: '#ffffff',
      fg: '#333333',
      prompt: '#388e3c',
      input: '#0288d1',
      error: '#d32f2f',
      system: '#6a6a6a',
    },
  },
  amoled: {
    name: 'AMOLED',
    mode: 'amoled',
    background: '#000000',
    backgroundAlt: '#0a0a0a',
    backgroundHover: '#1a1a1a',
    backgroundActive: '#2a2a2a',
    panel: '#0a0a0a',
    panelBorder: '#1a1a1a',
    sidebar: '#000000',
    activityBar: '#0a0a0a',
    tabBar: '#0a0a0a',
    tabActive: '#000000',
    tabInactive: '#0d0d0d',
    tabBorder: '#0a0a0a',
    text: '#e0e0e0',
    textMuted: '#808080',
    textSubtle: '#505050',
    accent: '#3b82f6',
    accentFg: '#ffffff',
    accentHover: '#2563eb',
    error: '#f87171',
    warning: '#fbbf24',
    info: '#60a5fa',
    success: '#4ade80',
    editorBg: '#000000',
    editorGutter: '#000000',
    editorActiveLine: '#111111',
    editorSelection: '#1e3a5f',
    editorCursor: '#e0e0e0',
    editorWhitespace: '#222222',
    editorIndent: '#1a1a1a',
    syntax: {
      keyword: '#c586c0',
      variable: '#9cdcfe',
      function: '#dcdcaa',
      string: '#ce9178',
      number: '#b5cea8',
      comment: '#4a6a35',
      operator: '#d4d4d4',
      property: '#9cdcfe',
      type: '#4ec9b0',
      tag: '#569cd6',
      attribute: '#9cdcfe',
      punctuation: '#d4d4d4',
      definition: '#9cdcfe',
      constant: '#4fc1ff',
      builtin: '#4ec9b0',
    },
    terminal: {
      bg: '#000000',
      fg: '#e0e0e0',
      prompt: '#4ade80',
      input: '#60a5fa',
      error: '#f87171',
      system: '#808080',
    },
  },
  'high-contrast': {
    name: 'High Contrast',
    mode: 'high-contrast',
    background: '#000000',
    backgroundAlt: '#000000',
    backgroundHover: '#1a1a1a',
    backgroundActive: '#333333',
    panel: '#000000',
    panelBorder: '#ffffff',
    sidebar: '#000000',
    activityBar: '#000000',
    tabBar: '#000000',
    tabActive: '#000000',
    tabInactive: '#0a0a0a',
    tabBorder: '#ffffff',
    text: '#ffffff',
    textMuted: '#cccccc',
    textSubtle: '#999999',
    accent: '#ffff00',
    accentFg: '#000000',
    accentHover: '#e6e600',
    error: '#ff4444',
    warning: '#ffaa00',
    info: '#44aaff',
    success: '#44ff44',
    editorBg: '#000000',
    editorGutter: '#000000',
    editorActiveLine: '#1a1a1a',
    editorSelection: '#264f78',
    editorCursor: '#ffffff',
    editorWhitespace: '#666666',
    editorIndent: '#444444',
    syntax: {
      keyword: '#ff80c0',
      variable: '#aaddff',
      function: '#ffff80',
      string: '#ffaa66',
      number: '#aaff80',
      comment: '#66aa44',
      operator: '#ffffff',
      property: '#aaddff',
      type: '#66ffdd',
      tag: '#66aaff',
      attribute: '#aaddff',
      punctuation: '#ffffff',
      definition: '#aaddff',
      constant: '#80ddff',
      builtin: '#66ffdd',
    },
    terminal: {
      bg: '#000000',
      fg: '#ffffff',
      prompt: '#44ff44',
      input: '#44aaff',
      error: '#ff4444',
      system: '#cccccc',
    },
  },
};
