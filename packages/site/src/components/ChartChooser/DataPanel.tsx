import type {Column} from "./columns.js";
import {describeColumn} from "./columns.js";
import type {Parsed} from "./parse.js";
import type {Sample} from "./samples.js";
import {columnKind as kind} from "./view.js";

interface DataPanelProps {
  id: string;
  text: string;
  onText: (text: string) => void;
  samples: Sample[];
  /** The sample loaded, until the text is edited. */
  sample: string | null;
  onSample: (sample: Sample) => void;
  parsed: Parsed;
  columns: Column[];
  rows: number;
}

/** A short name for each format. */
const FORMATS = {json: "JSON", csv: "CSV", tsv: "TSV"};

/**
 * Where data comes in: sample links, a textarea for pasted JSON, CSV, or
 * TSV, and a summary of the columns read from it (or why it can't be read).
 */
export default function DataPanel(props: DataPanelProps) {
  const {id, text, onText, samples, sample, onSample, parsed, columns, rows} =
    props;
  const summaryId = `${id}-summary`;
  return (
    <section class="d3p-chooser-data" aria-label="Your data">
      <div class="d3p-chooser-samples">
        <span id={`${id}-samples`}>Try a sample:</span>
        <ul aria-labelledby={`${id}-samples`}>
          {samples.map(s => (
            <li key={s.id}>
              <button
                type="button"
                title={s.title}
                aria-pressed={sample === s.id}
                onClick={() => onSample(s)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <label class="d3p-chooser-label" for={`${id}-input`}>
        Paste your data: a JSON array of objects, CSV, or cells copied from a
        spreadsheet
      </label>
      <textarea
        id={`${id}-input`}
        class="d3p-chooser-input"
        value={text}
        spellcheck={false}
        placeholder={
          "country,year,exports\nBrazil,2023,340\nBrazil,2024,337\n…"
        }
        aria-describedby={summaryId}
        onInput={e => onText((e.target as HTMLTextAreaElement).value)}
      />
      <div id={summaryId} class="d3p-chooser-summary" aria-live="polite">
        {parsed.error ? (
          <p class="d3p-chooser-error" role="alert">
            {parsed.error}
          </p>
        ) : columns.length ? (
          <>
            <p class="d3p-chooser-meta">
              {sample ? `${samples.find(s => s.id === sample)?.title}: ` : ""}
              {rows} row{rows === 1 ? "" : "s"} of{" "}
              {parsed.format ? FORMATS[parsed.format] : ""}, {columns.length}{" "}
              column{columns.length === 1 ? "" : "s"}
            </p>
            <ul class="d3p-chooser-columns">
              {columns.map(c => (
                <li key={c.key} class={`is-${kind(c)}`}>
                  <span class="d3p-chooser-swatch" aria-hidden="true" />
                  <code>{c.key}</code>
                  <span>{describeColumn(c)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p class="d3p-chooser-meta">
            No data yet: the tree lights up the charts your data can draw.
          </p>
        )}
      </div>
    </section>
  );
}
