import type { FileNode } from '@/types';

const STORAGE_KEY = 'mobilecode-vfs';
const DB_NAME = 'mobilecode-db';
const STORE_NAME = 'kv';
const DB_VERSION = 1;

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function now(): number {
  return Date.now();
}

// ── IndexedDB key-value helpers ────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result as string) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

// ── Default workspace ──────────────────────────────────────

export function createDefaultWorkspace(): FileNode {
  const root: FileNode = {
    id: uid(),
    name: 'my-project',
    path: '/',
    type: 'folder',
    parentId: null,
    isOpen: true,
    createdAt: now(),
    updatedAt: now(),
    children: [],
  };

  const src = createFolder('src', '/src', root.id);
  const components = createFolder('components', '/src/components', src.id);
  const utils = createFolder('utils', '/src/utils', src.id);
  src.children = [components, utils];

  const readme = createFile(
    'README.md',
    '/README.md',
    root.id,
    `# my-project\n\nA starter project for MobileCode Studio.\n\n## Getting Started\n\nOpen a file from the explorer to begin editing.\n\n## Features\n\n- Syntax highlighting\n- Multi-cursor editing\n- Integrated search\n- Source control\n- Terminal\n\nTap the command palette icon to discover commands.\n`,
  );

  const appJs = createFile(
    'app.js',
    '/src/app.js',
    src.id,
    `// Entry point\nfunction main() {\n  const message = "Hello from MobileCode Studio";\n  console.log(message);\n  return message;\n}\n\nmain();\n`,
  );

  const componentJs = createFile(
    'Button.js',
    '/src/components/Button.js',
    components.id,
    `class Button {\n  constructor(label) {\n    this.label = label;\n  }\n\n  render() {\n    return \`<button>\${this.label}</button>\`;\n  }\n}\n\nexport default Button;\n`,
  );

  const utilJs = createFile(
    'format.js',
    '/src/utils/format.js',
    utils.id,
    `export function formatDate(date) {\n  return new Intl.DateTimeFormat('en-US').format(date);\n}\n\nexport function capitalize(str) {\n  return str.charAt(0).toUpperCase() + str.slice(1);\n}\n`,
  );

  const stylesCss = createFile(
    'styles.css',
    '/src/styles.css',
    src.id,
    `:root {\n  --primary: #3b82f6;\n  --bg: #1e1e1e;\n}\n\nbody {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n  background: var(--bg);\n  color: #e5e7eb;\n}\n\n.container {\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 16px;\n}\n`,
  );

  const config = createFile(
    'package.json',
    '/package.json',
    root.id,
    JSON.stringify(
      {
        name: 'my-project',
        version: '1.0.0',
        description: 'A starter project',
        main: 'src/app.js',
        scripts: {
          start: 'node src/app.js',
          build: 'echo Building...',
          test: 'echo Testing...',
        },
      },
      null,
      2,
    ),
  );

  root.children = [src, readme, stylesCss, config];
  src.children = [components, utils, appJs];

  return root;
}

function createFolder(name: string, path: string, parentId: string): FileNode {
  return {
    id: uid(),
    name,
    path,
    type: 'folder',
    parentId,
    isOpen: false,
    createdAt: now(),
    updatedAt: now(),
    children: [],
  };
}

function createFile(
  name: string,
  path: string,
  parentId: string,
  content = '',
): FileNode {
  return {
    id: uid(),
    name,
    path,
    type: 'file',
    parentId,
    content,
    createdAt: now(),
    updatedAt: now(),
  };
}

// ── Workspace session persistence (open tabs) ──────────────

const SESSION_KEY = 'mobilecode-session';

interface WorkspaceSession {
  openTabs: string[];
  activeTabPath: string | null;
}

function loadSession(): WorkspaceSession | null {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (data) return JSON.parse(data);
  } catch {
    // ignore
  }
  return null;
}

