/** Browser helpers shared by the site's page checks. */

/**
 * Hosts some examples load their data from, as a reader's browser would: the
 * check fetches these for real, so those pages need the network.
 */
const DATA_HOSTS = new Set([
  "datausa.io",
  "api.datausa.io",
  "api.datasaudi.sa",
]);

/** A transparent 1×1 PNG, standing in for map tiles and remote icons. */
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

/** Answers a request that leaves the site with a stand-in. */
function stub(route) {
  const request = route.request();
  if (DATA_HOSTS.has(new URL(request.url()).host)) return route.continue();
  const type = request.resourceType();
  if (type === "fetch" || type === "xhr")
    return route.fulfill({contentType: "application/json", body: "[]"});
  if (type === "image")
    return route.fulfill({contentType: "image/png", body: PIXEL});
  return route.abort();
}

/**
 * Opens a page in a fresh context, logging every problem it reports.
 * `timeout` bounds the page load and each chart's first draw.
 */
export async function open(browser, origin, url, {timeout = 30000} = {}) {
  const context = await browser.newContext({
    viewport: {width: 1280, height: 900},
  });
  await context.route(u => !u.href.startsWith(origin), stub);
  const tab = await context.newPage();
  const problems = [];
  tab.on("console", msg => {
    if (["error", "warning"].includes(msg.type()))
      problems.push(`console.${msg.type()}: ${msg.text()}`);
  });
  tab.on("pageerror", err => problems.push(`uncaught: ${err.message}`));
  tab.on("response", res => {
    if (res.status() >= 400) problems.push(`${res.status()}: ${res.url()}`);
  });
  await tab.goto(`${origin}${url}`, {waitUntil: "load", timeout});
  return {context, tab, problems};
}

/** The text of every label a playground's chart drew. */
export const labels = playground =>
  playground.locator(".d3p-chart svg text").allTextContents();

/** Waits for a function example's calls to settle; logs any that threw. */
async function checkCalls(tab, block, i, problems, timeout) {
  const ran = await block
    .locator(".d3p-result")
    .first()
    .waitFor({state: "attached", timeout})
    .then(() => true)
    .catch(() => false);
  if (!ran) return problems.push(`example ${i + 1} ran nothing`);
  await tab
    .waitForFunction(
      el => !el.querySelector(".is-pending"),
      await block.elementHandle(),
      {
        timeout,
      },
    )
    .catch(() => problems.push(`example ${i + 1} never finished`));
  for (const error of await block.locator(".d3p-value.is-error").all())
    problems.push(`example ${i + 1}: ${await error.innerText()}`);
}

/** Opens one page and draws every playground on it. */
export async function check(browser, origin, url, {timeout = 15000} = {}) {
  const {context, tab, problems} = await open(browser, origin, url, {
    timeout: Math.max(timeout, 30000),
  });
  try {
    const playgrounds = tab.locator(".d3p");
    const count = await playgrounds.count();
    for (let i = 0; i < count; i++) {
      const playground = playgrounds.nth(i);
      await playground.scrollIntoViewIfNeeded();
      if (await playground.evaluate(el => el.matches(".d3p-calls")))
        await checkCalls(tab, playground, i, problems, timeout);
      else
        await playground
          // Something drawn: an svg's shapes or a canvas, or a tooltip (which
          // mounts outside the playground, so the box can't clip it).
          .locator(".d3p-chart svg > *, .d3p-chart canvas")
          .or(tab.locator(".d3plus-tooltip"))
          .first()
          .waitFor({state: "attached", timeout})
          .catch(() => problems.push(`playground ${i + 1} drew nothing`));
      // An example whose code throws, or whose data came out empty.
      const error = playground.locator(".d3p-error");
      if (await error.count())
        problems.push(`playground ${i + 1}: ${await error.innerText()}`);
      if (
        !(await playground.evaluate(el => el.matches(".d3p-calls"))) &&
        (await playground.innerText()).includes("No Data Available")
      )
        problems.push(`playground ${i + 1} has no data`);
    }
    await tab.waitForTimeout(count ? 1500 : 200);
  } catch (err) {
    problems.push(`navigation: ${err.message}`);
  }
  await context.close();
  return problems;
}
