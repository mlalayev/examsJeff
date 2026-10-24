export function splitMathText(text: string): { text: string; math?: boolean; display?: boolean }[] {
  const parts: { text: string; math?: boolean; display?: boolean }[] = [];
  const pattern = /(?<!\\)\$\$([\s\S]+?)(?<!\\)\$\$|(?<![\\$])\$(?!\$)([^\n$]+?)(?<!\\)\$(?!\$)/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const expression = match[1] ?? match[2];
    // Whitespace next to an inline delimiter usually indicates ordinary currency prose.
    if (match[2] !== undefined && expression !== expression.trim()) continue;
    if (match.index! > cursor) parts.push({ text: text.slice(cursor, match.index) });
    parts.push({ text: expression, math: true, display: match[1] !== undefined });
    cursor = match.index! + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}
