/** Browser helpers shared by the site's page checks. */

/** Answers a request that leaves the site with an empty stand-in. */
function stub(route) {
  const type = route.request().resourceType();
  if (type === "fetch" || type === "xhr")
    return route.fulfill({contentType: "application/json", body: "[]"});
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
      await playground
        .locator(".d3p-chart svg, .d3p-chart canvas")
        .first()
        .waitFor({state: "attached", timeout})
        .catch(() => problems.push(`playground ${i + 1} drew nothing`));
    }
    await tab.waitForTimeout(count ? 1500 : 200);
  } catch (err) {
    problems.push(`navigation: ${err.message}`);
  }
  await context.close();
  return problems;
}
