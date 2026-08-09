import { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  Image as ImageIcon,
  Hash,
  MoreVertical,
  FilePlus,
  FolderPlus,
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Edit3,
  Star,
  RefreshCw,
} from 'lucide-react';
import { useIDE } from '@/lib/store';
import type { FileNode } from '@/types';
import { vfs } from '@/lib/vfs';

function getFileIcon(node: FileNode) {
  if (node.type === 'folder') {
    return node.isOpen ? FolderOpen : Folder;
  }
  const ext = node.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'py':
    case 'java':
    case 'kt':
    case 'rs':
    case 'go':
    case 'cpp':
    case 'c':
    case 'cs':
    case 'php':
    case 'dart':
      return FileCode;
    case 'json':
      return FileJson;
    case 'md':
    case 'txt':
    case 'log':
      return FileText;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return ImageIcon;
    case 'yml':
    case 'yaml':
    case 'toml':
      return Hash;
    default:
      return FileIcon;
  }
}

function getFileColor(node: FileNode, isDark: boolean): string {
  if (node.type === 'folder') return isDark ? '#dcb67a' : '#b07820';
  const ext = node.name.split('.').pop()?.toLowerCase();
  const colors: Record<string, string> = isDark
    ? {
        js: '#f7df1e', ts: '#3178c6', jsx: '#61dafb', tsx: '#61dafb',
        py: '#3572A5', java: '#b07219', kt: '#A97BFF', rs: '#dea584',
        go: '#00ADD8', cpp: '#f34b7d', c: '#555555', cs: '#178600',
        php: '#4F5D95', json: '#cbcb41', md: '#555555', html: '#e34c26',
        css: '#563d7c', dart: '#00B4AB',
      }
    : {
        js: '#cca600', ts: '#2563b0', jsx: '#1a9bf0', tsx: '#1a9bf0',
        py: '#2a5a8c', java: '#8a5a14', kt: '#8a5fd4', rs: '#b07a60',
      };
  return colors[ext ?? ''] ?? (isDark ? '#d4d4d4' : '#333333');
}

interface ContextMenu {
  x: number;
  y: number;
  nodeId: string;
}

interface TreeItemProps {
  node: FileNode;
  depth: number;
}

