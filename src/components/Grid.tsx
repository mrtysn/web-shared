import type { CSSProperties, ReactNode } from "react";

/** Responsive auto-fill card grid. `min` is the minimum column width in px. */
export function Grid({ children, min = 260 }: { children: ReactNode; min?: number }) {
  return (
    <div className="ws-grid" style={{ "--ws-grid-min": `${min}px` } as CSSProperties}>
      {children}
    </div>
  );
}
