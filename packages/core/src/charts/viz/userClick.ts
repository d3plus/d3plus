/**
    Which click handlers a chart's `on` holds for a shape or a legend entry:
    one of the user's, or the chart's own. The hand cursor shows where a
    click runs either. Handlers are compared by their source text, as a chart
    binds its own anew each time it asks.
*/

type ClickHandler = (...args: never[]) => unknown;
type Handlers = Record<string, ClickHandler | null | undefined | false>;

/**
    Whether the chart's own handler is still the one under `key`.
    @param on The chart's `on` handlers.
    @param key The event the chart handles itself: `"click.shape"` or `"click.legend"`.
    @param own The chart's handler for `key`.
*/
export function hasOwnClick(
  on: Handlers,
  key: string,
  own: ClickHandler,
): boolean {
  const handler = on[key];
  return Boolean(handler) && String(handler) === String(own);
}

/**
    Whether a click runs a handler of the user's: any `click` handler, or one
    under `key` that is not the chart's own.
    @param on The chart's `on` handlers.
    @param key The event the chart handles itself: `"click.shape"` or `"click.legend"`.
    @param own The chart's handler for `key`.
*/
export function hasUserClick(
  on: Handlers,
  key: string,
  own: ClickHandler,
): boolean {
  return ["click", key].some(
    event => Boolean(on[event]) && String(on[event]) !== String(own),
  );
}
