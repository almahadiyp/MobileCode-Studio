import { StreamLanguage } from '@codemirror/language';
import { yaml as legacyYaml } from '@codemirror/legacy-modes/mode/yaml';
import { dart as legacyDart, csharp as legacyCSharp } from '@codemirror/legacy-modes/mode/clike';
import { go as legacyGo } from '@codemirror/legacy-modes/mode/go';
import { shell as legacyShell } from '@codemirror/legacy-modes/mode/shell';

import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { markdown } from '@codemirror/lang-markdown';
import { sql } from '@codemirror/lang-sql';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { rust } from '@codemirror/lang-rust';
import { php } from '@codemirror/lang-php';
import { yaml } from '@codemirror/lang-yaml';

import type { Extension } from '@codemirror/state';
import type { FileNode } from '@/types';

export interface LanguageInfo {
  id: string;
  name: string;
  extensions: string[];
  extension: () => Extension;
  autoComplete?: string[];
}

export const LANGUAGES: LanguageInfo[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    extensions: ['js', 'mjs', 'cjs'],
    extension: () => javascript({ jsx: true }),
    autoComplete: ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'async', 'await'],
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    extensions: ['ts', 'mts', 'cts'],
    extension: () => javascript({ typescript: true, jsx: true }),
    autoComplete: ['interface', 'type', 'enum', 'namespace', 'function', 'const', 'let', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'async', 'await', 'public', 'private', 'protected', 'readonly'],
  },
  {
    id: 'javascript-jsx',
    name: 'JavaScript (JSX)',
    extensions: ['jsx'],
    extension: () => javascript({ jsx: true }),
  },
  {
    id: 'typescript-tsx',
    name: 'TypeScript (TSX)',
    extensions: ['tsx'],
    extension: () => javascript({ typescript: true, jsx: true }),
  },
  {
    id: 'python',
    name: 'Python',
    extensions: ['py', 'pyw'],
    extension: () => python(),
    autoComplete: ['def', 'class', 'import', 'from', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'return', 'yield', 'lambda', 'async', 'await', 'pass', 'break', 'continue'],
  },
  {
    id: 'html',
    name: 'HTML',
    extensions: ['html', 'htm', 'xhtml'],
    extension: () => html(),
  },
  {
    id: 'css',
    name: 'CSS',
    extensions: ['css', 'scss', 'less'],
    extension: () => css(),
  },
  {
    id: 'json',
    name: 'JSON',
    extensions: ['json', 'jsonc'],
    extension: () => json(),
  },
  {
    id: 'xml',
    name: 'XML',
    extensions: ['xml', 'svg'],
    extension: () => xml(),
  },
  {
    id: 'markdown',
    name: 'Markdown',
    extensions: ['md', 'markdown', 'mdx'],
    extension: () => markdown(),
  },
  {
    id: 'sql',
    name: 'SQL',
    extensions: ['sql'],
    extension: () => sql(),
  },
  {
    id: 'java',
    name: 'Java',
    extensions: ['java'],
    extension: () => java(),
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    extensions: ['kt', 'kts'],
    extension: () => java(),
    autoComplete: ['fun', 'val', 'var', 'class', 'object', 'interface', 'when', 'for', 'while', 'if', 'else', 'return', 'import', 'package', 'companion', 'override', 'private', 'public', 'internal'],
  },
  {
    id: 'cpp',
    name: 'C/C++',
    extensions: ['c', 'cpp', 'cc', 'cxx', 'h', 'hpp'],
    extension: () => cpp(),
  },
  {
    id: 'rust',
    name: 'Rust',
    extensions: ['rs'],
    extension: () => rust(),
  },
  {
    id: 'go',
    name: 'Go',
    extensions: ['go'],
    extension: () => StreamLanguage.define(legacyGo),
  },
  {
    id: 'php',
    name: 'PHP',
    extensions: ['php'],
    extension: () => php(),
  },
  {
    id: 'csharp',
    name: 'C#',
    extensions: ['cs', 'csx'],
    extension: () => StreamLanguage.define(legacyCSharp),
  },
  {
    id: 'yaml',
    name: 'YAML',
    extensions: ['yaml', 'yml'],
    extension: () => yaml(),
  },
  {
    id: 'dart',
    name: 'Dart',
    extensions: ['dart'],
    extension: () => StreamLanguage.define(legacyDart),
  },
  {
    id: 'shell',
    name: 'Bash/Shell',
    extensions: ['sh', 'bash', 'zsh'],
    extension: () => StreamLanguage.define(legacyShell),
  },
  {
    id: 'text',
    name: 'Plain Text',
    extensions: ['txt', 'log'],
    extension: () => [],
  },
];

const EXT_MAP: Record<string, LanguageInfo> = {};

for (const lang of LANGUAGES) {
  for (const ext of lang.extensions) {
    EXT_MAP[ext] = lang;
  }
}

export function getLanguageByFile(file: FileNode): LanguageInfo | null {
  if (file.type !== 'file') return null;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  return EXT_MAP[ext] ?? null;
}

export function getLanguageByExt(ext: string): LanguageInfo | null {
  return EXT_MAP[ext.toLowerCase()] ?? null;
}

export function getLanguageExtension(file: FileNode): Extension[] {
  const lang = getLanguageByFile(file);
  if (!lang) return [];
  return [lang.extension()];
}
