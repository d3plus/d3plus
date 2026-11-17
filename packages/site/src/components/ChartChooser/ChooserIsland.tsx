import {useEffect, useMemo, useRef, useState} from "preact/hooks";

import PlaygroundIsland from "../Playground/PlaygroundIsland.js";
import {profileData} from "./columns.js";
import DataPanel from "./DataPanel.js";
import DecisionTree from "./DecisionTree.js";
import {parseData} from "./parse.js";
import {chartCode} from "./plans.js";
import {SAMPLES} from "./samples.js";
import type {Sample} from "./samples.js";
import {evaluate, leaves} from "./states.js";
import {analyze} from "./traits.js";
import type {ChartInfo} from "./TreeTip.js";
import {TREE} from "./tree.js";

interface ChooserProps {
  /** Each chart's docs page, description, and code flavors. */
  info: Record<string, ChartInfo>;
}

/** How long typing pauses before the data is read again. */
const READ_DELAY = 250;
const CHART_COUNT = new Set(leaves(TREE).map(l => l.node.chart)).size;

/** Reads pasted text into the traits that decide its charts. */
function useData(input: string) {
  return useMemo(() => {
    const parsed = parseData(input);
    const profile = profileData(parsed.rows);
    const traits = profile.rows.length ? analyze(profile) : null;
    const states = traits ? evaluate(TREE, traits) : null;
    return {parsed, profile, traits, states};
  }, [input]);
}

/** The chart drawn from the data, with its code, or a prompt to pick one. */
function ChartPanel(props: {
  chart: string | null;
  code: string | null;
  fits: number | null;
  info: Record<string, ChartInfo>;
  onClose: () => void;
  onBack: () => void;
}) {
  const {chart, code, fits, info, onClose, onBack} = props;
  if (!chart || !code)
    return (
      <div class="d3p-chooser-empty">
        {fits === null ? (
          <p>Load a sample or paste data, then pick a chart that lights up.</p>
        ) : fits ? (
          <p>
            <strong>
              {fits} of {CHART_COUNT}
            </strong>{" "}
            charts fit this data. Pick one in the tree to draw it, with its
            config as code you can edit.
          </p>
        ) : (
          <p>
            No chart fits this data yet. Hover a chart in the tree to see what
            it needs.
          </p>
        )}
      </div>
    );
  return (
    <div class="d3p-chooser-result">
      <div class="d3p-chooser-heading">
        <h2>{chart.replace(/([a-z])([A-Z])/g, "$1 $2")}</h2>
        <a href={info[chart].href}>Docs</a>
        <a
          class="d3p-chooser-back"
          href="#chooser-tree"
          onClick={e => {
            e.preventDefault();
            onBack();
          }}
        >
          Back to the tree
        </a>
        <button type="button" onClick={onClose} aria-label="Close the chart">
          ×
        </button>
      </div>
      <PlaygroundIsland
        key={`${chart}\n${code}`}
        id="chooser-playground"
        name={chart}
        code={code}
        controls={[]}
        flavors={info[chart].flavors}
        height={360}
        panel="code"
      />
    </div>
  );
}

/**
 * The chart chooser: paste data (or load a sample), see which branches of
 * the decision tree it lights up and why, and draw any chart it fits.
 */
export default function ChooserIsland({info}: ChooserProps) {
  const [text, setText] = useState("");
  const [input, setInput] = useState("");
  const [sample, setSample] = useState<string | null>(null);
  const [selected, setSelected] = useState<{key: string; chart: string} | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const result = useRef<HTMLDivElement>(null);
  const {parsed, profile, traits, states} = useData(input);

  const lit = selected && states?.get(selected.key)?.lit ? selected : null;
  const code = useMemo(
    () => (lit && traits ? chartCode(lit.chart, traits) : null),
    [lit?.chart, traits],
  );
  const fits = states
    ? new Set(
        leaves(TREE)
          .filter(l => states.get(l.key)?.lit)
          .map(l => l.node.chart),
      ).size
    : null;

  useEffect(() => () => clearTimeout(timer.current), []);

  const onText = (next: string) => {
    setText(next);
    setSample(null);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setInput(next), READ_DELAY);
  };
  const onSample = (s: Sample) => {
    clearTimeout(timer.current);
    setText(s.text);
    setInput(s.text);
    setSample(s.id);
  };
  const onSelect = (key: string, chart: string) => {
    setSelected({key, chart});
    // On a narrow screen the chart is below the tree: bring it into view.
    requestAnimationFrame(() => {
      const el = result.current;
      if (el && el.getBoundingClientRect().top > window.innerHeight * 0.6)
        el.scrollIntoView({behavior: "smooth", block: "start"});
    });
  };

  return (
    <div class="d3p-chooser not-content">
      <div class="d3p-chooser-grid">
        <DataPanel
          id="chooser"
          text={text}
          onText={onText}
          samples={SAMPLES}
          sample={sample}
          onSample={onSample}
          parsed={parsed}
          columns={profile.columns}
          rows={profile.rows.length}
        />
        <section
          class="d3p-chooser-tree"
          id="chooser-tree"
          aria-label="Decision tree of chart types"
        >
          <DecisionTree
            id="chooser-tree"
            tree={TREE}
            states={states}
            selected={lit?.key ?? null}
            onSelect={onSelect}
            info={info}
          />
        </section>
        <div class="d3p-chooser-chart" ref={result}>
          <ChartPanel
            chart={lit?.chart ?? null}
            code={code}
            fits={fits}
            info={info}
            onClose={() => setSelected(null)}
            onBack={() => {
              const leaf = document.querySelector<HTMLElement>(
                '.d3p-tree-leaf[aria-pressed="true"]',
              );
              leaf?.scrollIntoView({behavior: "smooth", block: "center"});
              leaf?.focus({preventScroll: true});
            }}
          />
        </div>
      </div>
    </div>
  );
}
