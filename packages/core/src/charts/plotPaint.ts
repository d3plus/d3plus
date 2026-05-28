/* eslint no-cond-assign: 0 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/**
    `plotPaint(viz, pCtx)` — the Plot paint phase as a free function.

    RFC §3.1 architectural seam for Plot, sibling to `runVizPipeline(viz)`.
    The paint phase (production axis rendering, shape buffer setup, and
    shape emission with event handlers) used to live as `Plot._paint`;
    extracting it lets callers drive the paint step without going
    through the class. `Plot._paint` is now a thin shim that calls into
    here, so behavior is unchanged.

    @param viz The Plot instance (or any subclass: BarChart, LinePlot, …).
    @param pCtx Cross-phase locals produced by `Plot._draw` — see the
                destructure block below for the full schema.
*/

import {groups, max, merge, range} from "d3-array";
import * as scales from "d3-scale";

import type {DataPoint} from "@d3plus/data";
import {assign} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";

import * as shapes from "../shapes/index.js";
import {absorbShapeIntoChartScene, shapeConfigFor} from "./emitHelpers.js";

export function plotPaint(viz: any, pCtx: any): void {
    // Paint phase. All cross-phase locals captured from _draw's pre-super
    // pipeline + measure work are received via `pCtx`. Body below is the
    // original imperative paint code (axis painting, shape buffer setup,
    // shape emission with event handlers), unchanged in semantics — just
    // moved to its own method so the data/paint boundary is explicit.
    //
    // The destructure is split into themed chunks as a table of contents:
    // readers can scan the categories instead of memorizing 40 names.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    // Data & domain inputs (computed by formatPlotData / computePlotInitialDomains).
    const {data, shapeData, axisData, domains, discreteKeys, stackData, stackKeys, xData, yData, x2Data, y2Data, xDomain, yDomain, x2Domain, y2Domain} = pCtx;
    // Accessors / scales (from computePlotScales). `x`/`y` are reassigned
    // below where Plot caches the resolved accessors back onto `viz._xFunc`
    // / `viz._yFunc`; the other names are read-only.
    let {x, y} = pCtx;
    const {x2, y2, xScale, yScale, xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale} = pCtx;
    // Axis configs & visibility flags.
    const {defaultConfig, defaultX2Config, defaultY2Config, showX, showY, x2Exists, y2Exists, xC, yC} = pCtx;
    // Axis measurements (from preparePlotAxisLayout): tick values + label
    // bounds + test-axis bounds. `xTicks`/`yTicks`/`x2Ticks`/`y2Ticks` carried
    // by `pCtx`; reads pass through directly.
    const {xTicks, yTicks, x2Ticks, y2Ticks, labelWidths, largestLabel, xRangeMax, xTest, yTest, x2Test, y2Test, xTestRange, x2TestRange} = pCtx;
    // Layout offsets & viewport. `yBounds`/`yWidth`/`xOffsetLeft`/`y2Bounds`/
    // `y2Width`/`xOffsetRight` are *re*-computed below from the production
    // axes; the initial values from `pCtx` are the throwaway test-axis
    // measurements and get overwritten in this method's body.
    let {yBounds, y2Bounds, yWidth, y2Width, xOffsetLeft, xOffsetRight} = pCtx;
    const {xHeight, x2Height, topOffset, height, width, horizontalMargin, verticalMargin} = pCtx;
    // Paint plumbing (DOM parent + transition + stack accumulator + label flags).
    const {parent, transition, opp, barLabels, showLineLabels, stackGroup} = pCtx;
    /* eslint-enable @typescript-eslint/no-explicit-any */

    let yRange = [x2Height, height - (xHeight + topOffset + verticalMargin)];

    if (showY) {
      yTest
        .domain(yDomain)
        .height(height)
        .maxSize(width / 2)
        .range(yRange)
        .ticks(yTicks)
        .width(width)
        .config(yC)
        .config(viz._yConfig)
        .scale(yConfigScale)
        .measure();
    }

    yBounds = yTest.outerBounds();
    yWidth = yBounds.width ? yBounds.width + yTest.padding() : undefined;
    xOffsetLeft = max([yWidth, xTestRange[0], x2TestRange[0]]);

    if (y2Exists) {
      y2Test
        .config(yC)
        .domain(y2Domain)
        .gridSize(0)
        .height(height)
        .range(yRange)
        .width(width - max([0, xOffsetRight - y2Width])!)
        .title(false)
        .config(viz._y2Config)
        .config(defaultY2Config)
        .scale(y2ConfigScale)
        .measure();
    }

    y2Bounds = y2Test.outerBounds();
    y2Width = y2Bounds.width
      ? y2Bounds.width + y2Test.padding()
      : undefined;
    xOffsetRight = max([
      0,
      y2Width,
      width - xTestRange[1],
      width - x2TestRange[1],
    ]);
    const xRange = [xOffsetLeft, width - (xOffsetRight + horizontalMargin)];

    // Legacy `g.d3plus-plot-background` removed in v4. The background Rect
    // (when fill != "transparent") absorbs into `_chartScene` directly —
    // since `_chartScene` is wrapped with `_chartTransform = (margin.left,
    // margin.top + x2Height + topOffset)`, the rect's coords are passed
    // RELATIVE to that origin. See the absorb call further down.

    // Capture the shape-group offset so `_chartScene` nodes appear at the
    // same position legacy `g.d3plus-plot-shapes` had.
    viz._chartTransform = {
      x: viz._margin.left,
      y: viz._margin.top + x2Height + topOffset,
    };

    // Per-axis absolute transforms (legacy values). Stored so we can derive
    // each axis's transform RELATIVE to `_chartTransform` when absorbing
    // axis scenes into `_chartScene` (the chart-cells group already applies
    // _chartTransform). The 4 legacy `g.d3plus-plot-{x,x2,y,y2}-axis` elem()
    // calls are gone — axes are scene-only in v4 (`renderMode("compute")`
    // creates a detached svg behind the scenes; `axis.toScene()` produces
    // the visible output).
    const xTrans = xOffsetLeft > yWidth ? xOffsetLeft - yWidth : 0;
    const axisAbsoluteTransforms = {
      x: {x: viz._margin.left, y: viz._margin.top + x2Height + topOffset},
      x2: {x: viz._margin.left, y: viz._margin.top + topOffset},
      y: {x: viz._margin.left + xTrans, y: viz._margin.top + topOffset},
      y2: {x: -viz._margin.right, y: viz._margin.top + topOffset},
    };
    const axisRelativeTransform = (which: "x" | "x2" | "y" | "y2") => ({
      x: axisAbsoluteTransforms[which].x - viz._chartTransform!.x,
      y: axisAbsoluteTransforms[which].y - viz._chartTransform!.y,
    });
    // Queued axis scenes — pushed onto `_chartScene` AFTER the shape loop
    // so axes render ABOVE shapes (preserving legacy DOM z-order).
    const axisSceneQueue: {key: string; transform: {x: number; y: number}; axis: any}[] = [];

    viz._xAxis
      .renderMode("compute")
      .select(undefined as unknown as HTMLElement)
      .domain(xDomain)
      .height(height - (x2Height + topOffset + verticalMargin))
      .maxSize(height / 2)
      .range(xRange)
      .ticks(xTicks)
      .width(width)
      .config(xC)
      .config(viz._xConfig)
      .scale(xConfigScale)
      .render();
    if (showX) {
      axisSceneQueue.push({
        key: "plot-x-axis",
        transform: axisRelativeTransform("x"),
        axis: viz._xAxis,
      });
    }

    if (x2Exists) {
      viz._x2Axis
        .renderMode("compute")
        .select(undefined as unknown as HTMLElement)
        .domain(x2Domain)
        .height(height - (xHeight + topOffset + verticalMargin))
        .range(xRange)
        .ticks(x2Ticks)
        .width(width)
        .config(xC)
        .config(defaultX2Config)
        .config(viz._x2Config)
        .scale(x2ConfigScale)
        .render();
      axisSceneQueue.push({
        key: "plot-x2-axis",
        transform: axisRelativeTransform("x2"),
        axis: viz._x2Axis,
      });
    }

    viz._xFunc = x = (d: any, x: any) => {
      if (x === "x2") {
        if (x2ConfigScale === "log" && d === 0)
          d =
            x2Domain[0] < 0
              ? viz._x2Axis._d3Scale.domain()[1]
              : viz._x2Axis._d3Scale.domain()[0];
        return viz._x2Axis._getPosition.bind(viz._x2Axis)(d);
      } else {
        if (xConfigScale === "log" && d === 0)
          d =
            xDomain[0] < 0
              ? viz._xAxis._d3Scale.domain()[1]
              : viz._xAxis._d3Scale.domain()[0];
        return viz._xAxis._getPosition.bind(viz._xAxis)(d);
      }
    };

    yRange = [
      viz._xAxis.outerBounds().y + x2Height,
      height - (xHeight + topOffset + verticalMargin),
    ];

    viz._yAxis
      .renderMode("compute")
      .select(undefined as unknown as HTMLElement)
      .domain(yDomain)
      .height(height)
      .maxSize(width / 2)
      .range(yRange)
      .ticks(yTicks)
      .width(xRange[xRange.length - 1])
      .config(yC)
      .config(viz._yConfig)
      .scale(yConfigScale)
      .render();
    if (showY) {
      axisSceneQueue.push({
        key: "plot-y-axis",
        transform: axisRelativeTransform("y"),
        axis: viz._yAxis,
      });
    }

    if (y2Exists) {
      viz._y2Axis
        .renderMode("compute")
        .select(undefined as unknown as HTMLElement)
        .config(yC)
        .domain(y2Exists ? y2Domain : yDomain)
        .gridSize(0)
        .height(height)
        .range(yRange)
        .width(width - max([0, xOffsetRight - y2Width])!)
        .title(false)
        .config(viz._y2Config)
        .config(defaultY2Config)
        .scale(y2ConfigScale)
        .render();
      axisSceneQueue.push({
        key: "plot-y2-axis",
        transform: axisRelativeTransform("y2"),
        axis: viz._y2Axis,
      });
    }

    let labelPositions = {};
    if (labelWidths) {
      groups(labelWidths as any[], (d: any) => d.xValue).forEach(([, values]) => {
        const minFontSize = max(values.map((d: any) => d.fontSize));
        const yBuckets = range(yRange[0], yRange[1], minFontSize).reverse();
        const bumpLimit = (yRange[1] - yRange[0]) / 8;

        /***/
        function bumpPrevious(this: any, d: any, i: any, arr: any) {
          if (!d.defaultY) d.defaultY = this._yAxis._getPosition(d.value);
          if (i) {
            const prev = arr[i - 1];
            const {fontSize, padding} = d;
            const y = d.newY || d.defaultY;
            const prevY = prev.newY || prev.defaultY;
            if (y - fontSize / 2 - padding < prevY) {
              const newY = yBuckets.find(n => n < prevY);
              const change = d.defaultY - newY!;
              if (change < bumpLimit) {
                prev.newY = newY;
                if (i) bumpPrevious(prev, i - 1, arr);
              }
            }
          }
        }

        values.forEach(bumpPrevious.bind(viz));
      });

      labelPositions = (labelWidths as any[]).reduce((obj: any, d: any) => {
        if (d.newY) obj[d.id] = d.newY;
        return obj;
      }, {});
    }

    viz._yFunc = y = (d: any, y: any) => {
      if (y === "y2") {
        if (y2ConfigScale === "log" && d === 0)
          d =
            y2Domain[1] < 0
              ? viz._y2Axis._d3ScaleNegative.domain()[0]
              : viz._y2Axis._d3Scale.domain()[1];
        return viz._y2Axis._getPosition.bind(viz._y2Axis)(d) - x2Height;
      } else {
        if (yConfigScale === "log" && d === 0)
          d =
            yDomain[1] < 0
              ? viz._yAxis._d3ScaleNegative.domain()[0]
              : viz._yAxis._d3Scale.domain()[1];
        return viz._yAxis._getPosition.bind(viz._yAxis)(d) - x2Height;
      }
    };

    let yOffset = viz._xAxis.barConfig()["stroke-width"];
    if (yOffset) yOffset /= 2;

    // Background Rect: skip rendering when transparent (the default) — under
    // the v4 scene path it would emit a 5th `rect.d3plus-render-rect` that
    // confuses bar-counting tests. When a user customizes
    // `backgroundConfig.fill` to a real color, render it normally.
    if (viz._backgroundConfig.fill && viz._backgroundConfig.fill !== "transparent") {
      // Coords are relative to `_chartTransform` (margin.left, margin.top +
      // x2Height + topOffset). Legacy used absolute coords; we subtract the
      // chart-transform offset so the absorbed scene rect lands at the same
      // visual position. yRange[0] = x2Height (see line ~940), so the y
      // simplification is (yRange[1] - yRange[0]) / 2.
      const bgRect = new shapes.Rect()
        .renderMode("compute")
        .data([{}])
        .x(xRange[0] - viz._margin.left + (xRange[1] - xRange[0]) / 2)
        .width(xRange[1] - xRange[0])
        .y((yRange[1] - yRange[0]) / 2)
        .height(yRange[1] - yRange[0])
        .config(viz._backgroundConfig);
      bgRect.render();
      // Prepend so the background sits BEHIND chart shapes.
      const before = (viz._chartScene || []).slice();
      viz._chartScene = [];
      absorbShapeIntoChartScene(viz, bgRect);
      viz._chartScene.push(...before);
    }

    const labelConnectors = (labelWidths as any[]).filter((d: any) => d.newY !== undefined);
    if (labelConnectors.length) {
      const data = labelConnectors
        .map(d =>
          assign(
            {
              x: viz._xAxis._getPosition.bind(viz._xAxis)(d.xValue),
              y: d.defaultY,
            },
            d,
          ),
        )
        .concat(
          labelConnectors.map(d =>
            assign(
              {
                x:
                  viz._xAxis._getPosition.bind(viz._xAxis)(d.xValue) +
                  d.padding -
                  1,
                y: d.newY || d.defaultY,
              },
              d,
            ),
          ),
        );

      // Connector lines: compute-mode emit → absorbed into _chartScene. The
      // legacy `g.d3plus-plot-connectors` group is gone; the chart-wide
      // `_chartTransform` provides the same positioning the legacy group's
      // transform did.
      const connectorLine = new shapes.Line()
        .config({
          data: data as DataPoint[],
          stroke: (d: any) => d.fontColor,
          x: (d: any) => d.x,
          y: (d: any) => d.y,
        })
        .config(viz._labelConnectorConfig)
        .renderMode("compute");
      connectorLine.render();
      absorbShapeIntoChartScene(viz, connectorLine);
    }

    // Legacy `g.d3plus-plot-annotations` / `g.d3plus-plot-annotations-front`
    // groups removed in v4. Annotations now run in `renderMode("compute")`
    // and their scenes are absorbed into `_chartScene`. Layering: "back"
    // annotations absorb here (before the main shape loop below); "front"
    // annotations queue and absorb AFTER the shape loop (preserving the
    // legacy z-order: back → shapes → front).
    const frontAnnotationShapes: any[] = [];
    const renderAnnotation = (annotation: any) => {
      const inst = new (shapes as any)[annotation.shape]()
        .renderMode("compute")
        .duration(viz._duration)
        .config(annotation)
        .config({
          x: (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x)),
          x0:
            viz._discrete === "x"
              ? (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x))
              : x(domains.x[0]),
          x1:
            viz._discrete === "x"
              ? null
              : (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x)),
          y: (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y)),
          y0:
            viz._discrete === "y"
              ? (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y))
              : y(domains.y[1]) - yOffset,
          y1:
            viz._discrete === "y"
              ? null
              : (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y) - yOffset),
        });
      inst.render();
      return inst;
    };

    Object.keys(viz._previousAnnotations).forEach(layer => {
      const annotationData = viz._annotations.filter(
        (d: any) => (layer === "back" && !d.layer) || d.layer === layer,
      );
      const annotationShapes = annotationData.map((d: any) => d.shape);
      annotationData.forEach((annotation: any) => {
        const inst = renderAnnotation(annotation);
        if (layer === "front") frontAnnotationShapes.push(inst);
        else absorbShapeIntoChartScene(viz, inst);
      });
      // Exits: render with empty data in compute mode so their scenes go
      // empty; no DOM to clean up in v4.
      const exitAnnotations = viz._previousAnnotations[layer].filter(
        (d: any) => !annotationShapes.includes(d),
      );
      exitAnnotations.forEach((shape: any) => {
        new (shapes as any)[shape]()
          .renderMode("compute")
          .data([])
          .render();
      });

      viz._previousAnnotations[layer] = annotationShapes;
    });

    const discrete = viz._discrete || "x";

    const shapeConfig = {
      discrete: viz._discrete,
      duration: viz._duration,
      label: (d: any) => viz._drawLabel(d.data, d.i),
      x: (d: any) => (d.x2 !== undefined ? x(d.x2, "x2") : x(d.x)),
      x0:
        discrete === "x"
          ? (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x))
          : x(
              typeof viz._baseline === "number"
                ? viz._baseline
                : domains.x[0],
            ),
      x1: discrete === "x" ? null : (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x)),
      y: (d: any) => (d.y2 !== undefined ? y(d.y2, "y2") : y(d.y)),
      y0:
        discrete === "y"
          ? (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y))
          : y(
              typeof viz._baseline === "number"
                ? viz._baseline
                : domains.y[1],
            ) - yOffset,
      y1:
        discrete === "y"
          ? null
          : (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y) - yOffset),
    };

    const events = Object.keys(viz._on);
    shapeData.forEach(([key, values]: [string, any[]]) => {
      const d = {key, values};
      const shapeConfigInner = Object.assign({}, shapeConfig);
      if (viz._stacked && ["Area", "Bar"].includes(d.key)) {
        const scale = opp === "x" ? x : y;
        (shapeConfigInner as any)[`${opp}`] = (shapeConfigInner as any)[`${opp}0`] = (d: any) => {
          const dataIndex = stackKeys.indexOf(d.id),
            discreteIndex = discreteKeys.indexOf(d.discrete);
          const scaleIndex = d[opp!] < 0 ? 1 : 0;
          return dataIndex >= 0
            ? scale(stackData[dataIndex][discreteIndex][scaleIndex])
            : scale(domains[opp!][opp === "x" ? 0 : 1]);
        };
        (shapeConfigInner as any)[`${opp}1`] = (d: any) => {
          const dataIndex = stackKeys.indexOf(d.id),
            discreteIndex = discreteKeys.indexOf(d.discrete);
          const scaleIndex = d[opp!] < 0 ? 0 : 1;
          return dataIndex >= 0
            ? scale(stackData[dataIndex][discreteIndex][scaleIndex])
            : scale(domains[opp!][opp === "x" ? 0 : 1]);
        };
      }

      const s = new (shapes as any)[d.key]()
        .renderMode("compute")
        .config(shapeConfigInner)
        .data(d.values);

      if (d.key === "Bar") {
        let space;
        const scale = viz._discrete === "x" ? x : y;
        const scaleType = viz._discrete === "x" ? xScale : yScale;
        const vals = viz._discrete === "x" ? xDomain : yDomain;
        const range = viz._discrete === "x" ? xRange : yRange;
        if (scaleType !== "Point" && vals.length === 2) {
          const allPositions = Array.from(
            new Set(d.values.map((d: any) => scale(d[viz._discrete as string]))),
          );
          allPositions.unshift(
            (range[0] as number) -
              (allPositions[0] as number) -
              (range[0] as number),
          );
          allPositions.push(
            (range[1] as number) +
              (range[1] as number) -
              (allPositions[allPositions.length - 1] as number),
          );
          space = allPositions.reduce((n: number, d, i, arr) => {
            if (i) {
              const dist = Math.abs((d as number) - (arr[i - 1] as number));
              if (dist < n) n = dist;
            }
            return n;
          }, Infinity);
        } else if (vals.length > 1) space = scale(vals[1]) - scale(vals[0]);
        else space = range[range.length - 1] - range[0];
        if (viz._groupPadding < space) space -= viz._groupPadding;

        let barSize = space || 1;

        const barGroups = groups(
          d.values as Record<string, unknown>[],
          (d: Record<string, unknown>) => d[viz._discrete],
          (d: Record<string, unknown>) => d.group,
        );

        const ids = merge(
          barGroups.map(([, innerEntries]) => innerEntries.map(([k]) => k)),
        );
        const uniqueIds = Array.from(new Set(ids));

        if (
          max(barGroups.map(([, innerEntries]) => innerEntries.length)) === 1
        ) {
          (s as any)[viz._discrete]((d: any, i: any) => (shapeConfig as any)[viz._discrete](d, i));
        } else {
          barSize =
            (barSize - viz._barPadding * uniqueIds.length - 1) /
            uniqueIds.length;

          const offset = space / 2 - barSize / 2;

          const xMod = scales
            .scaleLinear()
            .domain([0, uniqueIds.length - 1])
            .range([-offset, offset]);

          (s as any)[viz._discrete](
            (d: any, i: any) =>
              (shapeConfig as any)[viz._discrete](d, i) +
              xMod(uniqueIds.indexOf(d.group)),
          );
        }

        s.width(barSize);
        s.height(barSize);
      } else if (d.key === "Line") {
        s.duration(width * 1.5);

        if (viz._confidence) {
          const areaConfig = Object.assign({}, shapeConfig);
          const discrete = viz._discrete || "x";
          const key = discrete === "x" ? "y" : "x";
          const scaleFunction = discrete === "x" ? y : x;
          (areaConfig as any)[`${key}0`] = (d: any) =>
            scaleFunction(viz._confidence[0] ? d.lci : d[key]);
          (areaConfig as any)[`${key}1`] = (d: any) =>
            scaleFunction(viz._confidence[1] ? d.hci : d[key]);

          const area = new shapes.Area()
            .renderMode("compute")
            .config(areaConfig)
            .data(d.values as DataPoint[]);
          const confidenceConfig = Object.assign(
            viz._shapeConfig,
            viz._confidenceConfig,
          );

          area
            .config(
              assign(
                shapeConfigFor(viz, "Line", confidenceConfig),
                shapeConfigFor(viz, "Area", confidenceConfig),
              ) as any,
            )
            .render();

          absorbShapeIntoChartScene(viz, area);
        }

        s.config({
          discrete: shapeConfig.discrete || "x",
          label: showLineLabels
            ? (d: any, i: any) => {
                const visible =
                  typeof viz._lineLabels === "function"
                    ? viz._lineLabels(d.data, d.i)
                    : true;
                if (!visible) return false;
                const labelData = labelWidths.find((l: any) => l.id === d.id);
                if (labelData) {
                  const yPos = labelData.newY || labelData.defaultY;
                  const allLabels = labelWidths.filter((l: any) => l.newY === yPos);
                  if (allLabels.length > 1)
                    return allLabels[0].id !== d.id
                      ? false
                      : `+${formatAbbreviate(
                          allLabels.length,
                          viz._locale,
                        )} ${viz._translate("more")}`;
                  return viz._drawLabel(d, i);
                }
                return false;
              }
            : false,
          labelBounds: showLineLabels
            ? (d: any, i: any, s: any) => {
                const [firstX, firstY] = s.points[0];
                const [lastX, lastY] = s.points[s.points.length - 1];
                const height = viz._height / 4;
                const mod = (labelPositions as any)[d.id]
                  ? lastY - (labelPositions as any)[d.id]
                  : 0;
                return {
                  x: lastX - firstX,
                  y: lastY - firstY - height / 2 - mod,
                  width: largestLabel,
                  height,
                };
              }
            : false,
        });
      }

      viz._wirePlotShapeEvents(s, d.key, events);

      const userConfig = shapeConfigFor(viz, d.key);
      if (viz._shapeConfig.duration === undefined) delete userConfig.duration;
      s.config(userConfig as any).render();

      absorbShapeIntoChartScene(viz, s);

      if (d.key === "Line") {
        const markers = new shapes.Circle()
          .renderMode("compute")
          .data(viz._lineMarkers ? (d.values as DataPoint[]) : [])
          .config(shapeConfig)
          .config(viz._lineMarkerConfig)
          .id((d: any) => `${d.id}_${d.discrete}`);

        viz._wirePlotShapeEvents(markers, "Circle", events);
        markers.render();
        absorbShapeIntoChartScene(viz, markers);
      }
    });

    const dataShapes = shapeData.map(([key]: [string, any]) => key);
    if (dataShapes.includes("Line")) {
      if (viz._confidence) dataShapes.push("Area");
      if (viz._lineMarkers) dataShapes.push("Circle");
    }
    const exitShapes = viz._previousShapes.filter(
      (d: any) => !dataShapes.includes(d),
    );

    exitShapes.forEach((shape: any) => {
      new (shapes as any)[shape]().config(shapeConfig).data([]).render();
    });

    viz._previousShapes = dataShapes;

    // Absorb queued front annotations AFTER the shape loop so they render
    // above shapes (preserving the legacy "front" z-order).
    frontAnnotationShapes.forEach(inst => absorbShapeIntoChartScene(viz, inst));

    // Absorb queued axis scenes AFTER shapes + annotations so axes render
    // ABOVE everything else (matching the legacy DOM order: shapes →
    // annotations → axis groups appended last). Each axis is wrapped in a
    // group with its axis-relative transform; the chart-cells group's
    // `_chartTransform` composes with this to land at the legacy absolute
    // position.
    axisSceneQueue.forEach(({key, transform, axis}) => {
      if (!axis || typeof axis.toScene !== "function") return;
      const scene = axis.toScene();
      if (!scene) return;
      (viz._chartScene ||= []).push({
        type: "group",
        key,
        transform,
        children: scene.children || [],
      });
    });
}
