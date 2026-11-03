/**
    Unique scene keys for links whose base key names only their ends, so
    parallel links (the same source and target) each get their own.
*/

/**
    One unique key per base key, in order: the first link with a base keeps
    it, and each later one adds its order among the links sharing that base
    (`-1`, `-2`, …), skipping any key already taken. The same bases give the
    same keys on every call.
*/
export function uniqueLinkKeys(bases: readonly string[]): string[] {
  const taken = new Set<string>();
  const seen = new Map<string, number>();
  return bases.map(base => {
    let n = seen.get(base) ?? 0;
    let key = n ? `${base}-${n}` : base;
    while (taken.has(key)) key = `${base}-${++n}`;
    seen.set(base, n + 1);
    taken.add(key);
    return key;
  });
}
