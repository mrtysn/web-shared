# demo

A gallery of every primitive in `src/`, in every state worth looking at, with a
theme switch and a **compare** mode that renders each specimen twice — the
previous house style on the left, the current one on the right — under a
sticky toolbar. Each section also lists what changed, in values rather than
adjectives.

Comparing by toggling one stylesheet asks the reader to hold the old state in
memory, which is exactly the thing a gallery exists to avoid. So `legacy/`
holds a frozen snapshot of the old `components.css`, and `scope-legacy.py`
rewrites every selector in it under `.gal-before`:

```
./scope-legacy.py                 # legacy/components.css -> legacy/components.scoped.css
./scope-legacy.py --help          # --src / --out / --scope
```

Refresh the snapshot when you want "before" to mean something newer: copy the
current `src/styles/components.css` over `legacy/components.css` and re-run.
The script handles flat stylesheets only — it refuses at-rules and
document-level selectors rather than producing quietly wrong CSS.

## Hosting it

`web-shared` deliberately carries no build tooling — it is consumed as source.
So the gallery is a component, and the consuming app hosts it. In a consumer
that already has React and Vite:

```html
<!-- gallery.html at the app's web root -->
<div id="root"></div>
<script type="module" src="/src/gallery.tsx"></script>
```

```tsx
// src/gallery.tsx
import ReactDOM from "react-dom/client";
import { Gallery } from "../web-shared/demo/Gallery";
import "@shared/styles/classless.css";
import "@shared/styles/components.css";
import "../web-shared/demo/legacy/components.scoped.css";
import "../web-shared/demo/gallery.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<Gallery />);
```

Add `gallery.html` to the app's Vite `build.rollupOptions.input` so it survives
a production build, and add `web-shared/demo` to the tsconfig `include`.

atlas does exactly this: `pnpm --dir web dev`, then open `/gallery.html`.
