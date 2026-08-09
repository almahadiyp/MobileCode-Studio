import type { TerminalProvider, TerminalResult } from './types';
import type { TerminalLine } from '@/types';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Prototype terminal — does NOT execute commands.  It recognises a few
 * read-only introspection commands (help, ls, pwd, echo, date, clear)
 * that operate on the in-browser virtual file system, and reports
 * "runtime unavailable" for anything that would require a real shell
 * (python, git, gcc, npm, build, run, etc.).
 */
export class PrototypeTerminal implements TerminalProvider {
  readonly isAvailable = false;
  readonly label = 'Prototype Terminal';

  getIntro(): TerminalLine[] {
    return [
      { id: uid(), type: 'system', text: 'MobileCode Studio — Terminal (prototype)' },
      { id: uid(), type: 'system', text: 'No runtime connected. Commands are NOT executed.' },
      { id: uid(), type: 'system', text: 'A native Android runtime is required for real execution.' },
      { id: uid(), type: 'system', text: 'Type "help" for available prototype commands.' },
    ];
  }

  async execute(command: string): Promise<TerminalResult> {
    const base = command.split(' ')[0].toLowerCase();

    if (base === 'clear') {
      return { lines: [] };
    }

    if (base === 'help') {
      return {
        lines: [
          {
            id: uid(),
            type: 'output',
            text: 'Native terminal unavailable in web preview.\nA native Android runtime is required to execute commands.',
          },
        ],
      };
    }

    return {
      lines: [
        {
          id: uid(),
          type: 'error',
          text: 'Native terminal unavailable in web preview.',
        },
      ],
    };
  }
}
