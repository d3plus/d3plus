import {it} from "vitest";
import {commands, userEvent} from "vitest/browser";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    `rangeSelector`: buttons in the top-left controls that zoom a time axis
    to a recent window. A real click and the keyboard both press them, the
    pressed state follows the chart's zoom however it changes, the y axis
    refits (the zoom runs along the time axis alone), labels and spoken
    labels follow the locale, and a button covering all the data is
    disabled. Both backends.
*/

const box = "<div id='viz' style='width:640px;height:400px'></div>";
const DAY = 864e5;

/** Draws a daily LinePlot with a range selector, leaving it on `window.chart`. */
function draw(renderer, config = {}) {
  return render(
    box,
    async ({renderer, config}) => {
      const daily = [];
      for (let i = 0; i < 1000; i++)
        daily.push({
          id: "price",
          date: new Date(2021, 0, 1 + i),
          value: 100 + i / 4 + 30 * Math.sin(i / 45),
        });
      window.daily = daily;
      const chart = new window.d3plus.LinePlot()
        .data(config.data ? config.data : daily)
        .groupBy("id")
        .x("date")
        .time("date")
        .y("value")
        .timeline(false)
        .legend(false)
        .duration(0)
        .rangeSelector(true)
        .config(config.extra || {})
        .renderer(renderer);
      window.chart = chart;
      await new Promise(resolve => chart.select("#viz").render(resolve));
    },
    {renderer, config},
  );
}

const frames = () =>
  new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
const buttons = () => [
  ...document.querySelectorAll("#viz .d3plus-range-button"),
];
const pressed = () =>
  buttons()
    .filter(b => b.getAttribute("aria-pressed") === "true")
    .map(b => b.textContent);
const xDomain = () => window.chart._xAxis._d3Scale.domain().map(Number);
const yDomain = () => window.chart._yAxis._d3Scale.domain().map(Number);
const span = d => Math.abs(d[1] - d[0]);

