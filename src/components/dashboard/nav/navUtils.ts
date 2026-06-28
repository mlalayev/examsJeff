export type CollapsibleSubItem = {
  label: string;
  href: string;
  disabled?: boolean;
  comingSoon?: boolean;
};

/** Among sibling subs, return the single best-matching href (longest prefix wins). */
export function getActiveSubHref(
  pathname: string,
  subs: CollapsibleSubItem[],
  exactMatch = false
): string | null {
  let best: string | null = null;
  for (const sub of subs) {
    if (sub.disabled) continue;
    const matches = exactMatch
      ? pathname === sub.href
      : pathname === sub.href || pathname.startsWith(sub.href + "/");
    if (matches && (!best || sub.href.length > best.length)) {
      best = sub.href;
    }
  }
  return best;
}
