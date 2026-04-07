import {extent, min, max} from "d3-array";
import {hierarchy, tree} from "d3-hierarchy";
import {scaleLinear} from "d3-scale";
import type {DataPoint} from "@d3plus/data";

import {colorContrast, colorDefaults} from "@d3plus/color";
import {assign, backgroundColor, elem} from "@d3plus/dom";
import {merge, nest} from "@d3plus/data";
import {configPrep, constant} from "../utils/index.js";
import * as shapes from "../shapes/index.js";
import type Shape from "../shapes/Shape.js";
import {legendLabel} from "./drawSteps/drawLegend.js";

import Viz from "./Viz.js";

/**
    Uses d3's [tree layout](https://github.com/d3/d3-hierarchy#tree) to create a tidy tree chart based on an array of data.
*/
export default class Tree extends Viz {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();

    this._orient = "vertical";
    this._separation = (a: any, b: any) => (a.parent === b.parent ? 1 : 2);

    this._legendTooltip = assign(this._legendTooltip, {
      title: legendLabel.bind(this),
    });
    this._previousShapes = [];

    this._shape = constant("Circle");
    this._shapeConfig = assign(this._shapeConfig, {
      ariaLabel: (d: any, i: any) =>
        this._treeData
          ? `${this._treeData[i].depth}. ${this._drawLabel(d, i)}.`
          : "",
      labelConfig: {
        fontColor: () => {
          const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
          return colorContrast(bg);
        },
      },
      Path: {
        fill: "none",
        stroke: colorDefaults.missing,
        strokeWidth: 2,
      },
      r: constant(7),
      width: constant(12),
      height: constant(12),
    });

    this._tooltipConfig = assign(this._tooltipConfig, {
      title: (d: any, i: any, x: any) => this._drawLabel(d, i, x.depth - 1),
    });

