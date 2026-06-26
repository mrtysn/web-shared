export interface Stat {
  label: string;
  value: number | string;
  tone?: "default" | "good" | "warn" | "bad";
}

/** A row of headline counts. */
export function Stats({ stats }: { stats: Stat[] }) {
  return (
    <div className="ws-stats">
      {stats.map((s) => (
        <div className="ws-stat" key={s.label}>
          <span className={`ws-stat__value ws-stat__value--${s.tone ?? "default"}`}>{s.value}</span>
          <span className="ws-stat__label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
