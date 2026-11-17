import {useLayoutEffect, useMemo, useRef, useState} from "preact/hooks";

import {elbow, OUTLINE_BELOW, outline, placeTree} from "./layout.js";
import type {Placed, TreeLayout} from "./layout.js";
import type {NodeState} from "./states.js";
import TreeTip from "./TreeTip.js";
import type {ChartInfo} from "./TreeTip.js";
import type {TreeNode} from "./tree.js";
import {nodeClasses as classes, onPath} from "./view.js";

interface DecisionTreeProps {
  id: string;
  tree: TreeNode;
  /** Each node's state by key, or null before any data is loaded. */
  states: Map<string, NodeState> | null;
  selected: string | null;
  onSelect: (key: string, chart: string) => void;
  info: Record<string, ChartInfo>;
}

/** Tracks an element's width as it resizes. */
function useWidth() {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);
  return {host, width};
}

/** Measures each branch label, so links can start at its right edge. */
function useBranchWidths(
  host: {current: HTMLDivElement | null},
  layout: TreeLayout | null,
) {
  const [widths, setWidths] = useState<Record<string, number>>({});
  useLayoutEffect(() => {
    const el = host.current;
    if (!el || !layout) return;
    const next: Record<string, number> = {};
    el.querySelectorAll<HTMLElement>("[data-key]").forEach(node => {
      next[node.dataset.key!] = node.offsetWidth;
    });
    setWidths(next);
  }, [layout]);
  return widths;
}

/**
 * One node of the tree: a branch's label, or a chart's button, which draws
 * the chart when lit and shows why not when dim.
 */
function TreeNodeView(props: {
  placed: Placed;
  describedBy: string;
  state: NodeState | undefined;
  className: string;
  idle: boolean;
  pressed: boolean;
  info: Record<string, ChartInfo>;
  onSelect: (key: string, chart: string) => void;
  onShow: (key: string) => void;
  hover: Record<string, () => void>;
}) {
  const {placed: n, state, className, idle, hover} = props;
  const style = {left: `${n.x}px`, top: `${n.y}px`};
  const chart = n.node.chart;
  if (!chart)
    return (
      <span
        data-key={n.key}
        class={`d3p-tree-branch ${className}`}
        style={style}
        {...hover}
      >
        {n.node.label}
      </span>
    );
  const lit = !idle && !!state?.lit;
  return (
    <button
      type="button"
      class={`d3p-tree-leaf ${className}`}
      style={style}
      aria-pressed={props.pressed}
      aria-disabled={!lit}
      aria-describedby={props.describedBy}
      onClick={() => (lit ? props.onSelect(n.key, chart) : props.onShow(n.key))}
      {...hover}
    >
      <span class="d3p-tree-dot" aria-hidden="true" />
      {n.node.label}
      <span class="d3p-sr" id={props.describedBy}>
        <TreeTip
          node={n.node}
          state={state}
          idle={idle}
          info={props.info[chart]}
          plain
        />
      </span>
    </button>
  );
}

/**
 * The decision tree from data shapes to charts: a dendrogram on wide
 * screens, an outline on narrow ones. Branches and charts the data supports
 * light up; hovering or focusing a node says why it is lit or dim, and a lit
 * chart draws when clicked.
 */
export default function DecisionTree(props: DecisionTreeProps) {
  const {id, tree, states, selected, onSelect, info} = props;
  const {host, width} = useWidth();
  const [active, setActive] = useState<string | null>(null);
  const layout = useMemo(
    () => (width ? placeTree(tree, width) : null),
    [tree, width],
  );
  const widths = useBranchWidths(host, layout);
  const outlined = width < OUTLINE_BELOW;
  const idle = !states;
  const flags = {idle, selected, active};
  const byKey = new Map(layout?.nodes.map(n => [n.key, n]));

  const link = (n: Placed) => {
    const p = byKey.get(n.parent!)!;
    if (outlined) return outline(p.x + 9, p.y + 9, n.x, n.y);
    const start = p.x + (widths[p.key] ?? 80);
    return elbow(start, p.y, n.x, n.y, Math.min(start + 14, n.x - 10));
  };
  const hover = (key: string) => ({
    onMouseEnter: () => setActive(key),
    onFocus: () => setActive(key),
    onBlur: () => setActive(a => (a === key ? null : a)),
  });
  const rank = (key: string) =>
    +!!states?.get(key)?.lit +
    2 * +onPath(key, selected) +
    4 * +onPath(key, active);
  const activeNode = active ? byKey.get(active) : undefined;

  return (
    <div
      class={`d3p-tree${outlined ? " is-outline" : ""}${idle ? " is-idle" : ""}`}
      ref={host}
      style={{height: layout ? `${layout.height}px` : undefined}}
      onMouseLeave={() => setActive(null)}
    >
      {layout && (
        <svg
          class="d3p-tree-links"
          width={layout.width}
          height={layout.height}
          aria-hidden="true"
        >
          {layout.nodes
            .filter(n => n.parent)
            // Lit, selected, and hovered links draw over the others they
            // share a path with.
            .sort((a, b) => rank(a.key) - rank(b.key))
            .map(n => (
              <path
                key={n.key}
                d={link(n)}
                class={classes(n.key, states?.get(n.key), flags)}
              />
            ))}
        </svg>
      )}
      {layout?.nodes.map((n, i) => (
        <TreeNodeView
          key={n.key}
          placed={n}
          describedBy={`${id}-why-${i}`}
          state={states?.get(n.key)}
          className={classes(n.key, states?.get(n.key), flags)}
          idle={idle}
          pressed={selected === n.key}
          info={info}
          onSelect={onSelect}
          onShow={setActive}
          hover={hover(n.key)}
        />
      ))}
      {activeNode && layout && (
        <TreeTip
          node={activeNode.node}
          state={states?.get(activeNode.key)}
          idle={idle}
          info={activeNode.node.chart ? info[activeNode.node.chart] : undefined}
          position={{
            x: activeNode.x,
            y: activeNode.y,
            width: layout.width,
            outline: outlined,
          }}
        />
      )}
    </div>
  );
}
