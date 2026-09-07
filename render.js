'use strict';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function relTime(ms) {
  if (!ms) return '';
  const d = Date.now() - ms;
  const m = 60e3, h = 60 * m, day = 24 * h;
  if (d < h) return `${Math.max(1, Math.round(d / m))} min ago`;
  if (d < day) return `${Math.round(d / h)} h ago`;
  if (d < 30 * day) return `${Math.round(d / day)} d ago`;
  return new Date(ms).toISOString().slice(0, 10);
}

const branchIcon = '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M11.5 2a2.5 2.5 0 0 0-.9 4.83v.67A1.5 1.5 0 0 1 9.1 9H6.5a3 3 0 0 0-1.5.4V6.83A2.5 2.5 0 1 0 3.5 6.83v4.34a2.5 2.5 0 1 0 1.5 0V11a1.5 1.5 0 0 1 1.5-1.5h2.6a3 3 0 0 0 3-3V6.83A2.5 2.5 0 0 0 11.5 2zM4.25 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm7.25-8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>';

function card(p) {
  const search = [p.name, p.branch, p.ticket, p.path].filter(Boolean).join(' ').toLowerCase();
  const title = p.ticket && p.name.startsWith(p.ticket) ? p.name.slice(p.ticket.length).replace(/^[-_ ]+/, '') || p.name : p.name;
  return `<button class="card${p.missing ? ' missing' : ''}" data-path="${esc(p.path)}" data-search="${esc(search)}" title="${esc(p.path)}">
    <div class="row">
      ${p.ticket ? `<span class="chip">${esc(p.ticket)}</span>` : ''}
      ${p.saved ? '<span class="star" title="Saved in Project Manager">&#9733;</span>' : ''}
      <span class="time">${esc(relTime(p.lastActivity))}</span>
    </div>
    <div class="name">${esc(title)}</div>
    ${p.branch ? `<div class="branch">${branchIcon}<span>${esc(p.branch)}</span></div>` : ''}
    ${p.missing ? '<div class="branch">folder missing</div>' : ''}
  </button>`;
}

