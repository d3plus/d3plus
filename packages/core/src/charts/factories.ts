/**
    Factory functions for each chart — the v4 RFC §3.3 / strangler step 4
    surface. Today these are thin aliases over the existing class
    constructors so consumers can write `barChart().data(...).render()`
    instead of `new BarChart().data(...).render()`.

    The factories are the **stable v4 entry point.** Class constructors
    (`new BarChart()`) remain working byte-for-byte through all of v4 (per
    RFC §8.6, deprecated with a v5 removal horizon). When the eventual
    decoupling lands (extract `runPipeline(def, config)` as a free function;
    remove the class hierarchy), the factories' return value gets swapped
    transparently — consumer code unchanged.

    The conformance test (`test/charts/BarChart-config-snapshot-test.js`)
    asserts `barChart().config()` reproduces `new BarChart().config()` byte-
    for-byte, so any future refactor that drifts from the class behavior
    fails the test.

    @module
*/

import AreaPlot from "./AreaPlot.js";
import BarChart from "./BarChart.js";
import BoxWhisker from "./BoxWhisker.js";
import BumpChart from "./BumpChart.js";
import Donut from "./Donut.js";
import Geomap from "./Geomap.js";
import LinePlot from "./LinePlot.js";
import Matrix from "./Matrix.js";
import Network from "./Network.js";
import Pack from "./Pack.js";
import Pie from "./Pie.js";
import Plot from "./Plot.js";
import Priestley from "./Priestley.js";
import Radar from "./Radar.js";
import RadialMatrix from "./RadialMatrix.js";
import Rings from "./Rings.js";
import Sankey from "./Sankey.js";
import StackedArea from "./StackedArea.js";
import Tree from "./Tree.js";
import Treemap from "./Treemap.js";
import Viz from "./Viz.js";

// camelCase factory names match the RFC §3.3 ergonomics target:
// `barChart().data(...).x(...).render()`.
export const areaPlot = () => new AreaPlot();
export const barChart = () => new BarChart();
export const boxWhisker = () => new BoxWhisker();
export const bumpChart = () => new BumpChart();
export const donut = () => new Donut();
export const geomap = () => new Geomap();
export const linePlot = () => new LinePlot();
export const matrix = () => new Matrix();
export const network = () => new Network();
export const pack = () => new Pack();
export const pie = () => new Pie();
export const plot = () => new Plot();
export const priestley = () => new Priestley();
export const radar = () => new Radar();
export const radialMatrix = () => new RadialMatrix();
export const rings = () => new Rings();
export const sankey = () => new Sankey();
export const stackedArea = () => new StackedArea();
export const tree = () => new Tree();
export const treemap = () => new Treemap();
export const viz = () => new Viz();
