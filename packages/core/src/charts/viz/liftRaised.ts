/**
    Brings raised marks (see `applyInteractionOpacity`) out to the front of
    the clip groups a Plot wraps its marks in. The backends order each
    group's children by `z`, so a raised mark inside a break mask or domain
    clip would rise only among the marks in that group, under the labels
    and other runs beside it. Raising the whole group would carry every
    other mark in it over those labels too, so the raised marks move to a
    copy of the group's chain instead (same clips, so they stay cut where
    they were), placed after it and raised.
*/
import type {GroupNode, SceneNode} from "@d3plus/render";

import {isBreakMask} from "../Plot/plotBreaks.js";
import {isDomainClip} from "../Plot/domainClip.js";

/** z that floats a hovered, active or highlighted node above its (z-less, i.e. 0) siblings. */
export const RAISE_Z = 1e6;

/** Suffix of the key of the copy that carries a clip group's raised marks. */
export const RAISED_KEY_SUFFIX = "~raised";

/** Whether a node is one of the clip groups a Plot wraps its marks in. */
export const isClipWrapper = (node: SceneNode): boolean =>
  node.type === "group" && (isBreakMask(node) || isDomainClip(node));

const isRaised = (node: SceneNode): boolean => node.z === RAISE_Z;

/**
    Splits a clip group into itself without its raised marks and a copy of
    it holding only them (with the copies of any clip groups inside it), or
    no copy when nothing in it is raised.
*/
function split(group: GroupNode): [GroupNode, GroupNode | undefined] {
  const kept: SceneNode[] = [];
  const lifted: SceneNode[] = [];
  for (const child of group.children) {
    if (child.type === "group" && isClipWrapper(child)) {
      const [rest, copy] = split(child);
      kept.push(rest);
      if (copy) lifted.push(copy);
    } else if (isRaised(child)) lifted.push(child);
    else kept.push(child);
  }
  if (!lifted.length) return [group, undefined];
  return [
    {...group, children: kept},
    {...group, children: lifted},
  ];
}

/**
    Moves the raised marks inside each outermost clip group of `nodes` (at
    any depth) into a raised copy of it, right after it. Returns `nodes`
    itself when nothing moves.
*/
export function liftRaised(nodes: SceneNode[]): SceneNode[] {
  let changed = false;
  const out = nodes.flatMap((node): SceneNode[] => {
    if (node.type !== "group") return [node];
    if (isClipWrapper(node)) {
      const [rest, copy] = split(node);
      if (!copy) return [node];
      changed = true;
      return [
        rest,
        {...copy, key: `${copy.key}${RAISED_KEY_SUFFIX}`, z: RAISE_Z},
      ];
    }
    const children = liftRaised(node.children);
    if (children === node.children) return [node];
    changed = true;
    return [{...node, children}];
  });
  return changed ? out : nodes;
}
