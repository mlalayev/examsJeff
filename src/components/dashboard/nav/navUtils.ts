export type CollapsibleSubItem = {
  label: string;
  href?: string;
  disabled?: boolean;
  comingSoon?: boolean;
  children?: CollapsibleSubItem[];
};

export function flattenNavSubs(subs: CollapsibleSubItem[]): CollapsibleSubItem[] {
  const out: CollapsibleSubItem[] = [];
  for (const sub of subs) {
    if (sub.href) out.push(sub);
    if (sub.children?.length) out.push(...flattenNavSubs(sub.children));
  }
  return out;
}

/** Among sibling (and nested) subs, return the single best-matching href (longest prefix wins). */
export function getActiveSubHref(
  pathname: string,
  subs: CollapsibleSubItem[],
  exactMatch = false
): string | null {
  let best: string | null = null;
  for (const sub of flattenNavSubs(subs)) {
    if (sub.disabled || !sub.href) continue;
    const matches = exactMatch
      ? pathname === sub.href
      : pathname === sub.href || pathname.startsWith(sub.href + "/");
    if (matches && (!best || sub.href.length > best.length)) {
      best = sub.href;
    }
  }
  return best;
}
