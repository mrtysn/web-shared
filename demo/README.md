# demo

A gallery of every primitive in `src/`, in every state worth looking at, with a
theme switch and a "before" toggle that loads `legacy/components.css` over the
top so two versions of the house style can be compared on identical markup.

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
import "../web-shared/demo/gallery.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<Gallery />);
```

Add `gallery.html` to the app's Vite `build.rollupOptions.input` so it survives
a production build, and add `web-shared/demo` to the tsconfig `include`.

atlas does exactly this: `pnpm --dir web dev`, then open `/gallery.html`.

`legacy/components.css` is a frozen snapshot, not a live file. Refresh it when
you want the "before" to mean something new.
