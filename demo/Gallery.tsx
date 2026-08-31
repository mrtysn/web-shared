import { useEffect, useState, type ReactNode } from "react";
import { Card, Grid, Toolbar, Stats, Tag, Badge } from "../src/index";
import type { Stat } from "../src/index";

/** A gallery of every primitive in the house style, in every state worth
 *  looking at.
 *
 *  Compare mode renders each specimen twice, side by side — the previous house
 *  style on the left, the current one on the right. A toggle would ask the
 *  reader to hold the old state in memory; two columns do not. The left column
 *  gets its appearance from legacy/components.scoped.css, a frozen snapshot
 *  rewritten under `.gal-before` by scope-legacy.py. */

type Theme = "system" | "light" | "dark";

const THEMES: Theme[] = ["system", "light", "dark"];

function Row({
  title,
  note,
  changed,
  compare,
  children,
}: {
  title: string;
  note?: string;
  changed?: string[];
  compare: boolean;
  children: () => ReactNode;
}) {
  return (
    <section className="gal-row">
      <div className="gal-row__head">
        <h2>{title}</h2>
        {note && <p className="gal-note">{note}</p>}
        {changed && changed.length > 0 && (
          <ul className="gal-changed">
            {changed.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
      </div>
      {compare ? (
        <div className="gal-compare">
          <div className="gal-side gal-before">
            <span className="gal-side__tag">before</span>
            {children()}
          </div>
          <div className="gal-side">
            <span className="gal-side__tag gal-side__tag--after">after</span>
            {children()}
          </div>
        </div>
      ) : (
        children()
      )}
    </section>
  );
}

function Swatch({ name }: { name: string }) {
  return (
    <div className="gal-swatch">
      <div className="gal-swatch__chip" style={{ background: `var(${name})` }} />
      <code>{name}</code>
    </div>
  );
}

const STATS: Stat[] = [
  { label: "Default", value: 42 },
  { label: "Good", value: 128, tone: "good" },
  { label: "Warn", value: 3, tone: "warn" },
  { label: "Bad", value: 9, tone: "bad" },
];

export function Gallery() {
  const [theme, setTheme] = useState<Theme>("system");
  const [compare, setCompare] = useState(true);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>("skill");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="ws-app gal">
      <header className="gal-head">
        <div className="gal-head__id">
          <h1>web-shared</h1>
          <span className="gal-note">house style primitives</span>
        </div>
        <div className="gal-controls">
          <div className="ws-filters">
            {THEMES.map((t) => (
              <button
                key={t}
                className={`ws-chip${theme === t ? " ws-chip--active" : ""}`}
                onClick={() => setTheme(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            className={`ws-chip${compare ? " ws-chip--active" : ""}`}
            onClick={() => setCompare((v) => !v)}
          >
            {compare ? "comparing before ✓" : "compare with before"}
          </button>
        </div>
      </header>

      <Row
        compare={false}
        title="Foundations"
        note="Theme variables from classless.css, plus the tokens components.css adds."
        changed={[
          "status colours were literals (#2f7d4f, #b4452f) shared by both themes — the green all but vanished on the dark ground; now --ws-good / --ws-bad, which flip",
          "separators were var(--cmed) everywhere; now one --ws-rule token, so density retunes in one place",
          "added --ws-radius so cards, chips and inputs cannot drift apart",
        ]}
      >
        {() => (
          <>
            <div className="gal-swatches">
              {["--cbg", "--cfg", "--clight", "--cmed", "--cdark", "--clink", "--cemph"].map((n) => (
                <Swatch key={n} name={n} />
              ))}
            </div>
            <div className="gal-swatches">
              {["--ws-rule", "--ws-good", "--ws-bad"].map((n) => (
                <Swatch key={n} name={n} />
              ))}
            </div>
          </>
        )}
      </Row>

      <Row
        compare={compare}
        title="Badge"
        note="A badge marks an exception and sits beside a title."
        changed={[
          "uppercase 0.62rem with a 1px border → 0.68rem sentence case, no border",
          "transparent ground → a tint of --cmed, so it reads as a label rather than a control",
          "letter-spacing 0.4px → 0.2px",
        ]}
      >
        {() => (
          <div className="gal-inline">
            <Badge label="focus" />
            <Badge label="parked" />
            <Badge label="archived" />
            <Badge label="missing" />
            <Badge label="private" />
          </div>
        )}
      </Row>

      <Row
        compare={compare}
        title="Card"
        note="The workhorse: title, optional link, description, tags, badges, slot."
        changed={[
          "border var(--cmed) → var(--ws-rule), and hover now moves it instead of doing nothing",
          "padding 10/12 → 11/13; title gains line-height 1.3 so two-line titles stop crowding",
          "empty-description marker dimmed to 0.7 — a section of them was reading as an error",
          "muted opacity 0.65 → 0.6",
        ]}
      >
        {() => (
          <Grid min={230}>
            <Card title="Plain card" description="A one-line description under the title." />
            <Card
              title="With badges and tags"
              href="https://example.com"
              description="Linked title, two badges, two tags."
              badges={["focus", "private"]}
              tags={["python", "cli"]}
            />
            <Card title="Empty description" description="" />
            <Card
              title="Muted"
              description="Dimmed and dashed — for missing or archived things."
              badges={["missing"]}
              muted
            />
            <Card
              title="averyveryverylongunbreakabletokenlikeapackageid@1.2.3"
              description="Titles with no spaces wrap inside the card, not past it."
            />
            <Card title="With children" description="Anything can be slotted below.">
              <div className="gal-slot">child content</div>
            </Card>
          </Grid>
        )}
      </Row>

      <Row
        compare={compare}
        title="Toolbar"
        note="Search plus filter chips, with an optional right-hand slot."
        changed={[
          "chip padding 3/9 → 4/11, for a hit area a finger can find",
          "active chip label was #fff on --cemph; now var(--cbg), which holds in both themes",
          "chips gained a hover state and the search input a focus ring",
        ]}
      >
        {() => (
          <Toolbar
            query={query}
            onQuery={setQuery}
            filters={[
              { key: "skill", label: "Skills", count: 26 },
              { key: "tool", label: "Tools", count: 45 },
              { key: "ext", label: "Extensions", count: 274 },
            ]}
            active={active}
            onFilter={setActive}
            right="updated just now · macbook"
          />
        )}
      </Row>

      <Row
        compare={compare}
        title="Stats"
        note="A row of headline counts."
        changed={[
          "tones now use the flipping tokens — compare the greens with the theme set to dark",
          "value 1.25 → 1.3rem with tabular numerals, so digits stop shifting as counts change",
          "label 0.7 → 0.68rem; row gap 14 → 18px",
        ]}
      >
        {() => <Stats stats={STATS} />}
      </Row>

      <Row
        compare={compare}
        title="Tag"
        note="Tags are content, not status, so they stayed pills."
        changed={["border var(--cmed) → var(--ws-rule); the row sits 1px lower under a card body"]}
      >
        {() => (
          <div className="gal-inline">
            <Tag label="python" />
            <Tag label="typescript" />
            <Tag label="godot" />
          </div>
        )}
      </Row>

      <Row
        compare={compare}
        title="Grid"
        note="Auto-fill columns; `min` sets the narrowest a column may get before it reflows."
        changed={["gap 10 → 12px"]}
      >
        {() => (
          <Grid min={130}>
            {Array.from({ length: 6 }, (_, i) => (
              <Card key={i} title={`Item ${i + 1}`} />
            ))}
          </Grid>
        )}
      </Row>
    </div>
  );
}
