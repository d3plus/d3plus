import {it} from "vitest";
import assert from "assert";
import {Axis, AxisBottom} from "../../index.ts";
import {computeAxisLayout, measureAxis} from "../../internal.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

it("Axis", () => {
  // jsdom does not implement SVG path geometry, used when drawing the bar.
  window.SVGElement.prototype.getTotalLength = () => 0;
  window.SVGElement.prototype.getPointAtLength = () => ({x: 0, y: 0});

  // issue #789: a zero-extent domain (e.g. [0, 0]) with rounding enabled used
  // to compute a NaN rounding factor and throw "Invalid array length".
  for (const rounding of ["outside", "inside"]) {
    assert.doesNotThrow(
      () => new Axis().domain([0, 0]).rounding(rounding).render(),
      `renders zero-extent domain [0, 0] with rounding="${rounding}"`,
    );
  }

  const zeroAxis = new Axis().domain([0, 0]).rounding("outside").render();
  assert.deepStrictEqual(
    zeroAxis._d3Scale.domain(),
    [0, 0],
    "leaves a zero-extent domain unchanged",
  );

  // sanity check: rounding still expands a normal domain outward
  const roundedAxis = new Axis().domain([12, 488]).rounding("outside").render();
  assert.deepStrictEqual(
    roundedAxis._d3Scale.domain(),
    [10, 490],
    "rounding still expands a normal domain outward",
  );
});

it("standalone Axis mounts a single <svg>", () => {
  // A plain Axis paints through paintComponentScene, whose renderer creates the
  // <svg>; the standalone fallback must mount into a <div>, not its own <svg>,
  // or the two nest. (Timeline manages its own paint and keeps the <svg> — see
  // Timeline-test.)
  new Axis().domain([0, 10]).render();
  assert.strictEqual(
    document.getElementsByTagName("svg").length,
    1,
    "exactly one <svg> (no nested renderer svg)",
  );
});

it("measureAxis runs on a plain object, without an Axis instance", () => {
  // Exactly the fields measureAxis reads: config under `schema` (the
  // installFluent storage contract), the scratch state it mutates, and tick,
  // label and position getters over the d3 scale it populates.
  const axisLike = {
    schema: {
      domain: [0, 100],
      scale: "linear",
      ticks: undefined,
      labels: undefined,
      tickFormat: null,
      shape: "Line",
      shapeConfig: {
        labelConfig: {fontFamily: "sans-serif", fontSize: 12, padding: 5},
        strokeWidth: 1,
      },
      tickSize: 5,
      tickSuffix: "normal",
      timeLocale: undefined,
      scalePadding: 0,
      paddingInner: 0,
      paddingOuter: 0,
      rounding: "outside",
      roundingInsideMinPrefix: "",
      roundingInsideMaxPrefix: "",
      roundingInsideMinSuffix: "",
      roundingInsideMaxSuffix: "",
      orient: "bottom",
      align: "end",
      maxSize: undefined,
      width: 400,
      height: 60,
      padding: 5,
      minSize: 0,
      gridSize: 0,
      grid: undefined,
      gridLog: false,
      title: undefined,
      titleConfig: {},
      labelOffset: false,
      range: undefined,
    },
    _data: [],
    _tickUnit: 0,
    _locale: "en-US",
    _labelRotation: undefined,
    _margin: {top: 0, right: 0, bottom: 0, left: 0},
    _position: {width: "width", height: "height", x: "x", y: "y", horizontal: true, opposite: "top"},
    _getTicks() {
      return this._d3Scale && this._d3Scale.ticks ? this._d3Scale.ticks(10) : [];
    },
    _getLabels() {
      return this._d3Scale && this._d3Scale.ticks ? this._d3Scale.ticks(10) : [];
    },
    _getPosition(d) {
      return this._d3Scale ? this._d3Scale(d) : 0;
    },
  };

  const layout = measureAxis(axisLike);

  assert.strictEqual(typeof axisLike._d3Scale, "function", "measureAxis populated _d3Scale on the plain object");
  assert.ok(Array.isArray(axisLike._d3Scale.domain()), "domain is set");
  assert.ok(layout.bounds.width > 0, `bounds.width > 0 (got ${layout.bounds.width})`);
  assert.ok(layout.bounds.height > 0, `bounds.height > 0 (got ${layout.bounds.height})`);
  assert.ok(layout.ticks.length > 0, `tick count > 0 (got ${layout.ticks.length})`);
  assert.ok(layout.labels.length > 0, `label count > 0 (got ${layout.labels.length})`);
  assert.ok(layout.textData.length > 0, "textData populated");
  assert.strictEqual(typeof layout.tickFormat, "function", "tickFormat function returned");
});

it("Axis.measure() populates outerBounds without touching the DOM", () => {
  const target = document.createElement("div");
  document.body.appendChild(target);
  const build = () => new AxisBottom().domain([0, 100]).width(400).height(60).align("end").gridSize(0);

  const axis = build();
  axis.measure();
  assert.strictEqual(target.children.length, 0, "measure() created no children in the page");
  assert.strictEqual(document.body.querySelectorAll("svg").length, 0, "measure() mounted no <svg>");
  const bounds = axis.outerBounds();
  assert.ok(bounds.width > 0, `bounds.width > 0 (got ${bounds.width})`);
  assert.ok(bounds.height > 0, `bounds.height > 0 (got ${bounds.height})`);

  const layout = computeAxisLayout(build());
  assert.strictEqual(typeof layout.bounds.width, "number", "computeAxisLayout returns bounds");
});