function TreeItem({ node, depth }: TreeItemProps) {
  const {
    root,
    selectedFileId,
    openFile,
    toggleFolder,
    selectFile,
    createNode,
    renameNode,
    deleteNode,
    copyNode,
    cutNode,
    pasteNode,
    duplicateNode,
    clipboardNodeId,
    settings,
    themeColors,
  } = useIDE();

  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [creating, setCreating] = useState<{ type: 'file' | 'folder' } | null>(null);
  const [newName, setNewName] = useState('');
  const isDark = settings.theme !== 'light';
  const isSelected = selectedFileId === node.id;
  const Icon = getFileIcon(node);
  const color = getFileColor(node, isDark);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contextMenu) {
      const handler = () => setContextMenu(null);
      setTimeout(() => document.addEventListener('click', handler), 0);
      return () => document.removeEventListener('click', handler);
    }
  }, [contextMenu]);

  const handleClick = () => {
    if (renaming) return;
    selectFile(node.id);
    openFile(node);
  };

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let x = 0, y = 0;
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0];
      x = t.clientX; y = t.clientY;
    } else {
      x = e.clientX; y = e.clientY;
    }
    setContextMenu({ x, y, nodeId: node.id });
  };

  const handleLongPress = () => {
    handleContextMenu({
      preventDefault: () => {},
      stopPropagation: () => {},
      touches: [{ clientX: 0, clientY: 0 }],
    } as any);
  };

  const startLongPress = () => {
    longPressTimer.current = setTimeout(handleLongPress, 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const submitRename = () => {
    if (renameValue.trim() && renameValue !== node.name) {
      renameNode(node.id, renameValue.trim());
    }
    setRenaming(false);
  };

  const submitCreate = () => {
    if (newName.trim() && creating) {
      const parentId = node.type === 'folder' ? node.id : node.parentId;
      if (parentId) createNode(parentId, newName.trim(), creating.type);
    }
    setCreating(null);
    setNewName('');
  };

  return (
    <div ref={containerRef}>
      <div
        className="flex items-center gap-1 px-1 py-0.5 cursor-pointer select-none text-[13px] whitespace-nowrap transition-colors"
        style={{
          paddingLeft: `${depth * 12 + 4}px`,
          backgroundColor: isSelected ? themeColors.backgroundActive : 'transparent',
          color: themeColors.text,
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = themeColors.backgroundHover;
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {node.type === 'folder' ? (
          <span style={{ color: themeColors.textMuted, width: '12px', flexShrink: 0 }}>
            {node.isOpen ? '▾' : '▸'}
          </span>
        ) : (
          <span style={{ width: '12px', flexShrink: 0 }} />
        )}
        <Icon size={14} style={{ color, flexShrink: 0 }} />
        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') setRenaming(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent border outline-none text-xs px-1"
            style={{
              color: themeColors.text,
              borderColor: themeColors.accent,
              width: '80px',
            }}
          />
        ) : (
          <span className="truncate" style={{ color: themeColors.text }}>
            {node.name}
          </span>
        )}
      </div>

      {creating && (
        <div
          className="flex items-center gap-1 px-1 py-0.5"
          style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
        >
          {creating.type === 'folder' ? (
            <Folder size={14} style={{ color: themeColors.textMuted }} />
          ) : (
            <FileIcon size={14} style={{ color: themeColors.textMuted }} />
          )}
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={submitCreate}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCreate();
              if (e.key === 'Escape') { setCreating(null); setNewName(''); }
            }}
            placeholder={creating.type === 'folder' ? 'folder name' : 'file name'}
            className="bg-transparent border outline-none text-xs px-1"
            style={{
              color: themeColors.text,
              borderColor: themeColors.accent,
              width: '80px',
            }}
          />
        </div>
      )}

      {node.isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-50 rounded-lg shadow-xl py-1 min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: themeColors.panel,
            border: `1px solid ${themeColors.panelBorder}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {node.type === 'folder' && (
            <>
              <MenuItem icon={FilePlus} label="New File" color={themeColors.text} onClick={() => { setCreating({ type: 'file' }); setContextMenu(null); }} />
              <MenuItem icon={FolderPlus} label="New Folder" color={themeColors.text} onClick={() => { setCreating({ type: 'folder' }); setContextMenu(null); }} />
              <MenuDivider color={themeColors.panelBorder} />
            </>
          )}
          <MenuItem icon={Edit3} label="Rename" color={themeColors.text} onClick={() => { setRenaming(true); setRenameValue(node.name); setContextMenu(null); }} />
          <MenuItem icon={Copy} label="Copy" color={themeColors.text} onClick={() => { copyNode(node.id); setContextMenu(null); }} />
          <MenuItem icon={Scissors} label="Cut" color={themeColors.text} onClick={() => { cutNode(node.id); setContextMenu(null); }} />
          {clipboardNodeId && node.type === 'folder' && (
            <MenuItem icon={Clipboard} label="Paste" color={themeColors.text} onClick={() => { pasteNode(node.id); setContextMenu(null); }} />
          )}
          <MenuItem icon={Copy} label="Duplicate" color={themeColors.text} onClick={() => { duplicateNode(node.id); setContextMenu(null); }} />
          <MenuDivider color={themeColors.panelBorder} />
          <MenuItem icon={Trash2} label="Delete" color={themeColors.error} onClick={() => { deleteNode(node.id); setContextMenu(null); }} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: string; onClick: () => void }) {
  const { themeColors } = useIDE();
  return (
    <button
      className="flex items-center gap-2 px-3 py-1.5 text-xs w-full text-left transition-colors"
      style={{ color }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColors.backgroundHover)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      onClick={onClick}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function MenuDivider({ color }: { color: string }) {
  return <div className="my-1 h-px" style={{ backgroundColor: color }} />;
}

export function FileExplorer() {
  const { root, themeColors, refreshRoot, settings } = useIDE();
  const [search, setSearch] = useState('');

  const sortTree = (nodes: FileNode[]): FileNode[] => {
    const sorted = [...nodes].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      switch (settings.sortFilesBy) {
        case 'type':
          return a.name.split('.').pop()!.localeCompare(b.name.split('.').pop()!);
        case 'date':
          return b.updatedAt - a.updatedAt;
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return sorted.map((n) => ({
      ...n,
      children: n.children ? sortTree(n.children) : undefined,
    }));
  };

  const displayRoot = search ? filterTree(root, search) : sortTree(root.children ?? []);

  function filterTree(node: FileNode, q: string): FileNode[] {
    if (!node.children) return [];
    const results: FileNode[] = [];
    for (const child of node.children) {
      if (child.name.toLowerCase().includes(q.toLowerCase())) {
        results.push({ ...child, isOpen: true });
      }
      if (child.children) {
        const sub = filterTree(child, q);
        if (sub.length > 0) {
          results.push({ ...child, isOpen: true, children: sub });
        }
      }
    }
    return results;
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: themeColors.sidebar }}>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.textMuted }}>
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded transition-colors"
            style={{ color: themeColors.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColors.backgroundHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={() => refreshRoot()}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>
      <div className="px-2 pb-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files..."
          className="w-full text-xs px-2 py-1 rounded outline-none"
          style={{
            backgroundColor: themeColors.background,
            color: themeColors.text,
            border: `1px solid ${themeColors.panelBorder}`,
          }}
        />
      </div>
      <div className="flex-1 overflow-auto pb-2">
        {displayRoot.length === 0 ? (
          <div className="px-3 py-4 text-xs text-center" style={{ color: themeColors.textMuted }}>
            No files found
          </div>
        ) : (
          displayRoot.map((node) => <TreeItem key={node.id} node={node} depth={0} />)
        )}
      </div>
    </div>
  );
}
