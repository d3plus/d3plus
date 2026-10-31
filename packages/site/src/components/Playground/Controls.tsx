import type {ControlSpec} from "./types.js";

interface ControlsProps {
  id: string;
  controls: ControlSpec[];
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  /** Opens the code editor, for values a control can't show. */
  onEditCode: () => void;
}

interface InputProps {
  spec: ControlSpec;
  value: unknown;
  id: string;
  /** The id of the control's description, for `aria-describedby`. */
  describedBy?: string;
  onChange: (value: unknown) => void;
}

/** Option lists this short, of short labels, draw as a segmented control. */
const SEGMENT_OPTIONS = 4;
const SEGMENT_LABEL = 10;

/** Whether `value` is one the control can show and set; others stay in code. */
export function representable(spec: ControlSpec, value: unknown): boolean {
  if (value === undefined) return true;
  switch (spec.control) {
    case "boolean":
      return typeof value === "boolean";
    case "number":
      return typeof value === "number";
    case "radio":
    case "select":
      return (spec.options || []).includes(value);
    default:
      return typeof value === "string";
  }
}

/**
 * The value a control shows: the config's when it has one, else the default
 * when the control can show it (some documented defaults are placeholders).
 */
export function current(
  spec: ControlSpec,
  config: Record<string, unknown>,
): unknown {
  const value = config[spec.key];
  if (value !== undefined) return value;
  return representable(spec, spec.defaultValue) ? spec.defaultValue : undefined;
}

/** A short printout of a value the controls leave to the code. */
export function preview(value: unknown, max = 48): string {
  if (typeof value === "function") return "ƒ (function)";
  let text: string;
  try {
    text = JSON.stringify(value) ?? String(value);
  } catch {
    text = String(value);
  }
  text = text.replace(/,(?=["{[\w])/g, ", ");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** A hex color for `<input type="color">`, which only takes `#rrggbb`. */
export function hex(value: unknown): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (/^#[0-9a-f]{6}$/i.test(s)) return s;
  if (/^#[0-9a-f]{3}$/i.test(s))
    return `#${[...s.slice(1)].map(c => c + c).join("")}`;
  return "#000000";
}

/** Whether `options` fit a segmented control rather than a menu. */
export function segmented(options: unknown[]): boolean {
  return (
    options.length > 1 &&
    options.length <= SEGMENT_OPTIONS &&
    options.every(o => String(o).length <= SEGMENT_LABEL)
  );
}

function Toggle({value, id, describedBy, onChange}: InputProps) {
  return (
    <span class="d3p-switch">
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-describedby={describedBy}
        checked={Boolean(value)}
        onChange={e => onChange(e.currentTarget.checked)}
      />
      <span class="d3p-switch-track" aria-hidden="true" />
      <span class="d3p-switch-state" aria-hidden="true">
        {value ? "true" : "false"}
      </span>
    </span>
  );
}

function Choice({spec, value, id, describedBy, onChange}: InputProps) {
  const options = spec.options || [];
  const index = options.findIndex(o => o === value);
  if (segmented(options))
    return (
      <div
        class="d3p-choice"
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
      >
        {options.map((o, i) => (
          <label key={i}>
            <input
              type="radio"
              name={id}
              checked={i === index}
              onChange={() => onChange(o)}
            />
            <span>{String(o)}</span>
          </label>
        ))}
      </div>
    );
  return (
    <select
      id={id}
      class="d3p-field"
      aria-describedby={describedBy}
      value={index < 0 ? "" : String(index)}
      onChange={e => onChange(options[Number(e.currentTarget.value)])}
    >
      {index < 0 && <option value="">—</option>}
      {options.map((o, i) => (
        <option key={i} value={String(i)}>
          {String(o)}
        </option>
      ))}
    </select>
  );
}

function Input(props: InputProps) {
  const {spec, value, id, describedBy, onChange} = props;
  switch (spec.control) {
    case "boolean":
      return <Toggle {...props} />;
    case "radio":
    case "select":
      return <Choice {...props} />;
    case "number":
      return (
        <input
          id={id}
          class="d3p-field"
          type="number"
          aria-describedby={describedBy}
          value={typeof value === "number" ? value : ""}
          onChange={e => {
            const n = e.currentTarget.valueAsNumber;
            if (!Number.isNaN(n)) onChange(n);
          }}
        />
      );
    case "color":
      return (
        <span class="d3p-field d3p-color">
          <input
            type="color"
            aria-label={`${spec.key} swatch`}
            value={hex(value)}
            onInput={e => onChange(e.currentTarget.value)}
          />
          <input
            id={id}
            type="text"
            spellcheck={false}
            aria-describedby={describedBy}
            value={typeof value === "string" ? value : ""}
            onChange={e => onChange(e.currentTarget.value)}
          />
        </span>
      );
    default:
      return (
        <input
          id={id}
          class="d3p-field"
          type="text"
          spellcheck={false}
          aria-describedby={describedBy}
          value={typeof value === "string" ? value : ""}
          onChange={e => onChange(e.currentTarget.value)}
        />
      );
  }
}

/** A form of the chart's scalar config; each change rewrites the code. */
export default function Controls({
  id,
  controls,
  config,
  onChange,
  onEditCode,
}: ControlsProps) {
  if (!controls.length)
    return (
      <p class="d3p-empty">
        This example has no simple controls; edit the code.
      </p>
    );
  return (
    <div class="d3p-controls">
      {controls.map(spec => {
        const inputId = `${id}-${spec.key}`;
        const descId = spec.description ? `${inputId}-desc` : undefined;
        const value = current(spec, config);
        const editable = representable(spec, value);
        // A segmented control is a group of radios, named by the key; a value
        // left to the code has no input to label.
        const Key =
          editable && !segmented(spec.options || []) ? "label" : "span";
        return (
          <div class={`d3p-control is-${spec.control}`} key={spec.key}>
            <Key
              class="d3p-control-key"
              id={`${inputId}-label`}
              for={Key === "label" ? inputId : undefined}
            >
              {spec.key}
            </Key>
            {spec.description && (
              <div
                class="d3p-control-desc"
                id={descId}
                dangerouslySetInnerHTML={{__html: spec.description}}
              />
            )}
            {editable ? (
              <Input
                spec={spec}
                id={inputId}
                describedBy={descId}
                value={value}
                onChange={v => onChange(spec.key, v)}
              />
            ) : (
              <div class="d3p-coded">
                <code>{preview(value)}</code>
                <button type="button" onClick={onEditCode}>
                  Edit in code
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
