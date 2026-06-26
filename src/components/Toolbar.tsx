import type { ReactNode } from "react";

export interface FilterChip {
  key: string;
  label: string;
  count?: number;
}

export interface ToolbarProps {
  query: string;
  onQuery: (q: string) => void;
  placeholder?: string;
  filters?: FilterChip[];
  /** Currently selected filter key, or null for "all". */
  active?: string | null;
  onFilter?: (key: string | null) => void;
  /** Optional right-aligned slot (e.g. a count or timestamp). */
  right?: ReactNode;
}

export function Toolbar({
  query,
  onQuery,
  placeholder = "filter…",
  filters,
  active = null,
  onFilter,
  right,
}: ToolbarProps) {
  return (
    <div className="ws-toolbar">
      <input
        className="ws-search"
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        spellCheck={false}
        autoComplete="off"
      />
      {filters && filters.length > 0 && (
        <div className="ws-filters">
          {filters.map((f) => (
            <button
              key={f.key}
              className={`ws-chip${active === f.key ? " ws-chip--active" : ""}`}
              onClick={() => onFilter?.(active === f.key ? null : f.key)}
            >
              {f.label}
              {f.count !== undefined ? ` ${f.count}` : ""}
            </button>
          ))}
        </div>
      )}
      {right && <div className="ws-toolbar__right">{right}</div>}
    </div>
  );
}