    this._tree = tree();
  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
*/
  _draw(callback?: () => void) {
    (super._draw as (...args: unknown[]) => unknown)(callback);

    const isVertical = this._orient === "vertical";
    const isHorizontal = this._orient === "horizontal";

    const height = isVertical
        ? this._height - this._margin.top - this._margin.bottom
        : this._width - this._margin.left - this._margin.right,
      left = isVertical ? "left" : "top",
      that = this,
      transform = `translate(${this._margin.left}, ${this._margin.top})`,
      width = isHorizontal
        ? this._height - this._margin.top - this._margin.bottom
        : this._width - this._margin.left - this._margin.right;

    const treeData = (this._treeData = this._tree
      .separation(this._separation)
      .size([width, height])(
        hierarchy(
          {
            key: "root",
            values: nest(
              this._filteredData,
              this._groupBy.slice(0, this._drawDepth + 1),
            ),
          } as Record<string, unknown>,
          (d: Record<string, unknown>) =>
            d.key && d.values ? (d.values as Record<string, unknown>[]) : null,
        ).sort(this._sort),
      )
      .descendants()
      .filter((d: any) => d.depth <= this._groupBy.length && d.parent));

    /**
        Merges the values of a given nest branch.
        @private
*/
    function flattenBranchData(branch: any) {
      return merge(
        branch.values.map((l: any) => (l.key && l.values ? flattenBranchData(l) : l)),
        that._aggs,
      );
    }

    treeData.forEach((d: any, i: any) => {
      if (d.data.key && d.data.values) d.data = flattenBranchData(d.data);
      d.__d3plus__ = true;
      d.i = i;
    });

    let r = this._shapeConfig.r;
    if (typeof r !== "function") r = constant(r);
    type TreeNode = (typeof treeData)[number];
    const rBufferRoot = max(treeData, (d: TreeNode) =>
      d.depth === 1 ? r(d.data, (d as unknown as {i: number}).i) : 0,
    );
    const rBufferEnd = max(treeData, (d: TreeNode) =>
      d.children ? 0 : r(d.data, (d as unknown as {i: number}).i),
    );

    const yExtent = extent(treeData, (d: TreeNode) => d.y) as unknown as [number, number];
    this._labelHeight = min([
      isVertical ? 50 : 100,
      (yExtent[1] -
        (rBufferRoot as unknown as number) -
        (rBufferEnd as unknown as number)) /
        (this._groupBy.length + 1),
    ]);

    this._labelWidths = nest(
      treeData as DataPoint[],
      ((d: DataPoint) => d.depth) as (
        d: DataPoint,
      ) => string | number | boolean,
    ).map(d =>
      d.values.reduce((num: number, v, i: number) => {
        const vals = d.values as DataPoint[];
        const next =
            i < vals.length - 1
              ? ((vals[i + 1] as DataPoint).x as number)
              : width + this._margin[left],
          prev = i
            ? ((vals[i - 1] as DataPoint).x as number)
            : this._margin[left];
        return min([
          num,
          next - ((v as DataPoint).x as number),
          ((v as DataPoint).x as number) - prev,
        ])!;
      }, width),
    );

    const yScale = scaleLinear()
      .domain(yExtent)
      .range([
        (rBufferRoot as unknown as number) + this._labelHeight,
        height - (rBufferEnd as unknown as number) - this._labelHeight,
      ]);

    treeData.forEach((d: any) => {
      const val = yScale(d.y);
      if (isHorizontal) {
        d.y = d.x;
        d.x = val;
      } else d.y = val;
    });

    const elemObject = {
      parent: this._select,
      enter: {transform},
      update: {transform},
    };

    this._shapes.push(
      new shapes.Path()
        .data(treeData.filter((d: any) => d.depth > 1).map((d: any) => assign({}, d)) as any)
        .select(elem("g.d3plus-Tree-Links", elemObject).node())
        .config((configPrep as any).bind(this as any)(this._shapeConfig, "shape", "Path"))
        .config({
          d: (d: any) => {
            let r = this._shapeConfig.r;

            if (typeof r === "function") r = r(d.data, d.i);

            const px = d.parent.x - d.x + (isVertical ? 0 : r),
              py = d.parent.y - d.y + (isVertical ? r : 0),
              x = isVertical ? 0 : -r,
              y = isVertical ? -r : 0;

            return isVertical
              ? `M${x},${y}C${x},${(y + py) / 2} ${px},${(y + py) / 2} ${px},${py}`
              : `M${x},${y}C${(x + px) / 2},${y} ${(x + px) / 2},${py} ${px},${py}`;
          },
          id: (d: any, i: any) => this._ids(d, i)[d.depth - 1],
        } as any)
        .render(),
    );

    const shapeConfig = {
      id: (d: any, i: any) => this._ids(d, i)[d.depth - 1],
      label: (d: any, i: any) => {
        if (this._label) return this._label(d.data, i);
        const ids = this._ids(d, i).slice(0, d.depth);
        return ids[ids.length - 1];
      },
      labelConfig: {
        textAnchor: (d: any, i: any, x: any) =>
          isVertical
            ? "middle"
            : x.children && x.depth !== this._drawDepth + 1
              ? "end"
              : "start",
        verticalAlign: (d: any, i: any, x: any) =>
          isVertical ? (x.depth === 1 ? "bottom" : "top") : "middle",
      },
      hitArea: (d: any, i: any, s: any) => {
        const h = this._labelHeight,
          offset = s.r ? s.r : isVertical ? s.height / 2 : s.width / 2,
          w = this._labelWidths[d.depth - 1];

        return {
          width: isVertical ? w : offset * 2 + w,
          height: isHorizontal ? h : offset * 2 + h,
          x: isVertical
            ? -w / 2
            : d.children && d.depth !== this._groupBy.length
              ? -(offset + w)
              : -offset,
          y: isHorizontal
            ? -h / 2
            : d.children && d.depth !== this._groupBy.length
              ? -(offset + this._labelHeight)
              : -offset,
        };
      },
      labelBounds: (d: any, i: any, s: any) => {
        const h = this._labelHeight,
          height = isVertical ? "height" : "width",
          offset = s.r ? s.r : isVertical ? s.height / 2 : s.width / 2,
          w = this._labelWidths[d.depth - 1],
          width = isVertical ? "width" : "height",
          x = isVertical ? "x" : "y",
          y = isVertical ? "y" : "x";

        return {
          [width]: w,
          [height]: h,
          [x]: -w / 2,
          [y]:
            d.children && d.depth !== this._groupBy.length
              ? -(offset + h)
              : offset,
        };
      },
    };

    const shapeData = nest(treeData as any, (d: any) => this._shape(d.data));
    const dataShapes = shapeData.map((d: any) => d.key);
    const exitShapes = this._previousShapes.filter(
      (d: any) => !dataShapes.includes(d),
    );

    shapeData
      .concat(exitShapes.map((key: any) => ({key, values: []})))
      .forEach(({key, values}: any) => {
        this._shapes.push(
          new (shapes as unknown as Record<string, new () => Shape>)[
            key as string
          ]()
            .data(values as DataPoint[])
            .select(elem(`g.d3plus-Tree-${key}`, elemObject).node())
            .config((configPrep as any).bind(this as any)(this._shapeConfig, "shape", key as string | false))
            .config(shapeConfig as any)
            .render(),
        );
      });

    this._previousShapes = dataShapes;

    return this;
  }

  /**
      Changes the orientation of the entire Tree, either "vertical" (top to bottom) or "horizontal" (left to right).
*/
  orient(_: any) {
    return arguments.length ? ((this._orient = _), this) : this._orient;
  }

  /**
      The separation function between neighboring nodes.

From the [d3-hierarchy documentation](https://github.com/d3/d3-hierarchy#tree_separation):
> The separation accessor is used to separate neighboring nodes. The separation function is passed two nodes a and b, and must return the desired separation. The nodes are typically siblings, though the nodes may be more distantly related if the layout decides to place such nodes adjacent.

@example
function separation(a, b) {
  return a.parent === b.parent ? 1 : 2;
}
*/
  separation(_: any) {
    return arguments.length ? ((this._separation = _), this) : this._separation;
  }
}
