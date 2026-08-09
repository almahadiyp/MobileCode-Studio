import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import type { AndroidFileSystemProvider } from './android-fs';
import type { TerminalSessionProvider } from '@/lib/providers/types';
import { webFileSystemProvider } from './android-fs';
import { capacitorFileSystemProvider } from './capacitor-fs';
import { webTerminalSessionProvider } from './providers/web-terminal';

// ── Interface ──────────────────────────────────────────────
// Native bridge abstraction. On Android (Capacitor native),
// filesystem and device-info are backed by real Capacitor
// plugins. Terminal, process, Git, and build/run remain web
// stubs until a native runtime (e.g. Termux) is wired in.

export interface ProcessResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface ProcessExecutor {
  readonly isAvailable: boolean;
  exec(command: string, args: string[], options?: { cwd?: string }): Promise<ProcessResult>;
}

export interface GitOperations {
  readonly isAvailable: boolean;
  init(): Promise<void>;
  clone(url: string): Promise<void>;
  commit(message: string): Promise<void>;
  push(): Promise<void>;
  pull(): Promise<void>;
  status(): Promise<string>;
}

export interface BuildRunOperations {
  readonly isAvailable: boolean;
  build(): Promise<ProcessResult>;
  run(): Promise<ProcessResult>;
  stop(): Promise<void>;
}

export interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  manufacturer: string;
  sdkLevel: number;
}

export interface NativeBridge {
  readonly isAvailable: boolean;
  readonly platform: 'android' | 'web';
  filesystem: AndroidFileSystemProvider;
  terminal: TerminalSessionProvider;
  process: ProcessExecutor;
  git: GitOperations;
  buildRun: BuildRunOperations;
  deviceInfo: DeviceInfo;
}

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

// ── Process executor (unavailable on web and Capacitor without native runtime) ──

const webProcess: ProcessExecutor = {
  isAvailable: false,
  exec: async (_cmd, _args) => ({
    exitCode: -1,
    stdout: '',
    stderr: 'Process execution unavailable. Requires a native Android runtime (e.g. Termux).',
  }),
};

// ── Git operations (unavailable until isomorphic-git or native git is wired) ──

const webGit: GitOperations = {
  isAvailable: false,
  init: async () => {},
  clone: async () => {},
  commit: async () => {},
  push: async () => {},
  pull: async () => {},
  status: async () => '',
};

// ── Build/run (unavailable — requires Android SDK / Gradle toolchain) ──

const webBuildRun: BuildRunOperations = {
  isAvailable: false,
  build: async () => ({
    exitCode: -1,
    stdout: '',
    stderr: 'Build unavailable. Requires Android SDK / Gradle toolchain on the device.',
  }),
  run: async () => ({
    exitCode: -1,
    stdout: '',
    stderr: 'Run unavailable. Requires a native Android runtime.',
  }),
  stop: async () => {},
};

// ── Device info ────────────────────────────────────────────

async function loadDeviceInfo(): Promise<DeviceInfo> {
  if (isNative()) {
    try {
      const info = await Device.getInfo();
      return {
        platform: info.platform,
        version: info.osVersion,
        model: info.model ?? 'unknown',
        manufacturer: info.manufacturer ?? 'unknown',
        sdkLevel: 0,
      };
    } catch {
      // fall through to web defaults
    }
  }
  return {
    platform: 'web',
    version: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    model: 'web',
    manufacturer: 'web',
    sdkLevel: 0,
  };
}

// ── Bridge ─────────────────────────────────────────────────

class NativeBridgeImpl implements NativeBridge {
  readonly filesystem: AndroidFileSystemProvider;
  readonly terminal: TerminalSessionProvider;
  readonly process = webProcess;
  readonly git = webGit;
  readonly buildRun = webBuildRun;
  private _deviceInfo: DeviceInfo | null = null;

  constructor() {
    this.filesystem = isNative() ? capacitorFileSystemProvider : webFileSystemProvider;
    this.terminal = webTerminalSessionProvider;
    // Load device info asynchronously
    void this.initDeviceInfo();
  }

  private async initDeviceInfo(): Promise<void> {
    this._deviceInfo = await loadDeviceInfo();
  }

  get isAvailable(): boolean {
    return isNative();
  }

  get platform(): 'android' | 'web' {
    const native = isNative();
    return native ? 'android' : 'web';
  }

  get deviceInfo(): DeviceInfo {
    return this._deviceInfo ?? {
      platform: 'web',
      version: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      model: 'web',
      manufacturer: 'web',
      sdkLevel: 0,
    };
  }
}

export const nativeBridge: NativeBridge = new NativeBridgeImpl();
