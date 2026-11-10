/**
    ParallelCoordinates chrome: the axes and their titles hold no data and
    stay out of hit-testing, all but the labels with an axis tooltip to show.
*/
import type {SceneNode} from "@d3plus/render";

import {inertAxis} from "../../components/Axis/axisTooltipTargets.js";

/** Removes the data from a scene subtree, in place. */
function dataless(node: SceneNode): SceneNode {
  delete node.datum;
  delete node.index;
  if (node.type === "group") node.children.forEach(dataless);
  return node;
}

/**
    A copy of an axis's or title's scene as chrome (see `inertAxis`), without
    its data: the pointer passes through it to the lines, and catches only on
    a label stamped with a tooltip target.
    @param node An axis's or title's scene, or a node in it.
*/
export function chromeNode(node: SceneNode): SceneNode {
  return dataless(inertAxis(node));
}
