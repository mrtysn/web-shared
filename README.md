# web-shared

Mert's house web style and a small set of generic React components, shared across
projects. Consumed as a **git submodule**, not an npm install.

## What's in it

- `src/styles/classless.css` — the base/theme stylesheet (light + dark via
  `prefers-color-scheme`; no other themes).
- `src/styles/components.css` — styles for the components below.
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
