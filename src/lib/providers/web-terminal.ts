import type { TerminalSessionProvider, TerminalSession, TerminalSessionOptions } from './types';

// Web terminal session — no native terminal is available.
// Does NOT simulate command results.

export class WebTerminalSession implements TerminalSession {
  readonly id: string;
  private outputCbs = new Set<(data: string) => void>();
  private exitCbs = new Set<(code: number) => void>();
  private notified = false;

  constructor(id: string, _options?: TerminalSessionOptions) {
    this.id = id;
  }

  write(_data: string): void {
    if (!this.notified) {
      this.notified = true;
      for (const cb of this.outputCbs) {
        cb('Native terminal unavailable in web preview.\r\n');
      }
    }
  }

  resize(_cols: number, _rows: number): void {
    // No-op — no native terminal
  }

  close(): void {
    for (const cb of this.exitCbs) cb(0);
    this.outputCbs.clear();
    this.exitCbs.clear();
  }

  onOutput(cb: (data: string) => void): () => void {
    this.outputCbs.add(cb);
    return () => this.outputCbs.delete(cb);
  }

  onExit(cb: (code: number) => void): () => void {
    this.exitCbs.add(cb);
    return () => this.exitCbs.delete(cb);
  }
}

export class WebTerminalSessionProvider implements TerminalSessionProvider {
  readonly isAvailable = false;
  readonly label = 'Web Terminal (unavailable)';
  private counter = 0;

  createSession(options?: TerminalSessionOptions): TerminalSession {
    const id = `web-${++this.counter}`;
    return new WebTerminalSession(id, options);
  }
}

export const webTerminalSessionProvider = new WebTerminalSessionProvider();
