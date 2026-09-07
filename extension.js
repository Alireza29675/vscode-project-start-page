'use strict';
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { render } = require('./render');

let panel;

function activate(context) {
  const pmDir = path.join(path.dirname(context.globalStorageUri.fsPath), 'alefragnani.project-manager');
  const show = () => showPanel(pmDir, context.extensionPath);
  const rerender = () => { if (panel) panel.webview.html = buildHtml(panel.webview, pmDir); };

  context.subscriptions.push(vscode.commands.registerCommand('projectStartPage.show', show));

  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(vscode.Uri.file(pmDir), 'projects*.json')
  );
  watcher.onDidChange(rerender);
  watcher.onDidCreate(rerender);
  watcher.onDidDelete(rerender);
  context.subscriptions.push(watcher);

  const openOnEmpty = vscode.workspace.getConfiguration('projectStartPage').get('openOnEmptyWindow');
  if (openOnEmpty && !(vscode.workspace.workspaceFolders || []).length) show();
}

function showPanel(pmDir, extensionPath) {
  if (panel) { panel.reveal(); return; }
  panel = vscode.window.createWebviewPanel('projectStartPage', 'Projects', vscode.ViewColumn.One, {
    enableScripts: true
  });
  panel.iconPath = {
    light: vscode.Uri.file(path.join(extensionPath, 'media', 'tab-light.svg')),
    dark: vscode.Uri.file(path.join(extensionPath, 'media', 'tab-dark.svg'))
  };
  panel.onDidDispose(() => { panel = undefined; });
  panel.webview.onDidReceiveMessage(async (msg) => {
    switch (msg.type) {
      case 'open':
        return vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(msg.path), { forceNewWindow: !!msg.newWindow });
      case 'refresh':
        await vscode.commands.executeCommand('projectManager.refreshGitProjects');
        setTimeout(() => { if (panel) panel.webview.html = buildHtml(panel.webview, pmDir); }, 1500);
        return;
      case 'pm':
        return vscode.commands.executeCommand('projectManager.listProjects');
      case 'openFolder':
        return vscode.commands.executeCommand('workbench.action.files.openFolder');
    }
  });
  panel.webview.html = buildHtml(panel.webview, pmDir);
}

function buildHtml(webview, pmDir) {
  const projects = loadProjects(pmDir);
  const nonce = [...Array(24)].map(() => Math.random().toString(36)[2]).join('');
  return render({ groups: groupProjects(projects), total: projects.length, pmMissing: !fs.existsSync(pmDir), nonce, cspSource: webview.cspSource });
}

function loadProjects(pmDir) {
  let files = [];
  try { files = fs.readdirSync(pmDir).filter((f) => /^projects(_cache_\w+)?\.json$/.test(f)); } catch { return []; }
  const home = os.homedir();
  const seen = new Map();
  for (const file of files) {
    let list;
    try { list = JSON.parse(fs.readFileSync(path.join(pmDir, file), 'utf8')); } catch { continue; }
    if (!Array.isArray(list)) continue;
    for (const p of list) {
      const raw = p.fullPath || p.rootPath;
      if (!raw || p.enabled === false) continue;
      const full = path.resolve(raw.replace(/^(\$home|~)(?=\/|$)/, home));
      if (!seen.has(full)) seen.set(full, { name: p.name || path.basename(full), path: full, saved: file === 'projects.json' });
    }
  }
  return [...seen.values()].map(enrich);
}

function enrich(p) {
  let gitdir = null;
  try {
    const dotGit = path.join(p.path, '.git');
    const st = fs.statSync(dotGit);
    gitdir = st.isDirectory() ? dotGit : path.resolve(p.path, fs.readFileSync(dotGit, 'utf8').replace(/^gitdir:\s*/, '').trim());
  } catch {
    p.missing = !fs.existsSync(p.path);
  }
  if (gitdir) {
    try {
      const head = fs.readFileSync(path.join(gitdir, 'HEAD'), 'utf8').trim();
      p.branch = head.startsWith('ref: refs/heads/') ? head.slice(16) : head.slice(0, 8);
    } catch {}
    for (const f of ['index', 'HEAD']) {
      try { p.lastActivity = Math.max(p.lastActivity || 0, fs.statSync(path.join(gitdir, f)).mtimeMs); } catch {}
    }
  }
  if (!p.lastActivity) { try { p.lastActivity = fs.statSync(p.path).mtimeMs; } catch {} }
  const m = /\b([A-Z][A-Z0-9]{1,6}-\d+)\b/.exec(`${p.name} ${p.branch || ''}`);
  p.ticket = m ? m[1] : null;
  p.group = path.dirname(p.path);
  return p;
}

function groupProjects(projects) {
  const home = os.homedir();
  const byDir = new Map();
  for (const p of projects) {
    if (!byDir.has(p.group)) byDir.set(p.group, []);
    byDir.get(p.group).push(p);
  }
  const groups = [...byDir.entries()].map(([dir, items]) => ({
    dir,
    label: dir.startsWith(home) ? '~' + dir.slice(home.length) : dir,
    projects: items.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0))
  }));
  return groups.sort((a, b) => (b.projects[0].lastActivity || 0) - (a.projects[0].lastActivity || 0));
}

function deactivate() {}

module.exports = { activate, deactivate, loadProjects, groupProjects };