function render({ groups, total, pmMissing, nonce, cspSource }) {
  const body = total
    ? groups.map((g) => `<section data-group>
        <h2><span>${esc(g.label)}</span><small>${g.projects.length}</small></h2>
        <div class="grid">${g.projects.map(card).join('')}</div>
      </section>`).join('')
    : `<div class="empty">${pmMissing
        ? 'Project Manager has not built its list yet. Open it once (<kbd>&#8984;&#8997;P</kbd>) or hit Refresh.'
        : 'No projects found. Check <code>projectManager.git.baseFolders</code> in your settings.'}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Projects</title>
<style nonce="${nonce}">
  :root { color-scheme: light dark; }
  body { margin: 0; padding: 28px 36px 48px; font-family: var(--vscode-font-family, system-ui, sans-serif); font-size: var(--vscode-font-size, 13px); color: var(--vscode-foreground, #ccc); background: var(--vscode-editor-background, #1e1e1e); }
  header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
  h1 { font-size: 22px; font-weight: 600; margin: 0; letter-spacing: -0.01em; }
  h1 small { font-weight: 400; opacity: 0.55; margin-left: 8px; font-size: 14px; }
  .spacer { flex: 1; }
  input[type=search] { flex: 0 1 320px; min-width: 200px; padding: 6px 10px; border-radius: 4px; border: 1px solid var(--vscode-input-border, transparent); background: var(--vscode-input-background, #3c3c3c); color: var(--vscode-input-foreground, #ccc); font: inherit; outline: none; }
  input[type=search]:focus { border-color: var(--vscode-focusBorder, #007fd4); }
  .actions button { padding: 5px 12px; border-radius: 3px; border: 1px solid var(--vscode-button-border, transparent); background: var(--vscode-button-secondaryBackground, #3a3d41); color: var(--vscode-button-secondaryForeground, #fff); font: inherit; cursor: pointer; margin-left: 6px; }
  .actions button:hover { background: var(--vscode-button-secondaryHoverBackground, #45494e); }
  .actions button.primary { background: var(--vscode-button-background, #0e639c); color: var(--vscode-button-foreground, #fff); }
  .actions button.primary:hover { background: var(--vscode-button-hoverBackground, #1177bb); }
  section { margin-top: 22px; }
  h2 { display: flex; align-items: baseline; gap: 10px; font-size: 12px; font-weight: 600; opacity: 0.7; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border, #333)); }
  h2 small { font-weight: 400; opacity: 0.8; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
  .card { all: unset; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; border-radius: 6px; cursor: pointer; background: var(--vscode-sideBar-background, #252526); border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border, #333)); min-width: 0; }
  .card:hover { border-color: var(--vscode-focusBorder, #007fd4); background: var(--vscode-list-hoverBackground, #2a2d2e); }
  .card:focus-visible { outline: 1px solid var(--vscode-focusBorder, #007fd4); outline-offset: 1px; }
  .card.missing { opacity: 0.45; }
  .card[hidden] { display: none; }
  .row { display: flex; align-items: center; gap: 8px; min-height: 18px; }
  .chip { font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 999px; background: var(--vscode-badge-background, #4d4d4d); color: var(--vscode-badge-foreground, #fff); letter-spacing: 0.02em; }
  .star { color: var(--vscode-charts-yellow, #cca700); font-size: 12px; }
  .time { margin-left: auto; font-size: 11px; opacity: 0.55; white-space: nowrap; }
  .name { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .branch { display: flex; align-items: center; gap: 5px; font-family: var(--vscode-editor-font-family, monospace); font-size: 11.5px; opacity: 0.7; overflow: hidden; }
  .branch span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .empty { padding: 40px; text-align: center; opacity: 0.7; }
  footer { margin-top: 36px; font-size: 11.5px; opacity: 0.5; }
  kbd { font-family: inherit; padding: 1px 5px; border-radius: 3px; background: var(--vscode-keybindingLabel-background, rgba(128,128,128,.17)); border: 1px solid var(--vscode-keybindingLabel-border, rgba(51,51,51,.6)); border-bottom-color: var(--vscode-keybindingLabel-bottomBorder, rgba(68,68,68,.6)); }
</style>
</head>
<body>
<header>
  <h1>Projects<small>${total}</small></h1>
  <div class="spacer"></div>
  <input type="search" id="q" placeholder="Filter by name, ticket, branch" autofocus>
  <div class="actions">
    <button data-cmd="refresh" title="Rescan folders">Refresh</button>
    <button data-cmd="pm" title="Project Manager quick pick">&#8984;&#8997;P</button>
    <button data-cmd="openFolder" class="primary">Open Folder&hellip;</button>
  </div>
</header>
<main>${body}</main>
<footer>Click opens here. <kbd>&#8984;</kbd> + click opens a new window. <kbd>/</kbd> filters, <kbd>&#8593;</kbd> <kbd>&#8595;</kbd> <kbd>&#8629;</kbd> navigate.</footer>
<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const q = document.getElementById('q');
  const cards = () => [...document.querySelectorAll('.card')];
  const visible = () => cards().filter((c) => !c.hidden);
  function open(card, ev) { vscode.postMessage({ type: 'open', path: card.dataset.path, newWindow: !!(ev && (ev.metaKey || ev.ctrlKey)) }); }
  cards().forEach((c) => c.addEventListener('click', (e) => open(c, e)));
  document.querySelectorAll('[data-cmd]').forEach((b) => b.addEventListener('click', () => vscode.postMessage({ type: b.dataset.cmd })));
  q.addEventListener('input', () => {
    const t = q.value.trim().toLowerCase();
    cards().forEach((c) => { c.hidden = t !== '' && !c.dataset.search.includes(t); });
    document.querySelectorAll('[data-group]').forEach((g) => { g.hidden = !g.querySelector('.card:not([hidden])'); });
  });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && visible()[0]) open(visible()[0], e);
    if (e.key === 'ArrowDown' && visible()[0]) { e.preventDefault(); visible()[0].focus(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target === q) return;
    if (e.key === '/') { e.preventDefault(); q.focus(); q.select(); return; }
    const v = visible(); const i = v.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); (v[i + 1] || v[0])?.focus(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); if (i <= 0) q.focus(); else v[i - 1].focus(); }
  });
</script>
</body>
</html>`;
}

module.exports = { render, relTime, esc };