function saveSession(session: WorkspaceSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

// ── Virtual File System ────────────────────────────────────

export class VirtualFileSystem {
  private root!: FileNode;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Synchronous init from localStorage cache; IndexedDB upgrades async
    let loaded = false;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.root = JSON.parse(data);
        loaded = true;
      }
    } catch {
      // ignore
    }
    if (!loaded) {
      this.root = createDefaultWorkspace();
      this.saveNow();
    }

    // Async: try loading from IndexedDB (more authoritative for large workspaces)
    this.loadFromIDB();
  }

  private async loadFromIDB(): Promise<void> {
    const data = await idbGet(STORAGE_KEY);
    if (data) {
      try {
        this.root = JSON.parse(data);
        // Notify any listeners that the root has changed
        this.notifyRootChange();
      } catch {
        // ignore
      }
    } else {
      // No IndexedDB data yet — persist the current root
      await idbSet(STORAGE_KEY, JSON.stringify(this.root));
    }
  }

  private rootListeners = new Set<() => void>();

  onRootChange(fn: () => void): () => void {
    this.rootListeners.add(fn);
    return () => this.rootListeners.delete(fn);
  }

  private notifyRootChange() {
    this.rootListeners.forEach((fn) => fn());
  }

  private saveNow(root: FileNode = this.root) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
    } catch {
      // localStorage full — rely on IndexedDB only
    }
    idbSet(STORAGE_KEY, JSON.stringify(root));
  }

  private save(root: FileNode = this.root) {
    // Debounced save to IndexedDB + localStorage
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveNow(root), 100);
  }

  getRoot(): FileNode {
    return this.root;
  }

  getNodeByPath(path: string, root: FileNode = this.root): FileNode | null {
    if (root.path === path) return root;
    if (root.children) {
      for (const child of root.children) {
        const found = this.getNodeByPath(path, child);
        if (found) return found;
      }
    }
    return null;
  }

  getNodeById(id: string, root: FileNode = this.root): FileNode | null {
    if (root.id === id) return root;
    if (root.children) {
      for (const child of root.children) {
        const found = this.getNodeById(id, child);
        if (found) return found;
      }
    }
    return null;
  }

  getParent(id: string): FileNode | null {
    const node = this.getNodeById(id);
    if (!node || !node.parentId) return null;
    return this.getNodeById(node.parentId);
  }

  createNode(parentId: string, name: string, type: 'file' | 'folder'): FileNode | null {
    const parent = this.getNodeById(parentId);
    if (!parent || parent.type !== 'folder') return null;
    const basePath = parent.path === '/' ? `/${name}` : `${parent.path}/${name}`;
    if (parent.children?.some((c) => c.name === name)) return null;
    const node = createFile(name, basePath, parent.id);
    node.type = type;
    if (type === 'folder') {
      node.children = [];
      node.content = undefined;
      node.isOpen = false;
    }
    if (!parent.children) parent.children = [];
    parent.children.push(node);
    parent.updatedAt = now();
    parent.isOpen = true;
    this.save();
    return node;
  }

  renameNode(id: string, newName: string): boolean {
    const node = this.getNodeById(id);
    if (!node) return false;
    const parent = this.getParent(id);
    if (parent?.children?.some((c) => c.name === newName && c.id !== id))
      return false;
    node.name = newName;
    node.updatedAt = now();
    if (parent) {
      node.path =
        parent.path === '/' ? `/${newName}` : `${parent.path}/${newName}`;
    }
    this.updateChildPaths(node);
    this.save();
    return true;
  }

  private updateChildPaths(node: FileNode) {
    if (node.children) {
      for (const child of node.children) {
        child.path =
          node.path === '/' ? `/${child.name}` : `${node.path}/${child.name}`;
        this.updateChildPaths(child);
      }
    }
  }

  deleteNode(id: string): boolean {
    const node = this.getNodeById(id);
    if (!node) return false;
    const parent = this.getParent(id);
    if (!parent || !parent.children) return false;
    parent.children = parent.children.filter((c) => c.id !== id);
    parent.updatedAt = now();
    this.save();
    return true;
  }

  moveNode(id: string, targetId: string): boolean {
    const node = this.getNodeById(id);
    const target = this.getNodeById(targetId);
    if (!node || !target || target.type !== 'folder') return false;
    if (id === targetId) return false;
    if (this.isAncestor(id, targetId)) return false;
    const parent = this.getParent(id);
    if (!parent?.children) return false;
    parent.children = parent.children.filter((c) => c.id !== id);
    if (!target.children) target.children = [];
    target.children.push(node);
    node.parentId = target.id;
    node.path =
      target.path === '/' ? `/${node.name}` : `${target.path}/${node.name}`;
    this.updateChildPaths(node);
    target.isOpen = true;
    target.updatedAt = now();
    this.save();
    return true;
  }

  private isAncestor(ancestorId: string, descendantId: string): boolean {
    const ancestor = this.getNodeById(ancestorId);
    if (!ancestor?.children) return false;
    for (const child of ancestor.children) {
      if (child.id === descendantId) return true;
      if (this.isAncestor(child.id, descendantId)) return true;
    }
    return false;
  }

  duplicateNode(id: string): FileNode | null {
    const node = this.getNodeById(id);
    const parent = this.getParent(id);
    if (!node || !parent?.children) return null;
    const copy = this.deepClone(node, parent.id);
    copy.name = `${node.name} copy`;
    copy.path =
      parent.path === '/' ? `/${copy.name}` : `${parent.path}/${copy.name}`;
    this.updateChildPaths(copy);
    parent.children.push(copy);
    parent.updatedAt = now();
    this.save();
    return copy;
  }

  private deepClone(node: FileNode, newParentId: string): FileNode {
    const clone: FileNode = {
      ...node,
      id: uid(),
      parentId: newParentId,
      createdAt: now(),
      updatedAt: now(),
      children: undefined,
    };
    if (node.children) {
      clone.children = node.children.map((c) => this.deepClone(c, clone.id));
    }
    return clone;
  }

  toggleFolder(id: string) {
    const node = this.getNodeById(id);
    if (node && node.type === 'folder') {
      node.isOpen = !node.isOpen;
      this.save();
    }
  }

  writeFile(path: string, content: string) {
    const node = this.getNodeByPath(path);
    if (node && node.type === 'file') {
      node.content = content;
      node.updatedAt = now();
      this.save();
    }
  }

  readFile(path: string): string | null {
    const node = this.getNodeByPath(path);
    if (node && node.type === 'file') return node.content ?? '';
    return null;
  }

  saveContent(id: string, content: string) {
    const node = this.getNodeById(id);
    if (node && node.type === 'file') {
      node.content = content;
      node.updatedAt = now();
      this.save();
    }
  }

  getAllFiles(root: FileNode = this.root): FileNode[] {
    const result: FileNode[] = [];
    if (root.type === 'file') result.push(root);
    if (root.children) {
      for (const child of root.children) {
        result.push(...this.getAllFiles(child));
      }
    }
    return result;
  }

  exportWorkspace(): string {
    return JSON.stringify(this.root, null, 2);
  }

  importWorkspace(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      if (parsed && parsed.type === 'folder') {
        this.root = parsed;
        this.save();
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  resetWorkspace() {
    const fresh = createDefaultWorkspace();
    this.root = fresh;
    this.save();
  }

  // ── Session (open tabs) persistence ──────────────────────

  getSession(): WorkspaceSession | null {
    return loadSession();
  }

  saveSessionState(openTabs: string[], activeTabPath: string | null): void {
    saveSession({ openTabs, activeTabPath });
  }
}

export const vfs = new VirtualFileSystem();
