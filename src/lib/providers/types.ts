import type { FileNode, GitFileChange, GitCommit, TerminalLine, DiagnosticItem } from '@/types';

// ── Terminal ──────────────────────────────────────────────

export interface TerminalResult {
  lines: TerminalLine[];
}

export interface TerminalProvider {
  readonly isAvailable: boolean;
  readonly label: string;
  execute(command: string): Promise<TerminalResult>;
  getIntro(): TerminalLine[];
}

// ── File System ────────────────────────────────────────────

export interface FileSystemProvider {
  readonly isAvailable: boolean;
  readonly label: string;
  getRoot(): FileNode;
  getNodeByPath(path: string): FileNode | null;
  getNodeById(id: string): FileNode | null;
  getParent(id: string): FileNode | null;
  createNode(parentId: string, name: string, type: 'file' | 'folder'): FileNode | null;
  renameNode(id: string, newName: string): boolean;
  deleteNode(id: string): boolean;
  moveNode(id: string, targetId: string): boolean;
  duplicateNode(id: string): FileNode | null;
  toggleFolder(id: string): void;
  writeFile(path: string, content: string): void;
  readFile(path: string): string | null;
  saveContent(id: string, content: string): void;
  getAllFiles(root?: FileNode): FileNode[];
  exportWorkspace(): string;
  importWorkspace(json: string): boolean;
  resetWorkspace(): void;
}

// ── Git ───────────────────────────────────────────────────

export interface GitProvider {
  readonly isAvailable: boolean;
  readonly label: string;
  getStatus(): Promise<GitFileChange[]>;
  getCommits(): Promise<GitCommit[]>;
  getBranches(): Promise<string[]>;
  getCurrentBranch(): Promise<string>;
  stage(paths: string[]): Promise<void>;
  unstage(paths: string[]): Promise<void>;
  commit(message: string): Promise<void>;
  push(): Promise<void>;
  pull(): Promise<void>;
  createBranch(name: string): Promise<void>;
  switchBranch(name: string): Promise<void>;
  deleteBranch(name: string): Promise<void>;
}

// ── Build ──────────────────────────────────────────────────

export interface BuildResult {
  success: boolean;
  output: string[];
  duration?: number;
}

export interface BuildProvider {
  readonly isAvailable: boolean;
  readonly label: string;
  build(): Promise<BuildResult>;
}

// ── Run ────────────────────────────────────────────────────

export interface RunProvider {
  readonly isAvailable: boolean;
  readonly label: string;
  run(): Promise<BuildResult>;
  stop(): Promise<void>;
}

// ── Debugger ───────────────────────────────────────────────

export interface DebuggerProvider {
  readonly isAvailable: boolean;
  readonly label: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  stepOver(): Promise<void>;
  stepInto(): Promise<void>;
  stepOut(): Promise<void>;
  continue(): Promise<void>;
  setBreakpoint(file: string, line: number): Promise<void>;
  removeBreakpoint(file: string, line: number): Promise<void>;
}

// ── Language Server ────────────────────────────────────────

export interface LanguageServiceProvider {
  readonly isAvailable: boolean;
  readonly label: string;
  getDiagnostics(filePath: string, content: string): Promise<DiagnosticItem[]>;
  format(filePath: string, content: string): Promise<string>;
  getCompletions(filePath: string, content: string, position: { line: number; column: number }): Promise<CompletionItem[]>;
}

export interface CompletionItem {
  label: string;
  kind: 'function' | 'variable' | 'keyword' | 'snippet' | 'type' | 'property';
  insertText: string;
  detail?: string;
}

// ── Terminal Session (session-based terminal for native integration) ──

export interface TerminalSessionOptions {
  cwd?: string;
  cols?: number;
  rows?: number;
  env?: Record<string, string>;
}

export interface TerminalSession {
  id: string;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  close(): void;
  onOutput(cb: (data: string) => void): () => void;
  onExit(cb: (code: number) => void): () => void;
}

export interface TerminalSessionProvider {
  readonly isAvailable: boolean;
  readonly label: string;
  createSession(options?: TerminalSessionOptions): TerminalSession;
}
