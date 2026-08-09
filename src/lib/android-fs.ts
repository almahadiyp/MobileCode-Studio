import { vfs } from './vfs';
import type { FileNode } from '@/types';

// ── Interface ──────────────────────────────────────────────
// Designed so a future native Android implementation (backed by
// SAF, Termux, or direct filesystem access) can replace the
// browser/IndexedDB fallback without changing call sites.

export interface DirEntry {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
}

export interface AndroidFileSystemProvider {
  readonly isAvailable: boolean;
  readonly label: string;
  listDirectory(path: string): Promise<DirEntry[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  createFile(path: string, content?: string): Promise<void>;
  createDirectory(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

// ── Browser/IndexedDB fallback ─────────────────────────────

export class WebFileSystemProvider implements AndroidFileSystemProvider {
  readonly isAvailable = true;
  readonly label = 'Browser IndexedDB VFS';

  async listDirectory(path: string): Promise<DirEntry[]> {
    const node = vfs.getNodeByPath(path);
    if (!node || node.type !== 'folder' || !node.children) return [];
    return node.children.map((c) => ({
      name: c.name,
      path: c.path,
      type: c.type,
      size: c.type === 'file' ? (c.content ?? '').length : undefined,
    }));
  }

  async readFile(path: string): Promise<string> {
    return vfs.readFile(path) ?? '';
  }

  async writeFile(path: string, content: string): Promise<void> {
    vfs.writeFile(path, content);
  }

  async createFile(path: string, content = ''): Promise<void> {
    const parent = this.getParentFromPath(path);
    const name = this.getBaseName(path);
    if (!parent) return;
    const node = vfs.createNode(parent.id, name, 'file');
    if (node) vfs.writeFile(node.path, content);
  }

  async createDirectory(path: string): Promise<void> {
    const parent = this.getParentFromPath(path);
    const name = this.getBaseName(path);
    if (!parent) return;
    vfs.createNode(parent.id, name, 'folder');
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const node = vfs.getNodeByPath(oldPath);
    if (!node) return;
    vfs.renameNode(node.id, this.getBaseName(newPath));
  }

  async delete(path: string): Promise<void> {
    const node = vfs.getNodeByPath(path);
    if (!node) return;
    vfs.deleteNode(node.id);
  }

  async exists(path: string): Promise<boolean> {
    return vfs.getNodeByPath(path) !== null;
  }

  private getParentFromPath(path: string): FileNode | null {
    const parts = path.split('/').filter(Boolean);
    if (parts.length <= 1) return vfs.getRoot();
    const parentPath = '/' + parts.slice(0, -1).join('/');
    return vfs.getNodeByPath(parentPath) ?? vfs.getRoot();
  }

  private getBaseName(path: string): string {
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1] ?? path;
  }
}

export const webFileSystemProvider = new WebFileSystemProvider();
