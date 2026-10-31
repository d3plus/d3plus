/**
 * The Storybook site's page ids and where each moved, for the head script
 * that forwards old `?path=` links (see `lib/legacy.ts`).
 */
import {legacyPages} from "../lib/legacy";

export const GET = () =>
  new Response(JSON.stringify(legacyPages()), {
    headers: {"Content-Type": "application/json"},
  });
