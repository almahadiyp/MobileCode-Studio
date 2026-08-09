import type {
  TerminalProvider,
  GitProvider,
  BuildProvider,
  RunProvider,
  DebuggerProvider,
  LanguageServiceProvider,
} from './types';
import { PrototypeTerminal } from './prototype-terminal';
import { webTerminalSessionProvider } from './web-terminal';
import type { TerminalSessionProvider } from './types';

/**
 * Dependency injection registry.  Components call `providers.terminal`,
 * `providers.git`, etc.  In the web prototype these are all "unavailable"
 * stubs that clearly report their status.  When the app is wrapped in a
 * native Android shell, each entry can be swapped for a real implementation
 * (e.g. backed by Termux, isomorphic-git, or the Android Storage Access
 * Framework) by calling `registerProvider` at boot.
 */

interface ProviderRegistry {
  terminal: TerminalProvider;
  terminalSession: TerminalSessionProvider;
  git: GitProvider;
  build: BuildProvider;
  run: RunProvider;
  debugger: DebuggerProvider;
  languageServer: LanguageServiceProvider;
}

// ── Prototype stubs ────────────────────────────────────────

const unavailable = (name: string) => ({
  isAvailable: false,
  label: `${name} (unavailable)`,
});

const prototypeTerminal: TerminalProvider = new PrototypeTerminal();

const prototypeGit: GitProvider = {
  ...unavailable('Git'),
  getStatus: async () => [],
  getCommits: async () => [],
  getBranches: async () => [],
  getCurrentBranch: async () => '',
  stage: async () => {},
  unstage: async () => {},
  commit: async () => {},
  push: async () => {},
  pull: async () => {},
  createBranch: async () => {},
  switchBranch: async () => {},
  deleteBranch: async () => {},
};

const prototypeBuild: BuildProvider = {
  ...unavailable('Build'),
  build: async () => ({ success: false, output: ['Build runtime unavailable'] }),
};

const prototypeRun: RunProvider = {
  ...unavailable('Run'),
  run: async () => ({ success: false, output: ['Run runtime unavailable'] }),
  stop: async () => {},
};

const prototypeDebugger: DebuggerProvider = {
  ...unavailable('Debugger'),
  start: async () => {},
  stop: async () => {},
  stepOver: async () => {},
  stepInto: async () => {},
  stepOut: async () => {},
  continue: async () => {},
  setBreakpoint: async () => {},
  removeBreakpoint: async () => {},
};

const prototypeLSP: LanguageServiceProvider = {
  ...unavailable('Language Server'),
  getDiagnostics: async () => [],
  format: async (filePath, content) => content,
  getCompletions: async () => [],
};

// ── Registry ───────────────────────────────────────────────

export const providers: ProviderRegistry = {
  terminal: prototypeTerminal,
  terminalSession: webTerminalSessionProvider,
  git: prototypeGit,
  build: prototypeBuild,
  run: prototypeRun,
  debugger: prototypeDebugger,
  languageServer: prototypeLSP,
};

export function registerTerminal(p: TerminalProvider) {
  providers.terminal = p;
}
export function registerGit(p: GitProvider) {
  providers.git = p;
}
export function registerBuild(p: BuildProvider) {
  providers.build = p;
}
export function registerRun(p: RunProvider) {
  providers.run = p;
}
export function registerDebugger(p: DebuggerProvider) {
  providers.debugger = p;
}
export function registerLanguageServer(p: LanguageServiceProvider) {
  providers.languageServer = p;
}
export function registerTerminalSession(p: TerminalSessionProvider) {
  providers.terminalSession = p;
}
