import type {NodeState} from "./states.js";
import {explain} from "./states.js";
import type {TreeNode} from "./tree.js";
import {tipStyle} from "./view.js";

/** What the page knows about a chart, from the API manifest. */
export interface ChartInfo {
  /** The chart's docs page. */
  href: string;
  /** The first sentence of its description. */
  description: string;
  /** The framework flavors its code can be shown in. */
  flavors: string[];
}

interface TreeTipProps {
  node: TreeNode;
  state: NodeState | undefined;
  /** Whether no data is loaded yet. */
  idle: boolean;
  info?: ChartInfo;
  /** Where to float the tip: beside a node in a tree `width` wide. */
  position?: {x: number; y: number; width: number; outline: boolean};
  /** Renders text only, as a screen reader's description of the node. */
  plain?: boolean;
}

/**
 * Why a node of the decision tree is lit or dim: what the data has that it
 * needs (✓), and what it still needs (✗).
 */
export default function TreeTip({
  node,
  state,
  idle,
  info,
  position,
  plain,
}: TreeTipProps) {
  const {found, missing} = explain(state);
  const leaf = !!node.chart;
  const about = leaf ? info?.description : node.hint;
  const status = idle
    ? "Load data to see whether it fits."
    : state?.lit
      ? leaf
        ? "Your data fits: click to draw it."
        : "Your data fits this shape."
      : state?.fits
        ? "Your data fits this shape, but none of its charts."
        : "Your data doesn't fit yet.";
  if (plain)
    return (
      <>
        {[
          about,
          status,
          missing.length && !idle ? `It ${missing.join("; ")}.` : "",
        ]
          .filter(Boolean)
          .join(" ")}
      </>
    );
  return (
    <div
      class={`d3p-tree-tip${state?.lit && !idle ? " is-lit" : ""}`}
      style={position ? tipStyle(position, leaf) : undefined}
      aria-hidden="true"
    >
      <strong>{node.label}</strong>
      {about && <p>{about}</p>}
      {!idle && (missing.length > 0 || found.length > 0) && (
        <ul>
          {missing.map(text => (
            <li key={text} class="is-missing">
              {text}
            </li>
          ))}
          {found.map(text => (
            <li key={text} class="is-found">
              {text}
            </li>
          ))}
        </ul>
      )}
      <p class="d3p-tree-status">{status}</p>
    </div>
  );
}
