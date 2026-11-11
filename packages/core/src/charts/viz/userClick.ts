/**
    Which click handlers a chart's `on` holds for a shape or a legend entry:
    one of the user's, or the chart's own. The hand cursor shows where a
    click runs either. A chart registers each handler it installs as its own
    (`setOwnClick`); any other handler is the user's, compared by identity.
*/

type ClickHandler = (...args: never[]) => unknown;

/** The parts of a chart these read: its `on` handlers. */
export interface ClickHost {
  schema: {on?: Record<string, unknown>};
}

const ownClicks = new WeakMap<object, Map<string, unknown>>();

/**
    Records `handler` as the chart's own handler for `key`, in place of any
    recorded before.
    @param viz The chart.
    @param key The event the chart handles itself: `"click.shape"` or `"click.legend"`.
    @param handler The handler the chart installs under `key`.
*/
export function setOwnClick(
  viz: object,
  key: string,
  handler: ClickHandler,
): void {
  let handlers = ownClicks.get(viz);
  if (!handlers) ownClicks.set(viz, (handlers = new Map()));
  handlers.set(key, handler);
}

/**
    Whether the chart's own handler is still the one under `key`.
    @param viz The chart.
    @param key The event the chart handles itself: `"click.shape"` or `"click.legend"`.
*/
export function hasOwnClick(viz: ClickHost, key: string): boolean {
  const handler = viz.schema.on?.[key];
  return Boolean(handler) && ownClicks.get(viz)?.get(key) === handler;
}

/**
    Whether a click runs a handler of the user's: any `click` handler, or one
    under `key` that is not the chart's own.
    @param viz The chart.
    @param key The event the chart handles itself: `"click.shape"` or `"click.legend"`.
*/
export function hasUserClick(viz: ClickHost, key: string): boolean {
  const on = viz.schema.on ?? {};
  return Boolean(on.click) || (Boolean(on[key]) && !hasOwnClick(viz, key));
}
