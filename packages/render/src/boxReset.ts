/**
    Keeps a page's generic CSS off the box model of the HTML d3plus injects.

    A page rule written against bare elements (`div {padding: 25px}`,
    `span {margin: 1em}`, `* {box-sizing: border-box}`) also matches the
    wrappers d3plus puts in a chart's container, which shifts and resizes
    them: overlays drift off the shapes they belong to, and panels that are
    measured to make room for them (the zoom and top-left controls) report
    the wrong size.

    `resetInjectedBoxes` adds one `<style>` element at the very start of the
    document's `<head>` (or of the shadow root holding the node) that sets
    `margin`, `padding`, `border` and `box-sizing` back to `revert` (the
    browser's own default) on a list of selectors. Each selector is a single
    class (or attribute) selector, specificity (0,1,0), and the
    sheet comes before every page stylesheet, which together decide what wins:

    - A bare element selector, whatever its length (`div`, `body section div`),
      has a lower specificity, so the reset beats it.
    - A page rule on the same class (`.d3plus-zoom-control {padding: 4px}`)
      ties on specificity and comes later in the document, so the page wins.
    - Inline styles, which is how d3plus applies its own configuration,
      beat every stylesheet, so configured styles always apply.

    Specificity only decides between rules in the same cascade layer: a page
    rule inside `@layer` loses to this unlayered reset even when it names a
    d3plus class, and a page rule marked `!important` beats it.

    Each call adds its selectors to the shared rule, so separate modules can
    register the classes they own without knowing about each other.
*/

const ATTRIBUTE = "data-d3plus-box-reset";

type ResetStyle = HTMLStyleElement & {__d3plusSelectors?: Set<string>};

/**
    Registers `selectors` with the box-model reset in the document (or shadow
    root) that holds `node`. Does nothing for a node that isn't attached yet.
*/
export function resetInjectedBoxes(
  node: Node | null | undefined,
  selectors: readonly string[],
): void {
  if (!node || typeof node.getRootNode !== "function") return;
  const root = node.getRootNode();
  // A shadow root is a document fragment with a host element.
  const isShadow = root.nodeType === 11 && "host" in root;
  const doc = isShadow
    ? root.ownerDocument
    : root.nodeType === 9
      ? (root as Document)
      : null;
  if (!doc) return;
  const parent: ParentNode | null = isShadow
    ? (root as ShadowRoot)
    : doc.head || doc.documentElement;
  if (!parent) return;

  let style = parent.querySelector<HTMLStyleElement>(
    `:scope > style[${ATTRIBUTE}]`,
  ) as ResetStyle | null;
  if (!style) {
    style = doc.createElement("style") as ResetStyle;
    style.setAttribute(ATTRIBUTE, "");
    parent.insertBefore(style, parent.firstChild);
  }
  const known = (style.__d3plusSelectors ||= new Set());
  const before = known.size;
  for (const selector of selectors) known.add(selector);
  if (known.size === before && style.textContent) return;
  style.textContent = `${Array.from(known).join(",\n")} {margin: revert; padding: revert; border: revert; box-sizing: revert;}`;
}
