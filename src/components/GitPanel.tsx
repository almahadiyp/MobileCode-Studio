import { useState, useEffect } from 'react';
import {
  GitBranch, GitCommit, RefreshCw,
  Check, Plus, Trash2,
  ChevronDown,
  FileEdit, FilePlus, FileMinus, FileQuestion, RotateCw,
  Minus, AlertCircle,
} from 'lucide-react';
import { useIDE } from '@/lib/store';
import { providers } from '@/lib/providers/registry';
import type { GitFileChange } from '@/types';
import type { ThemeColors } from '@/lib/settings';
import { vfs } from '@/lib/vfs';

const statusIcons: Record<GitFileChange['status'], { icon: any; color: string; label: string }> = {
  modified: { icon: FileEdit, color: '#e2c34d', label: 'M' },
  added: { icon: FilePlus, color: '#73c991', label: 'A' },
  deleted: { icon: FileMinus, color: '#c73e3e', label: 'D' },
  untracked: { icon: FileQuestion, color: '#73c991', label: 'U' },
  renamed: { icon: RotateCw, color: '#69a4ff', label: 'R' },
};

export function GitPanel() {
  const { themeColors, gitChanges, gitCommits, showToast, openFile } = useIDE();
  const git = providers.git;

  const [message, setMessage] = useState('');
  const [branch, setBranch] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [showBranches, setShowBranches] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'changes' | 'commits' | 'branches'>('changes');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (git.isAvailable) {
      git.getCurrentBranch().then(setBranch).catch(() => {});
      git.getBranches().then(setBranches).catch(() => {});
    }
  }, [git.isAvailable]);

  const stageFile = (path: string) => {
    if (!git.isAvailable) { showToast('Git runtime unavailable'); return; }
    setBusy(true);
    git.stage([path])
      .then(() => setStagedFiles((prev) => new Set([...prev, path])))
      .catch(() => showToast('Stage failed'))
      .finally(() => setBusy(false));
  };

  const unstageFile = (path: string) => {
    if (!git.isAvailable) { showToast('Git runtime unavailable'); return; }
    setBusy(true);
    git.unstage([path])
      .then(() => setStagedFiles((prev) => { const n = new Set(prev); n.delete(path); return n; }))
      .catch(() => showToast('Unstage failed'))
      .finally(() => setBusy(false));
  };

  const stageAll = () => {
    if (!git.isAvailable) { showToast('Git runtime unavailable'); return; }
    setBusy(true);
    git.stage(gitChanges.map((c) => c.path))
      .then(() => setStagedFiles(new Set(gitChanges.map((c) => c.path))))
      .catch(() => showToast('Stage all failed'))
      .finally(() => setBusy(false));
  };

  const commit = () => {
    if (!git.isAvailable) { showToast('Git runtime unavailable'); return; }
    if (!message.trim()) { showToast('Commit message required'); return; }
    if (stagedFiles.size === 0) { showToast('No staged files'); return; }
    setBusy(true);
    git.commit(message)
      .then(() => { setMessage(''); setStagedFiles(new Set()); showToast('Committed'); })
      .catch(() => showToast('Commit failed'))
      .finally(() => setBusy(false));
  };

  const push = () => {
    if (!git.isAvailable) { showToast('Git runtime unavailable'); return; }
    setBusy(true);
    git.push()
      .catch(() => showToast('Push failed'))
      .finally(() => setBusy(false));
  };

  const pull = () => {
    if (!git.isAvailable) { showToast('Git runtime unavailable'); return; }
    setBusy(true);
    git.pull()
      .catch(() => showToast('Pull failed'))
      .finally(() => setBusy(false));
  };

  const createBranch = () => {
    if (!git.isAvailable) { showToast('Git runtime unavailable'); return; }
    const name = `feature/${Math.random().toString(36).slice(2, 6)}`;
    setBusy(true);
    git.createBranch(name)
      .then(() => { setBranches([...branches, name]); setBranch(name); setShowBranches(false); })
      .catch(() => showToast('Create branch failed'))
      .finally(() => setBusy(false));
  };

  const switchBranch = (b: string) => {
    if (!git.isAvailable) { showToast('Git runtime unavailable'); return; }
    setBusy(true);
    git.switchBranch(b)
      .then(() => { setBranch(b); setShowBranches(false); })
      .catch(() => showToast('Switch branch failed'))
      .finally(() => setBusy(false));
  };

  const deleteBranch = (b: string) => {
    if (!git.isAvailable) { showToast('Git runtime unavailable'); return; }
    setBusy(true);
    git.deleteBranch(b)
      .then(() => setBranches(branches.filter((x) => x !== b)))
      .catch(() => showToast('Delete branch failed'))
      .finally(() => setBusy(false));
  };

  const unstagedChanges = gitChanges.filter((c) => !stagedFiles.has(c.path));
  const stagedChanges = gitChanges.filter((c) => stagedFiles.has(c.path));

  if (!git.isAvailable) {
    return (
      <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.sidebar }}>
        <div className="px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
            Source Control
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-2">
          <AlertCircle size={24} style={{ color: themeColors.textMuted }} />
          <p className="text-xs" style={{ color: themeColors.textMuted }}>
            Git runtime unavailable
          </p>
          <p className="text-[10px]" style={{ color: themeColors.textSubtle }}>
            A native Android runtime is required for real Git operations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.sidebar }}>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
          Source Control
        </span>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded transition-colors"
            style={{ color: themeColors.textMuted }}
            onClick={() => { git.getStatus().catch(() => {}); }}
            disabled={busy}
          >
            <RefreshCw size={12} className={busy ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="px-2 pb-2 relative">
        <button
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-colors"
          style={{ backgroundColor: themeColors.background, border: `1px solid ${themeColors.panelBorder}`, color: themeColors.text }}
          onClick={() => setShowBranches(!showBranches)}
          disabled={busy}
        >
          <GitBranch size={13} style={{ color: themeColors.accent }} />
          <span className="flex-1 text-left">{branch || '—'}</span>
          <ChevronDown size={12} style={{ color: themeColors.textMuted }} />
        </button>
        {showBranches && (
          <div
            className="absolute z-10 mt-1 w-full rounded-lg shadow-xl py-1 max-h-48 overflow-auto"
            style={{ backgroundColor: themeColors.panel, border: `1px solid ${themeColors.panelBorder}` }}
          >
            {branches.map((b) => (
              <button
                key={b}
                className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-xs transition-colors"
                style={{ color: themeColors.text }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColors.backgroundHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => switchBranch(b)}
              >
                <GitBranch size={12} style={{ color: themeColors.textMuted }} />
                {b}
                {b === branch && <Check size={12} style={{ color: themeColors.accent, marginLeft: 'auto' }} />}
              </button>
            ))}
            <div className="border-t my-1" style={{ borderColor: themeColors.panelBorder }} />
            <button
              className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-xs transition-colors"
              style={{ color: themeColors.text }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColors.backgroundHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={createBranch}
            >
              <Plus size={12} style={{ color: themeColors.success }} />
              Create branch
            </button>
          </div>
        )}
      </div>

      <div className="flex px-2 gap-1 border-b" style={{ borderColor: themeColors.panelBorder }}>
        {(['changes', 'commits', 'branches'] as const).map((t) => (
          <button
            key={t}
            className="px-2 py-1 text-[10px] capitalize transition-colors rounded-t"
            style={{
              color: tab === t ? themeColors.accent : themeColors.textMuted,
              borderBottom: tab === t ? `2px solid ${themeColors.accent}` : '2px solid transparent',
            }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'changes' && (
        <>
          <div className="p-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Commit message"
              rows={2}
              className="w-full text-xs px-2 py-1.5 rounded outline-none resize-none"
              style={{ backgroundColor: themeColors.background, color: themeColors.text, border: `1px solid ${themeColors.panelBorder}` }}
            />
            <div className="flex gap-1 mt-1">
              <button
                className="flex-1 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: themeColors.accent, color: themeColors.accentFg }}
                onClick={commit}
                disabled={busy}
              >
                Commit
              </button>
              <button
                className="px-2 py-1.5 rounded text-xs transition-colors disabled:opacity-50"
                style={{ backgroundColor: themeColors.backgroundActive, color: themeColors.text }}
                onClick={push}
                disabled={busy}
                title="Push"
              >
                Push
              </button>
              <button
                className="px-2 py-1.5 rounded text-xs transition-colors disabled:opacity-50"
                style={{ backgroundColor: themeColors.backgroundActive, color: themeColors.text }}
                onClick={pull}
                disabled={busy}
                title="Pull"
              >
                Pull
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {stagedChanges.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
                    Staged ({stagedChanges.length})
                  </span>
                  <button
                    className="text-[10px]"
                    style={{ color: themeColors.textMuted }}
                    onClick={() => setStagedFiles(new Set())}
                  >
                    Unstage all
                  </button>
                </div>
                {stagedChanges.map((change) => {
                  const s = statusIcons[change.status];
                  return (
                    <GitFileRow
                      key={change.path}
                      change={change}
                      themeColors={themeColors}
                      icon={s.icon}
                      color={s.color}
                      label={s.label}
                      actionIcon={<Minus size={12} />}
                      actionTitle="Unstage"
                      onAction={() => unstageFile(change.path)}
                      onClick={() => {
                        const node = vfs.getNodeByPath(change.path);
                        if (node) openFile(node);
                      }}
                    />
                  );
                })}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
                  Changes ({unstagedChanges.length})
                </span>
                {unstagedChanges.length > 0 && (
                  <button
                    className="text-[10px]"
                    style={{ color: themeColors.textMuted }}
                    onClick={stageAll}
                  >
                    Stage all
                  </button>
                )}
              </div>
              {unstagedChanges.map((change) => {
                const s = statusIcons[change.status];
                return (
                  <GitFileRow
                    key={change.path}
                    change={change}
                    themeColors={themeColors}
                    icon={s.icon}
                    color={s.color}
                    label={s.label}
                    actionIcon={<Plus size={12} />}
                    actionTitle="Stage"
                    onAction={() => stageFile(change.path)}
                    onClick={() => {
                      const node = vfs.getNodeByPath(change.path);
                      if (node) openFile(node);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      {tab === 'commits' && (
        <div className="flex-1 overflow-auto px-2 py-1">
          {gitCommits.map((commit) => (
            <div
              key={commit.hash}
              className="flex items-start gap-2 px-2 py-2 rounded transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColors.backgroundHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <GitCommit size={14} style={{ color: themeColors.accent, marginTop: 2 }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate" style={{ color: themeColors.text }}>{commit.message}</div>
                <div className="text-[10px] flex items-center gap-2" style={{ color: themeColors.textMuted }}>
                  <span>{commit.hash}</span>
                  <span>{commit.author}</span>
                  <span>{commit.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'branches' && (
        <div className="flex-1 overflow-auto px-2 py-1">
          {branches.map((b) => (
            <div
              key={b}
              className="flex items-center gap-2 px-2 py-1.5 rounded transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColors.backgroundHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <GitBranch size={13} style={{ color: b === branch ? themeColors.accent : themeColors.textMuted }} />
              <span className="text-xs flex-1" style={{ color: themeColors.text }}>{b}</span>
              {b === branch && (
                <span className="text-[10px] px-1 rounded" style={{ backgroundColor: themeColors.accent, color: themeColors.accentFg }}>
                  current
                </span>
              )}
              <button
                className="p-0.5"
                style={{ color: themeColors.textMuted }}
                onClick={() => deleteBranch(b)}
                disabled={busy || b === branch}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GitFileRow({
  change, themeColors, icon: Icon, color, label,
  actionIcon, actionTitle, onAction, onClick,
}: {
  change: GitFileChange;
  themeColors: ThemeColors;
  icon: any;
  color: string;
  label: string;
  actionIcon: React.ReactNode;
  actionTitle: string;
  onAction: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center gap-1 px-3 py-1 cursor-pointer transition-colors"
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColors.backgroundHover)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      onClick={onClick}
    >
      <Icon size={12} style={{ color }} />
      <span className="text-xs truncate flex-1" style={{ color: themeColors.text }}>
        {change.path.split('/').pop()}
      </span>
      <span className="text-[10px] font-mono" style={{ color }}>{label}</span>
      <button
        className="p-0.5 rounded transition-colors"
        style={{ color: themeColors.textMuted }}
        onClick={(e) => { e.stopPropagation(); onAction(); }}
        title={actionTitle}
      >
        {actionIcon}
      </button>
    </div>
  );
}
