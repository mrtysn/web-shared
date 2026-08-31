import { useEffect, useState } from "react";
import { Card, Grid, Toolbar, Stats, Tag, Badge } from "../src/index";
import type { Stat } from "../src/index";
import legacyCss from "./legacy/components.css?url";

/** A gallery of every primitive in the house style, in every state worth
 *  looking at. Two toggles: the theme, and "before" — which loads the
 *  pre-redesign component stylesheet over the top so the two languages can be
 *  compared on identical markup rather than from memory. */

type Theme = "system" | "light" | "dark";

function useLegacy(on: boolean) {
  useEffect(() => {
    const ID = "ws-legacy-css";
    const existing = document.getElementById(ID);
    if (on && !existing) {
      const link = document.createElement("link");
      link.id = ID;
      link.rel = "stylesheet";
      link.href = legacyCss;
      document.head.appendChild(link);
    } else if (!on && existing) {
      existing.remove();
    }
  }, [on]);
}

function Row({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="gal-row">
      <div className="gal-row__head">
        <h2>{title}</h2>
        {note && <p className="gal-note">{note}</p>}
      </div>
      {children}
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
  const [legacy, setLegacy] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>("skill");

  useLegacy(legacy);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="ws-app gal">
      <header className="gal-head">
        <div>
          <h1>web-shared</h1>
          <p className="gal-note">
            House style primitives. {legacy ? "Showing the previous language." : "Showing the current language."}
          </p>
        </div>
        <div className="gal-controls">
          <div className="ws-filters">
            {(["system", "light", "dark"] as Theme[]).map((t) => (
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
            className={`ws-chip${legacy ? " ws-chip--active" : ""}`}
            onClick={() => setLegacy((v) => !v)}
          >
            {legacy ? "before ✓" : "compare: before"}
          </button>
        </div>
      </header>

      <Row
        title="Foundations"
        note="Theme variables from classless.css, plus the tokens components.css adds. Every status colour is a token so it can flip per theme — the old sheet hard-coded one green and one red for both grounds."
      >
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
      </Row>

      <Row
        title="Stats"
        note="A row of headline counts. Tabular numerals keep the digits from shifting as values change."
      >
        <Stats stats={STATS} />
      </Row>

      <Row
        title="Toolbar"
        note="Search plus filter chips. Chips gained a larger hit area and a focus ring on the input; the active chip now uses the page background for its label so the contrast holds in both themes."
      >
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
      </Row>

      <Row
        title="Badge and Tag"
        note="Badges mark exceptions and sit beside a title, so they were demoted from bordered uppercase boxes to quiet tinted labels. Tags stay pills — they are content, not status."
      >
        <div className="gal-inline">
          <Badge label="focus" />
          <Badge label="parked" />
          <Badge label="archived" />
          <Badge label="missing" />
          <Badge label="private" />
        </div>
        <div className="gal-inline">
          <Tag label="python" />
          <Tag label="typescript" />
          <Tag label="godot" />
        </div>
      </Row>

      <Row
        title="Card"
        note="The workhorse. Hover now moves the border rather than nothing, and the empty-description marker is dimmer so a section of them does not read as an error."
      >
        <Grid min={240}>
          <Card title="Plain card" description="A one-line description sitting under the title." />
          <Card
            title="With badges and tags"
            href="https://example.com"
            description="Linked title, two badges, three tags."
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
            description="Titles with no spaces have to wrap inside the card, not spill past it."
          />
          <Card title="With children" description="Anything can be slotted below.">
            <div className="gal-slot">child content</div>
          </Card>
        </Grid>
      </Row>

      <Row title="Grid" note="Auto-fill columns; `min` sets the narrowest a column may get before it reflows.">
        <Grid min={140}>
          {Array.from({ length: 8 }, (_, i) => (
            <Card key={i} title={`Item ${i + 1}`} />
          ))}
        </Grid>
      </Row>
    </div>
  );
}
