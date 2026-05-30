/**
    `emitLabels(opts)` — pure label scene emitter.

    Given the same inputs a Shape would consume (data + per-datum x/y/width/
    height/label/labelBounds accessors + labelConfig), returns the array of
    text SceneNodes a chart's `emit()` would otherwise harvest by spinning up
    a transient Shape in compute mode. Composes `buildLabelData` (pure label
    record expansion) with `TextBox.toScene()` (pure scene-node production).
*/

import {colorContrast} from "@d3plus/color";

import TextBox from "../components/TextBox.js";
import {buildLabelData} from "./buildLabelData.js";
import type {BuildLabelDataOpts} from "./buildLabelData.js";
import type {SceneNode} from "@d3plus/render";

/** Defaults that match Shape's `_labelConfig` so chart emits look like Shape labels. */
const shapeLabelDefaults = {
  fontMin: 8,
  fontMax: 50,
  fontResize: true,
  padding: 5,
  textAnchor: "start",
  verticalAlign: "top",
  // Honor the rotation/anchor `buildLabelData` precomputes onto each record
  // (`.r` / `.rotateAnchor`). TextBox's `rotate` accessor receives the raw
  // label record; `rotateAnchor` receives the laid-out datum whose `.data`
  // is that record — so both shapes are checked.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rotate(d: any) {
    const r = d?.r ?? d?.data?.r;
    return typeof r === "number" ? r : 0;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rotateAnchor(d: any) {
    const ra = d?.rotateAnchor ?? d?.data?.rotateAnchor;
    return Array.isArray(ra) ? ra : [(d?.w ?? 0) / 2, (d?.h ?? 0) / 2];
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fontColor(this: any, d: any, i: number) {
    const fill = typeof this._fill === "function" ? this._fill(d, i) : this._fill;
    return typeof fill === "string" ? colorContrast(fill) : "black";
  },
};

export interface EmitLabelsOpts extends BuildLabelDataOpts {
  /** TextBox config overrides (merged on top of Shape-equivalent defaults). */
  labelConfig?: Record<string, unknown>;
}

export function emitLabels(opts: EmitLabelsOpts): SceneNode[] {
  const labelData = buildLabelData(opts);
  if (!labelData.length) return [];
  const tb = new TextBox()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .config({...shapeLabelDefaults, ...(opts.labelConfig ?? {})} as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .data(labelData as any)
    .renderMode("compute");
  try {
    const scene = tb.toScene();
    return Array.isArray(scene?.children) ? (scene.children as SceneNode[]) : [];
  } catch {
    return [];
  }
}
