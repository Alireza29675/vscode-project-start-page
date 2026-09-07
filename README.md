# vscode-project-start-page

A VS Code extension that replaces the Welcome page in empty windows with a clickable list of all your projects.

![icon](media/icon.png)

## Requires

- [Project Manager](https://marketplace.visualstudio.com/items?itemName=alefragnani.project-manager) (`alefragnani.project-manager`). This extension has no scanner of its own: it reads Project Manager's project list (its git cache plus saved projects), so what you see here is exactly what `Cmd+Alt+P` shows. Project Manager is declared as an extension dependency and gets installed automatically.

## What it does

- In a window with no folder open, it opens a "Projects" tab listing every project Project Manager knows about, grouped by parent folder and sorted by last git activity.
- Each card shows the Jira ticket (parsed from the folder or branch name), the project name, the current branch and when it was last touched.
- Click a card to open that project in the current window. `Cmd`/`Ctrl` + click opens a new window.
- `/` focuses the filter, arrow keys move between cards, `Enter` opens.
- Buttons: Refresh (rescans through Project Manager), `Cmd+Alt+P` (Project Manager quick pick), Open Folder.
- The list updates live when Project Manager refreshes its cache.

## Commands and keys

- `Project Start Page: Show Start Page` (`projectStartPage.show`), hotkey `Ctrl+Cmd+P` on macOS, `Ctrl+Alt+P` elsewhere. Works in any window.

## Settings

- `projectStartPage.openOnEmptyWindow` (default `true`): open the page automatically when a window has no folder.
- Pairs well with `"workbench.startupEditor": "none"` so the built-in Welcome page stays out of the way.

## Build and install

```sh
npx -y @vscode/vsce package -o /tmp/vscode-project-start-page.vsix
code --install-extension /tmp/vscode-project-start-page.vsix --force
```

No dependencies, plain CommonJS, nothing to compile.
