export type HtmlCssFieldType = "text" | "radio" | "checkbox" | "select" | "textarea";

export type HtmlCssAnswerKeyV1 = {
  mode: "HTML_ATTRS_V1";
  fields: Record<
    string,
    {
      type: HtmlCssFieldType;
      /** For text/select/textarea/radio: acceptable values. For checkbox: ["true"] or ["false"] */
      accepted: string[];
    }
  >;
};

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) {
    const key = m[1];
    const val = m[2] ?? m[3] ?? m[4] ?? "";
    attrs[key] = val;
  }
  return attrs;
}

function splitPipeList(raw: string): string[] {
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Extract correct answers from HTML for HTML_CSS questions.
 *
 * Conventions:
 * - Text inputs / textarea / select: use `name="..."` and `data-answer="a | b | c"`
 * - Radio: use `name="group"` and set `data-correct="true"` on correct options (value required)
 * - Checkbox: use `name="..."` and `data-answer="true"` or `data-answer="false"`
 */
export function extractHtmlCssAnswerKeyV1(html: string): HtmlCssAnswerKeyV1 {
  const fields: HtmlCssAnswerKeyV1["fields"] = {};

  // INPUT tags
  const inputTags = html.match(/<input\b[^>]*>/gi) || [];
  for (const tag of inputTags) {
    const a = parseAttributes(tag);
    const type = (a.type || "text").toLowerCase();
    const name = a.name || a.id;
    if (!name) continue;

    if (type === "radio") {
      if ((a["data-correct"] || "").toLowerCase() === "true") {
        const v = a.value ?? "";
        if (!v) continue;
        const existing = fields[name];
        if (!existing) {
          fields[name] = { type: "radio", accepted: [v] };
        } else {
          if (!existing.accepted.includes(v)) existing.accepted.push(v);
        }
      }
      continue;
    }

    if (type === "checkbox") {
      const raw = a["data-answer"];
      if (!raw) continue;
      const normalized = raw.trim().toLowerCase();
      if (normalized === "true" || normalized === "false") {
        fields[name] = { type: "checkbox", accepted: [normalized] };
      }
      continue;
    }

    // Treat everything else as text-like if it has data-answer
    const raw = a["data-answer"];
    if (!raw) continue;
    fields[name] = { type: "text", accepted: splitPipeList(raw) };
  }

  // TEXTAREA tags
  const textareaTags = html.match(/<textarea\b[^>]*>/gi) || [];
  for (const tag of textareaTags) {
    const a = parseAttributes(tag);
    const name = a.name || a.id;
    if (!name) continue;
    const raw = a["data-answer"];
    if (!raw) continue;
    fields[name] = { type: "textarea", accepted: splitPipeList(raw) };
  }

  // SELECT tags
  const selectTags = html.match(/<select\b[^>]*>/gi) || [];
  for (const tag of selectTags) {
    const a = parseAttributes(tag);
    const name = a.name || a.id;
    if (!name) continue;
    const raw = a["data-answer"];
    if (!raw) continue;
    fields[name] = { type: "select", accepted: splitPipeList(raw) };
  }

  return { mode: "HTML_ATTRS_V1", fields };
}

