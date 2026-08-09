import { vfs } from './vfs';
import { createZip, type ZipEntry } from './zip';
import type { FileNode } from '@/types';

// Minimal File System Access API types (avoid depending on DOM lib availability)
interface FsDirHandle {
  name: string;
  kind: 'directory';
  values(): AsyncIterableIterator<FsHandle>;
  getDirectoryHandle(name: string): Promise<FsDirHandle>;
  getFileHandle(name: string): Promise<FsFileHandle>;
}
interface FsFileHandle {
  name: string;
  kind: 'file';
  getFile(): Promise<File>;
}
interface FsHandle {
  kind: 'file' | 'directory';
  name: string;
}

export interface ImportResult {
  success: boolean;
  reason?: string;
  count: number;
}

export class ProjectManager {
  get isDirectoryPickerSupported(): boolean {
    return typeof (globalThis as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';
  }

  // ── Export ───────────────────────────────────────────────

  exportAsZip(): void {
    const root = vfs.getRoot();
    const entries = this.collectZipEntries(root, '');
    const zipBytes = createZip(entries);
    const blob = new Blob([zipBytes], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${root.name}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportAsJson(): void {
    const blob = new Blob([vfs.exportWorkspace()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workspace.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Import ───────────────────────────────────────────────

  importFromJson(json: string): boolean {
    return vfs.importWorkspace(json);
  }

  /** Import a folder using the File System Access API or webkitdirectory fallback. */
  async importProject(): Promise<ImportResult> {
    if (this.isDirectoryPickerSupported) {
      return this.importFromDirectory();
    }
    return this.importFromDirectoryFallback();
  }

  /** Import individual files into a specific parent folder. */
  async importFilesInto(parentId: string): Promise<ImportResult> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.onchange = async () => {
        const files = Array.from(input.files ?? []);
        if (files.length === 0) {
          resolve({ success: false, reason: 'No files selected', count: 0 });
          return;
        }
        let count = 0;
        for (const file of files) {
          const content = await file.text();
          const node = vfs.createNode(parentId, file.name, 'file');
          if (node) {
            vfs.writeFile(node.path, content);
            count++;
          }
        }
        resolve({
          success: count > 0,
          reason: count === 0 ? 'Failed to import files' : undefined,
          count,
        });
      };
      input.click();
    });
  }

  // ── Internal ─────────────────────────────────────────────

  private async importFromDirectory(): Promise<ImportResult> {
    try {
      const picker = (globalThis as unknown as { showDirectoryPicker: () => Promise<FsDirHandle> }).showDirectoryPicker;
      const dirHandle = await picker();
      const root = vfs.getRoot();
      let count = 0;
      count += await this.importDirHandle(dirHandle, root.id);
      return { success: count > 0, reason: count === 0 ? 'Folder was empty' : undefined, count };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { success: false, reason: 'Import cancelled', count: 0 };
      }
      return { success: false, reason: String(err), count: 0 };
    }
  }

  private async importFromDirectoryFallback(): Promise<ImportResult> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      (input as unknown as { webkitdirectory: boolean }).webkitdirectory = true;
      input.onchange = async () => {
        const files = Array.from(input.files ?? []);
        if (files.length === 0) {
          resolve({ success: false, reason: 'No files selected', count: 0 });
          return;
        }
        const result = await this.importFromFileList(files);
        resolve({ ...result, count: files.length });
      };
      input.click();
    });
  }

  private async importDirHandle(dirHandle: FsDirHandle, parentId: string): Promise<number> {
    let count = 0;
    for await (const handle of dirHandle.values()) {
      if (handle.kind === 'directory') {
        const subDir = await dirHandle.getDirectoryHandle(handle.name);
        const node = vfs.createNode(parentId, handle.name, 'folder');
        if (node) {
          count += await this.importDirHandle(subDir, node.id);
        }
      } else {
        const fileHandle = await dirHandle.getFileHandle(handle.name);
        const file = await fileHandle.getFile();
        const content = await file.text();
        const node = vfs.createNode(parentId, handle.name, 'file');
        if (node) {
          vfs.writeFile(node.path, content);
          count++;
        }
      }
    }
    return count;
  }

  async importFromFileList(files: File[]): Promise<{ success: boolean; reason?: string }> {
    const root = vfs.getRoot();
    let imported = 0;

    for (const file of files) {
      const relPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      const parts = relPath.split('/').filter(Boolean);
      const fileParts = parts.length > 1 ? parts.slice(1) : parts;
      if (fileParts.length === 0) continue;

      let currentParentId = root.id;
      for (let i = 0; i < fileParts.length - 1; i++) {
        const dirName = fileParts[i];
        const dirPath = '/' + fileParts.slice(0, i + 1).join('/');
        let existing = vfs.getNodeByPath(dirPath);
        if (!existing) {
          existing = vfs.createNode(currentParentId, dirName, 'folder');
        }
        if (existing && existing.type === 'folder') {
          currentParentId = existing.id;
        }
      }

      const fileName = fileParts[fileParts.length - 1];
      const content = await file.text();
      const node = vfs.createNode(currentParentId, fileName, 'file');
      if (node) {
        vfs.writeFile(node.path, content);
        imported++;
      }
    }

    if (imported === 0) return { success: false, reason: 'No files were imported' };
    return { success: true };
  }

  private collectZipEntries(node: FileNode, prefix: string): ZipEntry[] {
    const entries: ZipEntry[] = [];
    if (node.children) {
      for (const child of node.children) {
        const childPath = prefix ? `${prefix}/${child.name}` : child.name;
        if (child.type === 'file') {
          entries.push({
            name: childPath,
            content: new TextEncoder().encode(child.content ?? ''),
          });
        } else if (child.type === 'folder' && child.children) {
          entries.push(...this.collectZipEntries(child, childPath));
        }
      }
    }
    return entries;
  }
}

export const projectManager = new ProjectManager();
