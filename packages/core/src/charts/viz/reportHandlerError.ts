/**
    Reports an error an event handler threw without interrupting the event:
    `reportError` logs it as an uncaught error (with its stack) and fires the
    window's `error` event, so the remaining handlers still run. Falls back to
    `console.error` where `reportError` doesn't exist.
*/
export function reportHandlerError(error: unknown): void {
  const report = (globalThis as {reportError?: (e: unknown) => void})
    .reportError;
  if (typeof report === "function") report(error);
  else console.error(error);
}
