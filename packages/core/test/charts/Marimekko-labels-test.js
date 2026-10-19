import assert from "assert";
import {render, closeBrowser} from "../playwright.js";
import {ownLabelSpaces} from "../../es/src/components/Axis/axisLayoutLabels.js";

/**
    Marimekko's category labels at the Storybook canvas size (958 × 350): each
    label wraps within its own bar's share of the axis, so the share line
    shows beneath every name, and labels that rotate show the name alone.
*/

after(async () => {
  await closeBrowser();
});

// The stories' smartphone revenue ($B) and units sold (millions) by region.
const brands = ["Apple", "Samsung", "Xiaomi", "Oppo", "Other"];
const regions = {
  "North America": [62, 24, 1, 1, 9],
  "Europe": [38, 30, 12, 6, 14],
  "Asia Pacific": [70, 34, 40, 38, 58],
  "Latin America": [6, 14, 7, 3, 8],
  "Middle East & Africa": [8, 12, 6, 5, 16],
};
const units = {"North America": 150, "Europe": 190, "Asia Pacific": 640, "Latin America": 130, "Middle East & Africa": 190};
const sales = Object.entries(regions).flatMap(([Region, values]) =>
  values.map((Revenue, i) => ({Region, Brand: brands[i], Revenue, "Units Sold": units[Region]})));
const names = Object.keys(regions);

/** Renders a Marimekko and reads back its x axis as painted: each label's lines, and whether it rotated. */
const draw = ([config, rows]) =>
  new Promise(resolve => {
    if (config.maxAggs) config = {...config, aggs: {[config.maxAggs]: (a, c) => Math.max(...a.map(c))}};
    delete config.maxAggs;
    const el = document.createElement("div");
    document.body.appendChild(el);
    const viz = new window.d3plus.Marimekko()
      .select(el)
      .data(rows)
      .groupBy("Brand")
      .x("Region")
      .y("Revenue")
      .duration(0)
      .width(958)
      .height(350)
      .config(config);
    viz.render(() => {
      const labels = [];
      const walk = (node, inAxis) => {
        if (!node || node.key === "textBox-group") return;
        const axis = inAxis || /(?:^|\/)plot-x-axis$/.test(node.key || "");
        if (axis && node.type === "text") labels.push(node.lines.map(l => l.text));
        (node.children || []).forEach(c => walk(c, axis));
      };
      walk(viz._paintedScene && viz._paintedScene.root, false);
      resolve({labels, rotated: viz._xAxis._labelRotation});
    });
  });

const share = /^[\d.]+%$/;

it("ownLabelSpaces: each label reaches halfway to its nearer neighbor on either side", () => {
  // Bars 400, 60, and 80 wide, labeled at their centers.
  assert.deepStrictEqual(ownLabelSpaces([200, 430, 500], [0, 540]), [230, 70, 70]);
  assert.deepStrictEqual(ownLabelSpaces([100], [0, 540]), [540], "a lone label spans the range");
  assert.deepStrictEqual(ownLabelSpaces([], [0, 540]), []);
});

for (const renderer of ["svg", "canvas"]) {
  it(`Marimekko: at the story size, every label keeps its share line beneath its name (${renderer})`, async function () {
    this.timeout(60000);
    const out = await render("", draw, [{renderer}, sales]);
    assert.strictEqual(out.rotated, false, "narrow bars wrap their names instead of rotating them");
    assert.strictEqual(out.labels.length, names.length, `every region labeled: ${JSON.stringify(out.labels)}`);
    out.labels.forEach((lines, i) => {
      assert.ok(share.test(lines[lines.length - 1]), `${names[i]} ends on its share: ${lines}`);
      assert.strictEqual(lines.slice(0, -1).join(" "), names[i], "the name, whole, above it");
    });
    // A wide bar's name lies flat on one line; a narrow one's wraps.
    assert.deepStrictEqual(out.labels[2], ["Asia Pacific", "46%"]);
    assert.ok(out.labels[3].length > 2, `Latin America wraps: ${out.labels[3]}`);
  });

  it(`Marimekko: at the story size, barWidthShare(false) labels names alone (${renderer})`, async function () {
    this.timeout(60000);
    const out = await render("", draw, [{renderer, barWidthShare: false}, sales]);
    assert.strictEqual(out.rotated, false);
    assert.deepStrictEqual(out.labels.map(l => l.join(" ")), names);
  });

  it(`Marimekko: rotated labels show the name alone (${renderer})`, async function () {
    this.timeout(60000);
    const out = await render("", draw, [{renderer, width: 560}, sales]);
    assert.strictEqual(out.rotated, true, "names too long for the narrowest bars, even wrapped, rotate");
    assert.deepStrictEqual(out.labels.map(l => l.join(" ")).sort(), names.slice().sort());
    assert.ok(out.labels.every(l => !l.some(line => share.test(line))), `no share: ${JSON.stringify(out.labels)}`);
  });
}

it("Marimekko: the BarWidthMeasure story's shares differ visibly from its revenue totals", async function () {
  this.timeout(60000);
  const shares = out => out.labels.map(l => parseFloat(l[l.length - 1]));
  const revenue = shares(await render("", draw, [{}, sales]));
  const measured = await render("", draw, [{barWidth: "Units Sold", maxAggs: "Units Sold"}, sales]);
  assert.strictEqual(measured.rotated, false);
  const sold = shares(measured);
  assert.deepStrictEqual(sold, [11.5, 14.6, 49.2, 10, 14.6]);
  const moved = sold.filter((s, i) => Math.abs(s - revenue[i]) >= 2.5);
  assert.ok(moved.length >= 3, `most regions' widths move: ${revenue} vs ${sold}`);
});
