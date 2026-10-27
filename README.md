# web-shared

Mert's house web style and a small set of generic React components, shared across
projects. Consumed as a **git submodule**, not an npm install.

## What's in it

- `src/styles/classless.css` — the base/theme stylesheet (light + dark via
  `prefers-color-scheme`; no other themes).
- `src/styles/components.css` — styles for the components below, and the `ws-doc` page layout:
  `<body class="ws-doc"><nav class="ws-toc">…</nav><main>…</main></body>` puts a sticky contents
  column on the left (stacked above the text under 55rem, hidden in print). `project-lifecycle
  page-new` writes such a page.
- `src/styles/house-font.css` + `src/fonts/` — Ubuntu (300, 400, 700) as the default `--font-p`/`--font-h`,
  self-hosted; `page-new` inlines the files as data URIs. A palette's own `--font-p` wins over it.
- `src/font-picker.js` — a floating menu (`.ws-fontpick`) that swaps those two properties for a system
  font and remembers the choice in `localStorage`. `page-new` and `page-restyle` inline it in the
  `<head>`; deck pages get no menu.
- `src/components/` — domain-agnostic primitives: `Card`, `Grid`, `Toolbar`,
  `Stats`, `Tag`, `Badge`.
- `tsconfig.base.json` — shared TypeScript defaults for consumer apps to extend.

## Using it in a project

Add as a submodule (public https in `.gitmodules`; override to the SSH alias
locally in `.git/config`):

```bash
git submodule add https://github.com/mrtysn/web-shared.git web/web-shared
git config --file .git/config submodule.web/web-shared.url git@github-personal:mrtysn/web-shared.git
```

Point a Vite/TS alias at it, then:

```ts
import "@shared/styles/classless.css";
import "@shared/styles/components.css";
import { Card, Grid, Toolbar, Stats } from "@shared";
```

Consumers: **atlas**, **mertyas.in**.

## Updating consumers

This is a submodule, so bumping a consumer = `git submodule update --remote` in
that repo and committing the new pointer.

## Editing the house style

Edit in a standalone clone (`git clone git@github.com:mrtysn/web-shared.git` beside the other
repos), not inside a consumer's submodule. That clone is also what `project-lifecycle
page-new` inlines into the pages agents write (its `web_shared_root` setting), so a change
there reaches new pages at once and reaches each site when the site bumps its pointer.

## Palettes

`src/styles/palettes/<name>.css` recolours the house style for one page: custom properties
only (`--cbg`, `--cfg`, `--clink`, `--cemph`, the `--ws-tone-N` category colours, `--font-p`),
on `html[data-theme="light"]` and `html[data-theme="dark"]`. `project-lifecycle page-new
--palette <name>` lays one over the stylesheets; a repo can keep its own as `page-palette.css`.