/** Clicks an element with the real pointer. */
async function realClick(el) {
  const r = el.getBoundingClientRect();
  await commands.mouseClick(r.left + r.width / 2, r.top + r.height / 2);
  await frames();
}

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] the buttons zoom the dates to their window, and read as pressed while it shows`, async () => {
    await draw(renderer);
    const group = document.querySelector("#viz .d3plus-range-selector");
    assert.strictEqual(group.getAttribute("role"), "group");
    assert.strictEqual(group.getAttribute("aria-label"), "Zoom range");
    assert.deepStrictEqual(
      buttons().map(b => [b.textContent, b.getAttribute("aria-label")]),
      [
        ["1M", "Last month"],
        ["6M", "Last 6 months"],
        ["YTD", "Year to date"],
        ["1Y", "Last year"],
        ["All", "Full range"],
      ],
    );
    assert.deepStrictEqual(pressed(), ["All"], "All shows at first");
    assert.deepStrictEqual(
      Object.keys(window.chart._plotZoomBase.scales),
      ["x"],
      "the zoom runs along the time axis alone",
    );
    const baseY = yDomain();
    const last = +window.daily[window.daily.length - 1].date;

    await realClick(buttons()[1]);
    const six = xDomain();
    const start = new Date(last);
    start.setMonth(start.getMonth() - 6);
    assert.ok(
      Math.abs(six[0] - +start) < DAY && Math.abs(six[1] - last) < DAY,
      `6M shows the last six months (${six.map(d => new Date(d).toISOString())})`,
    );
    assert.deepStrictEqual(pressed(), ["6M"]);
    assert.ok(span(yDomain()) < span(baseY), "y refits to the months in view");

    // Zooming another way leaves no button pressed.
    document.querySelector("#viz .zoom-in").click();
    await frames();
    assert.deepStrictEqual(pressed(), []);

    // "All" (via the reset) puts the natural view back.
    await realClick(buttons()[4]);
    assert.deepStrictEqual(pressed(), ["All"]);
    assert.deepStrictEqual(yDomain(), baseY);
  });

  it(`[${renderer}] the keyboard reaches and presses the buttons`, async () => {
    await draw(renderer);
    const [oneMonth] = buttons();
    oneMonth.focus();
    await userEvent.keyboard("{Enter}");
    await frames();
    assert.deepStrictEqual(
      pressed(),
      ["1M"],
      "Enter presses the focused button",
    );
    const month = xDomain();
    assert.ok(
      span(month) > 27 * DAY && span(month) < 32 * DAY,
      "and shows a month",
    );
    await userEvent.keyboard("{Tab}{Tab}");
    assert.strictEqual(document.activeElement, buttons()[2], "Tab moves along");
    await userEvent.keyboard(" ");
    await frames();
    assert.deepStrictEqual(pressed(), ["YTD"], "Space presses it too");
    const ytd = xDomain();
    const last = new Date(+window.daily[window.daily.length - 1].date);
    assert.ok(
      Math.abs(ytd[0] - +new Date(last.getFullYear(), 0, 1)) < DAY,
      "YTD starts on January 1",
    );
  });
}

it("labels follow the locale, and a button that would show all the data is hidden", async () => {
  await render(box, () => {});
  const rows = [];
  for (let i = 0; i < 120; i++)
    rows.push({
      id: "t",
      date: new Date(2024, 6, 1 + i),
      value: 20 + Math.sin(i / 5),
    });
  await draw("svg", {
    data: rows,
    extra: {
      locale: "es-ES",
      rangeSelector: [
        {step: "week", count: 2, label: "2S"},
        "1M",
        "YTD",
        "1Y",
        "All",
      ],
    },
  });
  assert.deepStrictEqual(
    buttons().map(b => [
      b.textContent,
      b.getAttribute("aria-label"),
      b.dataset.range,
    ]),
    [
      ["2S", "Últimas 2 semanas", "0"],
      ["1 m", "Último mes", "1"],
      ["Todo", "Rango completo", "4"],
    ],
    "YTD and 1Y would show everything, so they're hidden",
  );
  assert.strictEqual(
    document
      .querySelector("#viz .d3plus-range-selector")
      .getAttribute("aria-label"),
    "Rango de zoom",
  );
  await realClick(buttons()[0]);
  const two = xDomain();
  assert.ok(
    Math.abs(span(two) - 14 * DAY) < DAY,
    "the custom button shows two weeks",
  );
});

it("hides without a time axis or with zoom off; an explicit zoomAxes wins", async () => {
  await render(box, async () => {
    const chart = new window.d3plus.LinePlot()
      .data([
        {id: "a", x: 1, y: 2},
        {id: "a", x: 2, y: 3},
      ])
      .groupBy("id")
      .legend(false)
      .rangeSelector(true)
      .duration(0);
    await new Promise(resolve => chart.select("#viz").render(resolve));
  });
  assert.strictEqual(buttons().length, 0, "no time axis");
  await draw("svg", {extra: {zoom: false}});
  assert.strictEqual(buttons().length, 0, "zoom off");
  await draw("svg", {extra: {zoomAxes: ["x", "y"]}});
  assert.strictEqual(buttons().length, 5, "shows with zoomAxes set");
  assert.deepStrictEqual(
    Object.keys(window.chart._plotZoomBase.scales),
    ["x", "y"],
    "an explicit zoomAxes wins",
  );
});

it("the minimap carries on from a button's window", async () => {
  await draw("svg");
  await realClick(buttons()[1]);
  const six = xDomain();
  const viewport = document.querySelector("#viz .d3plus-minimap-viewport");
  viewport.focus();
  viewport.dispatchEvent(
    new KeyboardEvent("keydown", {key: "ArrowLeft", bubbles: true}),
  );
  await new Promise(r => setTimeout(r, 50));
  await frames();
  const nudged = xDomain();
  assert.ok(
    nudged[0] < six[0],
    "the minimap's arrow key pans to earlier dates",
  );
  assert.ok(Math.abs(span(nudged) - span(six)) < 1000, "at the same zoom");
  assert.deepStrictEqual(pressed(), [], "so 6M no longer reads as pressed");
});

it("hides altogether when only All would be left", async () => {
  await draw("svg", {extra: {rangeSelector: ["1Y", "All"]}});
  assert.strictEqual(buttons().length, 2, "1Y fits in 1000 days of data");
  await render(box, () => {});
  const rows = [];
  for (let i = 0; i < 20; i++)
    rows.push({id: "t", date: new Date(2024, 0, 1 + i), value: i});
  await draw("svg", {data: rows, extra: {rangeSelector: ["1M", "1Y", "All"]}});
  assert.strictEqual(buttons().length, 0);
  assert.strictEqual(
    document.querySelector("#viz .d3plus-range-selector"),
    null,
  );
});

/** Each small-multiples panel's line: the span of its points, and the panel's width. */
const panelLines = () =>
  window.chart._facetPanels.map(p => {
    let pts = [];
    const walk = n => {
      if (n.interactionPoints && n.interactionPoints.length > pts.length)
        pts = n.interactionPoints;
      (n.children || []).forEach(walk);
    };
    p.scene.forEach(walk);
    const xs = pts.map(q => q.x);
    return {span: Math.max(...xs) - Math.min(...xs), width: p.area.width};
  });

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] small multiples apply a button to each panel's own data, and All resets them`, async () => {
    await render(box, () => {});
    const rows = [];
    ["a", "b"].forEach((id, p) => {
      // Panel b has 300 days of data, panel a 400.
      for (let i = 0; i < 400 - p * 100; i++)
        rows.push({
          id,
          date: new Date(2023, 0, 1 + i),
          value: 50 + Math.sin(i / 9) * 10 + p * 30,
        });
    });
    await draw(renderer, {
      data: rows,
      extra: {
        facet: "id",
        facetConfig: {scales: "independent"},
        rangeSelector: ["1M", "All"],
      },
    });
    assert.deepStrictEqual(pressed(), ["All"]);
    const before = panelLines();
    assert.ok(
      before.every(l => l.span <= l.width + 1),
      "unzoomed lines fit",
    );
    await realClick(buttons()[0]);
    await frames();
    await frames();
    assert.deepStrictEqual(pressed(), ["1M"], "1M reads as pressed");
    const [a, b] = panelLines();
    // A month of each panel's own data fills its width: 400 and 300 days.
    assert.ok(
      a.span > a.width * 8,
      `panel a zooms in (${a.span} / ${a.width})`,
    );
    assert.ok(
      Math.abs(a.span / b.span - 400 / 300) < 0.15,
      `each panel windows its own data (${a.span} vs ${b.span})`,
    );
    await realClick(buttons()[1]);
    await frames();
    await frames();
    assert.deepStrictEqual(pressed(), ["All"]);
    assert.ok(
      panelLines().every(l => l.span <= l.width + 1),
      "All resets them",
    );
  });
}
