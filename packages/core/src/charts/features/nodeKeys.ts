/**
    Moving a chart's focused node from the keyboard (Network, Sankey): with
    a node focused by keyboard navigation, Shift and an arrow key nudge it
    `NODE_KEY_STEP` pixels, and Shift+Backspace puts it back (a Network node
    is let go, a Sankey node returns to its laid-out place). Each change is
    announced through keyboard navigation's live region. Plain arrow keys
    keep moving the focus between marks.

    @module
*/

import type {SceneNode} from "@d3plus/render";

import type {KeyboardGesture} from "../viz/keyboardNavHost.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** How far one key press moves a node, in pixels. */
export const NODE_KEY_STEP = 10;

/** Arrow keys and the move each makes, `[dx, dy]` in steps. */
const ARROW_STEPS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** How a chart moves its nodes from the keyboard. */
export interface NodeKeys {
  /** The id of the node the focused mark (by its scene key) draws, or null. */
  nodeAt(key: string): string | null;
  /** Moves the node by `[dx, dy]` pixels; true when it moved. */
  nudge(id: string, by: [number, number]): boolean;
  /** Puts the node back; true when it had been moved. */
  reset(id: string): boolean;
  /** Whether the nodes may be moved now. */
  enabled(): boolean;
  /** Whether nodes move up and down only (Sankey). */
  vertical?: boolean;
  /** The announcement for a nudge and for a reset, before `{0}` is the node's name. */
  messages: {nudge: string; reset: string};
  /** The instructions read with keyboard navigation's own. */
  instructions: string;
}

/**
    The move a key makes, `[dx, dy]` in pixels: Shift and an arrow key (only
    up and down when `vertical`), or null for any other key.
    @param event The key press.
    @param vertical Whether only up and down move.
*/
export function nodeKeyStep(
  event: Pick<KeyboardEvent, "key" | "shiftKey">,
  vertical = false,
): [number, number] | null {
  const step = event.shiftKey ? ARROW_STEPS[event.key] : undefined;
  if (!step || (vertical && step[0])) return null;
  return [step[0] * NODE_KEY_STEP, step[1] * NODE_KEY_STEP];
}

/**
    The keys `nodeKeyStep` and Shift+Backspace answer, as
    `aria-keyshortcuts` lists them.
    @param vertical Whether only up and down move.
*/
export function nodeKeyShortcuts(vertical = false): string {
  const arrows = vertical
    ? ["ArrowUp", "ArrowDown"]
    : ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  return [...arrows, "Backspace"].map(key => `Shift+${key}`).join(" ");
}

/** The scene node keyed `key` among `nodes` and their children. */
function sceneNode(nodes: SceneNode[], key: string): SceneNode | undefined {
  for (const n of nodes) {
    if (String(n.key) === key) return n;
    const children = (n as {children?: SceneNode[]}).children;
    const found = children && sceneNode(children, key);
    if (found) return found;
  }
  return undefined;
}

/**
    The focused node's id and name (its accessible label, without the
    closing period), when keyboard navigation has a node focused.
*/
function focusedNode(
  viz: VizInstance,
  keys: NodeKeys,
): {id: string; name: string} | null {
  const current = viz._keyboardNav?.current;
  const id = current ? keys.nodeAt(current) : null;
  if (!current || id === null) return null;
  const node = sceneNode(viz._paintedScene?.root.children ?? [], current);
  const name = (node?.aria?.label ?? "").replace(/\.$/, "");
  return {id, name: name || id};
}

/**
    Installs the node keys as the chart's `viz._keyboardGesture`, which
    keyboard navigation consults before moving between marks.
    @param viz The chart.
    @param keys How the chart moves its nodes.
*/
export function installNodeKeys(viz: VizInstance, keys: NodeKeys): void {
  const announce = (message: string, name: string): void => {
    const nav = viz._keyboardNav;
    if (!nav) return;
    const text = viz.schema.translate(message, undefined, name);
    // Announced by the focus the repaint re-enters, or now when none does.
    nav.announce = text;
    nav.live.textContent = text;
  };
  const gesture: KeyboardGesture = {
    keydown(event) {
      if (!keys.enabled()) return false;
      const by = nodeKeyStep(event, keys.vertical);
      const reset = event.shiftKey && event.key === "Backspace";
      if (!by && !reset) return false;
      const node = focusedNode(viz, keys);
      if (!node) return false;
      if (reset) {
        if (keys.reset(node.id)) announce(keys.messages.reset, node.name);
      } else if (keys.nudge(node.id, by!))
        announce(keys.messages.nudge, node.name);
      return true;
    },
    keys: () =>
      keys.enabled()
        ? {
            shortcuts: nodeKeyShortcuts(keys.vertical),
            instructions: viz.schema.translate(keys.instructions),
          }
        : null,
  };
  viz._keyboardGesture = gesture;
}
