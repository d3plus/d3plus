import type {Check} from "./rules.js";
import type {Traits} from "./traits.js";
import {nodeKey} from "./tree.js";
import type {TreeNode} from "./tree.js";

/** How the data meets one node: lit or not, and the checks that decided it. */
export interface NodeState {
  /** Whether the data meets the node's rules and, for a branch, one of its charts'. */
  lit: boolean;
  /** Whether the data meets the node's own rules and its ancestors'. */
  fits: boolean;
  /** Every check of the node and its ancestors, outermost first. */
  checks: Check[];
}

/** Evaluates every node of a tree against a dataset's traits, by key. */
export function evaluate(
  tree: TreeNode,
  traits: Traits,
): Map<string, NodeState> {
  const states = new Map<string, NodeState>();
  const visit = (
    node: TreeNode,
    path: string[],
    inherited: Check[],
  ): boolean => {
    const own = node.rules.map(r => r(traits));
    const checks = [...inherited, ...own];
    const key = nodeKey([...path, node.id]);
    const fits = checks.every(c => c.ok);
    const lit = node.children
      ? node.children
          .map(child => visit(child, [...path, node.id], checks))
          .some(Boolean) && fits
      : fits;
    states.set(key, {lit, fits, checks});
    return lit;
  };
  visit(tree, [], []);
  return states;
}

/** Every leaf of a tree, with its key. */
export function leaves(tree: TreeNode): {key: string; node: TreeNode}[] {
  const out: {key: string; node: TreeNode}[] = [];
  const visit = (node: TreeNode, path: string[]) => {
    const next = [...path, node.id];
    if (node.children) node.children.forEach(c => visit(c, next));
    else out.push({key: nodeKey(next), node});
  };
  visit(tree, []);
  return out;
}

/**
 * What a node's checks say, deduplicated: what the data has that the node
 * needs, and what it still needs.
 */
export function explain(state: NodeState | undefined): {
  found: string[];
  missing: string[];
} {
  const found = new Set<string>();
  const missing = new Set<string>();
  for (const check of state?.checks ?? [])
    (check.ok ? found : missing).add(check.text);
  return {found: [...found], missing: [...missing]};
}
