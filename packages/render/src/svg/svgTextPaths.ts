import type {TextNode} from "../scene.js";
import {textPathD} from "../textPath.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
    The `<defs>` paths that path-following text nodes draw along. Each node
    (by key) keeps one `<path>` across draws, under an id unique to its
    renderer, updated to the node's path; it goes when the node exits.
*/
export class TextPathDefs {
  private _ids = new Map<string, string>();
  private _seq = 0;
  private _timers = new Set<ReturnType<typeof setTimeout>>();

  /**
      @param defs Returns the renderer's `<defs>`, creating it when needed.
      @param uid Returns the renderer's unique id prefix.
  */
  constructor(
    private defs: () => SVGDefsElement | undefined,
    private uid: () => number,
  ) {}

  /**
      Writes the path `node` follows into `<defs>` and returns its `#id`, or
      null without a path or `<defs>`.
      @param node A text node with a `path`.
  */
  href(node: TextNode): string | null {
    const defs = this.defs();
    if (!defs || !node.path) return null;
    const key = String(node.key);
    let id = this._ids.get(key);
    if (!id) {
      id = `d3plus-textpath-${this.uid()}-${++this._seq}`;
      this._ids.set(key, id);
    }
    let path = defs.querySelector<SVGPathElement>(`#${id}`);
    if (!path) {
      path = document.createElementNS(SVG_NS, "path") as SVGPathElement;
      path.setAttribute("id", id);
      defs.appendChild(path);
    }
    const d = textPathD(node.path);
    if (path.getAttribute("d") !== d) path.setAttribute("d", d);
    return `#${id}`;
  }

  /**
      Removes the path an exiting node followed, once its exit transition has
      had `delay` ms to finish and no `<textPath>` still follows it (an exit
      can outlast its duration when frames run late).
      @param key The exiting node's key.
      @param delay The exit transition's duration.
  */
  release(key: string | number, delay = 0): void {
    const id = this._ids.get(String(key));
    if (!id) return;
    this._ids.delete(String(key));
    const remove = () => {
      const path = this.defs()?.querySelector<SVGPathElement>(`#${id}`);
      if (!path) return;
      const svg = path.ownerSVGElement;
      if (delay && svg?.querySelector(`textPath[href="#${id}"]`))
        return wait(Math.min(delay, 100));
      path.remove();
    };
    const wait = (ms: number) => {
      const timer = setTimeout(() => {
        this._timers.delete(timer);
        remove();
      }, ms);
      this._timers.add(timer);
    };
    if (!delay) return remove();
    wait(delay);
  }

  /** Cancels pending removals. */
  clear(): void {
    for (const timer of this._timers) clearTimeout(timer);
    this._timers.clear();
  }
}
