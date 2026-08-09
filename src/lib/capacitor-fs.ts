import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import type { AndroidFileSystemProvider, DirEntry } from './android-fs';

// ── Capacitor-backed filesystem ───────────────────────────
// Uses the Capacitor Filesystem plugin to store real files on
// Android internal storage (Directory.DATA) or external storage
// (Directory.EXTERNAL). Falls back gracefully if Capacitor is
// not available (web preview).

const ROOT_DIR = 'mobilecode-workspace';
const DATA_DIR = Directory.Data;

function isCapacitorAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export class CapacitorFileSystemProvider implements AndroidFileSystemProvider {
  readonly isAvailable = isCapacitorAvailable();
  readonly label = 'Android Filesystem (Capacitor)';

  private full(path: string): string {
    const clean = path.replace(/^\/+/, '');
    return clean ? `${ROOT_DIR}/${clean}` : ROOT_DIR;
  }

  async listDirectory(path: string): Promise<DirEntry[]> {
    if (!isCapacitorAvailable()) return [];
    try {
      const result = await Filesystem.readdir({
        path: this.full(path),
        directory: DATA_DIR,
      });
      return result.files.map((f) => ({
        name: f.name,
        path: path.endsWith('/') ? `${path}${f.name}` : `${path}/${f.name}`,
        type: f.type === 'directory' ? 'folder' as const : 'file' as const,
        size: f.size,
      }));
    } catch {
      return [];
    }
  }

  async readFile(path: string): Promise<string> {
    if (!isCapacitorAvailable()) return '';
    try {
      const result = await Filesystem.readFile({
        path: this.full(path),
        directory: DATA_DIR,
        encoding: Encoding.UTF8,
      });
      return typeof result.data === 'string' ? result.data : '';
    } catch {
      return '';
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!isCapacitorAvailable()) return;
    await Filesystem.writeFile({
      path: this.full(path),
      data: content,
      directory: DATA_DIR,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  }

  async createFile(path: string, content = ''): Promise<void> {
    await this.writeFile(path, content);
  }

  async createDirectory(path: string): Promise<void> {
    if (!isCapacitorAvailable()) return;
    try {
      await Filesystem.mkdir({
        path: this.full(path),
        directory: DATA_DIR,
        recursive: true,
      });
    } catch {
      // directory may already exist
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    if (!isCapacitorAvailable()) return;
    await Filesystem.rename({
      from: this.full(oldPath),
      to: this.full(newPath),
      directory: DATA_DIR,
      toDirectory: DATA_DIR,
    });
  }

  async delete(path: string): Promise<void> {
    if (!isCapacitorAvailable()) return;
    try {
      await Filesystem.rmdir({
        path: this.full(path),
        directory: DATA_DIR,
        recursive: true,
      });
    } catch {
      // might be a file
      await Filesystem.deleteFile({
        path: this.full(path),
        directory: DATA_DIR,
      });
    }
  }

  async exists(path: string): Promise<boolean> {
    if (!isCapacitorAvailable()) return false;
    try {
      await Filesystem.stat({
        path: this.full(path),
        directory: DATA_DIR,
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const capacitorFileSystemProvider = new CapacitorFileSystemProvider();
