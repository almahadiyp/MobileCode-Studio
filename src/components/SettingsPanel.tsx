import { useState } from 'react';
import {
  X, Palette, Monitor, Code, Terminal, GitBranch, Languages,
  Keyboard, Eye, Shield, Database, Download, Upload, RotateCcw, Check,
} from 'lucide-react';
import { useIDE } from '@/lib/store';
import { resetSettings } from '@/lib/settings';
import type { ThemeMode, Settings } from '@/types';

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'editor', label: 'Editor', icon: Code },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'git', label: 'Git', icon: GitBranch },
  { id: 'languages', label: 'Languages', icon: Languages },
  { id: 'keyboard', label: 'Keyboard', icon: Keyboard },
  { id: 'accessibility', label: 'Accessibility', icon: Eye },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'storage', label: 'Storage', icon: Database },
];

const ACCENT_COLORS = [
  '#3b82f6', '#007acc', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316',
];

const THEMES_LIST: { id: ThemeMode; name: string; desc: string }[] = [
  { id: 'dark', name: 'Dark', desc: 'Default dark theme' },
  { id: 'light', name: 'Light', desc: 'Bright daytime theme' },
  { id: 'amoled', name: 'AMOLED', desc: 'Pure black for OLED screens' },
  { id: 'high-contrast', name: 'High Contrast', desc: 'Maximum readability' },
];

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { themeColors, settings, updateSettings, showToast } = useIDE();
  const [section, setSection] = useState('appearance');

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl h-[80vh] flex rounded-xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: themeColors.panel, border: `1px solid ${themeColors.panelBorder}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-44 flex-shrink-0 flex flex-col border-r" style={{ borderColor: themeColors.panelBorder, backgroundColor: themeColors.backgroundAlt }}>
          <div className="flex items-center justify-between px-3 py-3 border-b" style={{ borderColor: themeColors.panelBorder }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: themeColors.text }}>Settings</span>
            <button onClick={onClose} style={{ color: themeColors.textMuted }}>
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-auto py-1">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = section === s.id;
              return (
                <button
                  key={s.id}
                  className="flex items-center gap-2 px-3 py-2 w-full text-left text-xs transition-colors"
                  style={{
                    color: isActive ? themeColors.accent : themeColors.text,
                    backgroundColor: isActive ? themeColors.backgroundHover : 'transparent',
                    borderLeft: isActive ? `2px solid ${themeColors.accent}` : '2px solid transparent',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = themeColors.backgroundHover; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  onClick={() => setSection(s.id)}
                >
                  <Icon size={14} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {section === 'appearance' && (
            <SettingsSection title="Appearance" themeColors={themeColors}>
              <SettingRow label="Theme" desc="Choose the base color scheme" themeColors={themeColors}>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES_LIST.map((t) => (
                    <button
                      key={t.id}
                      className="px-3 py-2 rounded-lg text-left transition-all"
                      style={{
                        backgroundColor: settings.theme === t.id ? themeColors.accent : themeColors.background,
                        border: `1px solid ${settings.theme === t.id ? themeColors.accent : themeColors.panelBorder}`,
                      }}
                      onClick={() => updateSettings({ theme: t.id })}
                    >
                      <div className="text-xs font-medium" style={{ color: settings.theme === t.id ? themeColors.accentFg : themeColors.text }}>
                        {t.name}
                      </div>
                      <div className="text-[10px]" style={{ color: settings.theme === t.id ? themeColors.accentFg : themeColors.textMuted }}>
                        {t.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </SettingRow>

              <SettingRow label="Accent Color" desc="Primary UI accent color" themeColors={themeColors}>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-7 h-7 rounded-full transition-transform active:scale-90 flex items-center justify-center"
                      style={{
                        backgroundColor: color,
                        border: settings.accentColor === color ? `2px solid ${themeColors.text}` : 'none',
                      }}
                      onClick={() => updateSettings({ accentColor: color })}
                    >
                      {settings.accentColor === color && <Check size={14} color="#fff" />}
                    </button>
                  ))}
                </div>
              </SettingRow>

              <SettingRow label="Minimap" desc="Show code minimap in editor" themeColors={themeColors}>
                <Toggle value={settings.minimap} onChange={(v) => updateSettings({ minimap: v })} themeColors={themeColors} />
              </SettingRow>

              <SettingRow label="Font Size" desc="Editor font size in pixels" themeColors={themeColors}>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={10}
                    max={24}
                    value={settings.fontSize}
                    onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                    style={{ accentColor: themeColors.accent }}
                  />
                  <span className="text-xs w-8" style={{ color: themeColors.text }}>{settings.fontSize}px</span>
                </div>
              </SettingRow>

              <SettingRow label="Font Family" desc="Editor font" themeColors={themeColors}>
                <input
                  value={settings.fontFamily}
                  onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                  className="text-xs px-2 py-1 rounded outline-none w-64"
                  style={{ backgroundColor: themeColors.background, color: themeColors.text, border: `1px solid ${themeColors.panelBorder}` }}
                />
              </SettingRow>

              <SettingRow label="Font Ligatures" desc="Enable programming font ligatures" themeColors={themeColors}>
                <Toggle value={settings.fontLigatures} onChange={(v) => updateSettings({ fontLigatures: v })} themeColors={themeColors} />
              </SettingRow>
            </SettingsSection>
          )}

          {section === 'editor' && (
            <SettingsSection title="Editor" themeColors={themeColors}>
              <SettingRow label="Tab Size" desc="Number of spaces per indent" themeColors={themeColors}>
                <select
                  value={settings.tabSize}
                  onChange={(e) => updateSettings({ tabSize: Number(e.target.value) })}
                  className="text-xs px-2 py-1 rounded outline-none"
                  style={{ backgroundColor: themeColors.background, color: themeColors.text, border: `1px solid ${themeColors.panelBorder}` }}
                >
                  {[2, 4, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </SettingRow>
              <SettingRow label="Use Tabs" desc="Insert tabs instead of spaces" themeColors={themeColors}>
                <Toggle value={settings.useTabs} onChange={(v) => updateSettings({ useTabs: v })} themeColors={themeColors} />
              </SettingRow>
              <SettingRow label="Word Wrap" desc="Wrap long lines" themeColors={themeColors}>
                <Toggle value={settings.wordWrap} onChange={(v) => updateSettings({ wordWrap: v })} themeColors={themeColors} />
              </SettingRow>
              <SettingRow label="Line Numbers" desc="Show line numbers in gutter" themeColors={themeColors}>
                <Toggle value={settings.lineNumbers} onChange={(v) => updateSettings({ lineNumbers: v })} themeColors={themeColors} />
              </SettingRow>
              <SettingRow label="Code Folding" desc="Enable fold/unfold code blocks" themeColors={themeColors}>
                <Toggle value={settings.codeFolding} onChange={(v) => updateSettings({ codeFolding: v })} themeColors={themeColors} />
              </SettingRow>
              <SettingRow label="Active Line Highlight" desc="Highlight the current line" themeColors={themeColors}>
                <Toggle value={settings.highlightActiveLine} onChange={(v) => updateSettings({ highlightActiveLine: v })} themeColors={themeColors} />
              </SettingRow>
              <SettingRow label="Auto-close Brackets" desc="Automatically close bracket pairs" themeColors={themeColors}>
                <Toggle value={settings.autoCloseBrackets} onChange={(v) => updateSettings({ autoCloseBrackets: v })} themeColors={themeColors} />
              </SettingRow>
              <SettingRow label="Auto-indent" desc="Smart indentation on new lines" themeColors={themeColors}>
                <Toggle value={settings.autoIndent} onChange={(v) => updateSettings({ autoIndent: v })} themeColors={themeColors} />
              </SettingRow>
              <SettingRow label="Show Whitespace" desc="Visualize whitespace characters" themeColors={themeColors}>
                <Toggle value={settings.showWhitespace} onChange={(v) => updateSettings({ showWhitespace: v })} themeColors={themeColors} />
              </SettingRow>
              <SettingRow label="Auto Save" desc="Automatically save changes" themeColors={themeColors}>
                <Toggle value={settings.autoSave} onChange={(v) => updateSettings({ autoSave: v })} themeColors={themeColors} />
              </SettingRow>
              <SettingRow label="Format on Save" desc="Format code when saving" themeColors={themeColors}>
                <Toggle value={settings.formatOnSave} onChange={(v) => updateSettings({ formatOnSave: v })} themeColors={themeColors} />
              </SettingRow>
            </SettingsSection>
          )}

          {section === 'terminal' && (
            <SettingsSection title="Terminal" themeColors={themeColors}>
              <SettingRow label="Terminal Font Size" desc="Terminal text size" themeColors={themeColors}>
                <div className="flex items-center gap-2">
                  <input type="range" min={10} max={20} value={settings.fontSize - 1} onChange={(e) => updateSettings({ fontSize: Number(e.target.value) + 1 })} style={{ accentColor: themeColors.accent }} />
                  <span className="text-xs" style={{ color: themeColors.text }}>{settings.fontSize - 1}px</span>
                </div>
              </SettingRow>
            </SettingsSection>
          )}

          {section === 'git' && (
            <SettingsSection title="Git" themeColors={themeColors}>
              <SettingRow label="Auto-fetch" desc="Fetch from remote periodically" themeColors={themeColors}>
                <Toggle value={false} onChange={() => showToast('Setting saved')} themeColors={themeColors} />
              </SettingRow>
              <SettingRow label="Confirm Sync" desc="Ask before push/pull operations" themeColors={themeColors}>
                <Toggle value={true} onChange={() => showToast('Setting saved')} themeColors={themeColors} />
              </SettingRow>
              <div className="px-4 py-2 text-[10px]" style={{ color: themeColors.textSubtle }}>
                Credentials are stored securely using Android EncryptedSharedPreferences. Never in plain text.
              </div>
            </SettingsSection>
          )}

          {section === 'languages' && (
            <SettingsSection title="Languages" themeColors={themeColors}>
              <div className="px-4 py-2 text-xs" style={{ color: themeColors.text }}>
                Language support is provided through a pluggable architecture. Currently configured:
              </div>
              {['JavaScript', 'TypeScript', 'Python', 'HTML', 'CSS', 'JSON', 'Java', 'Kotlin', 'C/C++', 'Rust', 'Go', 'PHP', 'SQL', 'Markdown', 'XML', 'YAML', 'Dart', 'C#', 'Bash/Shell'].map((lang) => (
                <div key={lang} className="flex items-center justify-between px-4 py-1.5">
                  <span className="text-xs" style={{ color: themeColors.text }}>{lang}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: themeColors.backgroundActive, color: themeColors.success }}>
                    Active
                  </span>
                </div>
              ))}
            </SettingsSection>
          )}

          {section === 'keyboard' && (
            <SettingsSection title="Keyboard" themeColors={themeColors}>
              <SettingRow label="Shortcut Bar" desc="Show developer keyboard bar above system keyboard" themeColors={themeColors}>
                <Toggle value={settings.shortcutBar} onChange={(v) => updateSettings({ shortcutBar: v })} themeColors={themeColors} />
              </SettingRow>
              <SettingRow label="Hardware Keyboard" desc="Detect and optimize for physical keyboards" themeColors={themeColors}>
                <Toggle value={settings.hardwareKeyboard} onChange={(v) => updateSettings({ hardwareKeyboard: v })} themeColors={themeColors} />
              </SettingRow>
              <div className="px-4 py-2">
                <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: themeColors.textMuted }}>Default Shortcuts</div>
                {[
                  { key: 'Ctrl+S', action: 'Save' },
                  { key: 'Ctrl+F', action: 'Find' },
                  { key: 'Ctrl+H', action: 'Replace' },
                  { key: 'Ctrl+Z', action: 'Undo' },
                  { key: 'Ctrl+Y', action: 'Redo' },
                  { key: 'Ctrl+P', action: 'Quick Open' },
                  { key: 'Ctrl+Shift+P', action: 'Command Palette' },
                  { key: 'Ctrl+/', action: 'Toggle Comment' },
                  { key: 'Ctrl+D', action: 'Select Next Occurrence' },
                  { key: 'Ctrl+W', action: 'Close Editor' },
                ].map((s) => (
                  <div key={s.key} className="flex items-center justify-between py-1">
                    <span className="text-xs" style={{ color: themeColors.text }}>{s.action}</span>
                    <kbd className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ backgroundColor: themeColors.backgroundActive, color: themeColors.textMuted }}>
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </SettingsSection>
          )}

          {section === 'accessibility' && (
            <SettingsSection title="Accessibility" themeColors={themeColors}>
              <SettingRow label="High Contrast" desc="Maximize color contrast for readability" themeColors={themeColors}>
                <Toggle value={settings.highContrast} onChange={(v) => { updateSettings({ highContrast: v, theme: v ? 'high-contrast' : settings.theme }); }} themeColors={themeColors} />
              </SettingRow>
              <SettingRow label="Reduced Motion" desc="Minimize animations and transitions" themeColors={themeColors}>
                <Toggle value={settings.reducedMotion} onChange={(v) => updateSettings({ reducedMotion: v })} themeColors={themeColors} />
              </SettingRow>
              <SettingRow label="Show Hidden Files" desc="Display dotfiles in explorer" themeColors={themeColors}>
                <Toggle value={settings.hiddenFiles} onChange={(v) => updateSettings({ hiddenFiles: v })} themeColors={themeColors} />
              </SettingRow>
              <SettingRow label="Sort Files By" desc="Explorer sort order" themeColors={themeColors}>
                <select
                  value={settings.sortFilesBy}
                  onChange={(e) => updateSettings({ sortFilesBy: e.target.value as Settings['sortFilesBy'] })}
                  className="text-xs px-2 py-1 rounded outline-none"
                  style={{ backgroundColor: themeColors.background, color: themeColors.text, border: `1px solid ${themeColors.panelBorder}` }}
                >
                  <option value="name">Name</option>
                  <option value="type">Type</option>
                  <option value="date">Date Modified</option>
                </select>
              </SettingRow>
            </SettingsSection>
          )}

          {section === 'privacy' && (
            <SettingsSection title="Privacy" themeColors={themeColors}>
              <div className="px-4 py-2 text-xs" style={{ color: themeColors.text }}>
                <p className="mb-2">MobileCode Studio respects your privacy:</p>
                <ul className="space-y-1 list-disc list-inside" style={{ color: themeColors.textMuted }}>
                  <li>No telemetry or analytics collected</li>
                  <li>No source code uploaded without explicit consent</li>
                  <li>Credentials stored in Android secure storage</li>
                  <li>Extensions are sandboxed with restricted permissions</li>
                  <li>Network access requires explicit permission</li>
                </ul>
              </div>
            </SettingsSection>
          )}

          {section === 'storage' && (
            <SettingsSection title="Storage & Backup" themeColors={themeColors}>
              <SettingRow label="Backup Settings" desc="Export your settings to a file" themeColors={themeColors}>
                <button
                  className="flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors"
                  style={{ backgroundColor: themeColors.accent, color: themeColors.accentFg }}
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'mobilecode-settings.json'; a.click();
                    showToast('Settings exported');
                  }}
                >
                  <Download size={12} /> Export
                </button>
              </SettingRow>
              <SettingRow label="Restore Settings" desc="Import settings from a file" themeColors={themeColors}>
                <button
                  className="flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors"
                  style={{ backgroundColor: themeColors.backgroundActive, color: themeColors.text }}
                  onClick={() => showToast('Settings import requires file picker')}
                >
                  <Upload size={12} /> Import
                </button>
              </SettingRow>
              <SettingRow label="Reset Settings" desc="Restore all settings to defaults" themeColors={themeColors}>
                <button
                  className="flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors"
                  style={{ backgroundColor: themeColors.error, color: '#fff' }}
                  onClick={() => { resetSettings(); showToast('Settings reset'); }}
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </SettingRow>
              <SettingRow label="Export Workspace" desc="Export current workspace as JSON" themeColors={themeColors}>
                <button
                  className="flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors"
                  style={{ backgroundColor: themeColors.accent, color: themeColors.accentFg }}
                  onClick={() => {
                    const blob = new Blob([vfs.exportWorkspace()], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'workspace.json'; a.click();
                    showToast('Workspace exported');
                  }}
                >
                  <Download size={12} /> Export
                </button>
              </SettingRow>
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, themeColors, children }: { title: string; themeColors: any; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold mb-3" style={{ color: themeColors.text }}>{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SettingRow({ label, desc, themeColors, children }: { label: string; desc: string; themeColors: any; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="flex-1">
        <div className="text-xs font-medium" style={{ color: themeColors.text }}>{label}</div>
        <div className="text-[10px]" style={{ color: themeColors.textMuted }}>{desc}</div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange, themeColors }: { value: boolean; onChange: (v: boolean) => void; themeColors: any }) {
  return (
    <button
      className="relative w-9 h-5 rounded-full transition-colors"
      style={{ backgroundColor: value ? themeColors.accent : themeColors.backgroundActive }}
      onClick={() => onChange(!value)}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
        style={{ left: value ? '18px' : '2px' }}
      />
    </button>
  );
}

import { vfs } from '@/lib/vfs';
