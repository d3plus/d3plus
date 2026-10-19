/**
    Makes each id in the list unique: a repeat takes the first free `~n`
    suffix, in order, so the first of each id keeps it unchanged.
    @param ids The ids, in draw order.
*/
export function uniqueIds(ids: string[]): string[] {
  const used = new Set(ids);
  const seen = new Set<string>();
  return ids.map(id => {
    if (!seen.has(id)) {
      seen.add(id);
      return id;
    }
    let n = 1;
    while (used.has(`${id}~${n}`)) n++;
    const next = `${id}~${n}`;
    used.add(next);
    return next;
  });
}
