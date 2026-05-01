/**
 * HTML_CSS question type: correct answers live in HTML attributes.
 * We derive a stable machine-readable answerKey and inject stable element ids for collecting answers.
 */

import { parseHTML } from "linkedom";

export type HtmlCssAnswerPayload = {
  texts: Record<string, string[]>;
  radios: Record<string, string[]>;
  checks: Record<string, boolean>;
};

export type HtmlCssProcessed = {
  answerKeyPayload: HtmlCssAnswerPayload;
  /** Body HTML with htmlcss_* ids injected (same order as keys) */
  augmentedBodyHtml: string;
};

function isTextInput(el: Element): boolean {
  if (el.tagName.toLowerCase() === "textarea") return true;
  if (el.tagName.toLowerCase() !== "input") return false;
  const t = ((el as HTMLInputElement).type || "").toLowerCase();
  return t === "text" || t === "email" || t === "number" || t === "search" || t === "" || t === "tel" || t === "url";
}

function parseHtmlCssRoot(htmlCode: string): HTMLElement | null {
  const html = htmlCode ?? "";
  const wrapped = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><div id="__html_css_root">${html}</div></body></html>`;
  const { document } = parseHTML(wrapped);
  return document.getElementById("__html_css_root") as HTMLElement | null;
}

/**
 * Walk fragment once: build answer key + inject ids for stable answer collection.
 */
export function processHtmlCssQuestion(htmlCode: string): HtmlCssProcessed {
  const texts: Record<string, string[]> = {};
  const radios: Record<string, string[]> = {};
  const checks: Record<string, boolean> = {};

  const root = parseHtmlCssRoot(htmlCode || "");
  if (!root) {
    return {
      answerKeyPayload: { texts: {}, radios: {}, checks: {} },
      augmentedBodyHtml: htmlCode || "",
    };
  }

  let ti = 0;
  let ci = 0;

  // Text-like inputs with data-answer (pipe-separated acceptable answers)
  root.querySelectorAll("textarea[data-answer], input[data-answer]").forEach((el) => {
    if (el.tagName.toLowerCase() === "input") {
      const inp = el as HTMLInputElement;
      const t = (inp.type || "").toLowerCase();
      if (t === "radio" || t === "checkbox" || t === "hidden" || t === "submit" || t === "button") return;
      if (!isTextInput(el)) return;
    } else if (el.tagName.toLowerCase() !== "textarea") {
      return;
    }

    const raw = el.getAttribute("data-answer");
    if (!raw) return;
    const key = `htmlcss_text_${ti++}`;
    texts[key] = raw
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    el.setAttribute("id", key);
    el.setAttribute("data-html-css-key", key);
  });

  // Plain textarea / text inputs without data-answer: still collect responses (graded as non-empty = attempted)
  root.querySelectorAll("textarea, input").forEach((el) => {
    if (el.hasAttribute("data-html-css-key")) return;
    if (el.tagName.toLowerCase() === "input") {
      const inp = el as HTMLInputElement;
      const t = (inp.type || "").toLowerCase();
      if (t === "radio" || t === "checkbox" || t === "hidden" || t === "submit" || t === "button") return;
      if (!isTextInput(el)) return;
    } else if (el.tagName.toLowerCase() !== "textarea") {
      return;
    }
    const key = `htmlcss_text_${ti++}`;
    texts[key] = [];
    el.setAttribute("id", key);
    el.setAttribute("data-html-css-key", key);
  });

  // Radios: correct options marked data-correct="true", group by name
  const radioByName: Record<string, Set<string>> = {};
  root.querySelectorAll('input[type="radio"][data-correct="true"]').forEach((el) => {
    const inp = el as HTMLInputElement;
    const name = inp.getAttribute("name") || "_unnamed";
    const val = inp.getAttribute("value") ?? "";
    if (!radioByName[name]) radioByName[name] = new Set();
    radioByName[name].add(val);
  });
  Object.entries(radioByName).forEach(([name, set]) => {
    radios[`htmlcss_radio_${name}`] = [...set];
  });

  // Checkboxes: data-answer true/false for expected checked state
  root.querySelectorAll('input[type="checkbox"][data-answer]').forEach((el) => {
    const inp = el as HTMLInputElement;
    const key = `htmlcss_check_${ci++}`;
    const v = (inp.getAttribute("data-answer") || "").toLowerCase().trim();
    checks[key] = v === "true" || v === "1" || v === "yes";
    inp.setAttribute("id", key);
    inp.setAttribute("data-html-css-key", key);
  });

  return {
    answerKeyPayload: { texts, radios, checks },
    augmentedBodyHtml: root.innerHTML,
  };
}

export function buildHtmlCssAnswerKeyFromPrompt(prompt: { htmlCode?: string } | null | undefined) {
  const html = prompt?.htmlCode || "";
  return processHtmlCssQuestion(html).answerKeyPayload;
}

/** Normalize text for comparison (same spirit as scoring SHORT_TEXT) */
function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[.,!?\\/\-_:;"'()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns 1 if all parts correct, else 0 (whole question).
 */
export function scoreHtmlCssInteractive(studentAnswer: any, answerKey: any): number {
  const payload = answerKey?.htmlCss as HtmlCssAnswerPayload | undefined;
  if (!payload || typeof studentAnswer !== "object" || studentAnswer === null) return 0;

  const { texts, radios, checks } = payload;
  const parts: boolean[] = [];

  for (const [key, acceptable] of Object.entries(texts)) {
    const raw = studentAnswer[key];
    const studentText = raw === undefined || raw === null ? "" : String(raw);
    if (!acceptable.length) {
      parts.push(norm(studentText).length > 0);
      continue;
    }
    const ok = acceptable.some((a) => norm(String(a)) === norm(studentText));
    parts.push(ok);
  }

  for (const [key, acceptableVals] of Object.entries(radios)) {
    const sel = studentAnswer[key];
    if (sel === undefined || sel === null) {
      parts.push(false);
      continue;
    }
    const val = String(sel);
    parts.push(acceptableVals.some((a) => String(a) === val));
  }

  for (const [key, mustCheck] of Object.entries(checks)) {
    const v = studentAnswer[key];
    const checked = v === true || v === "true";
    if (mustCheck) parts.push(checked);
    else parts.push(!checked);
  }

  if (parts.length === 0) return 0;
  return parts.every(Boolean) ? 1 : 0;
}

export function formatHtmlCssAnswerForDisplay(obj: any): string {
  if (obj === null || obj === undefined) return "—";
  if (typeof obj !== "object" || Array.isArray(obj)) return String(obj);
  const entries = Object.entries(obj).filter(([_, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "—";
  return entries.map(([k, v]) => `${k}: ${typeof v === "boolean" ? (v ? "yes" : "no") : String(v)}`).join("; ");
}

export function formatHtmlCssCorrectForDisplay(answerKey: any): string {
  const payload = answerKey?.htmlCss as HtmlCssAnswerPayload | undefined;
  if (!payload) return "—";
  const bits: string[] = [];
  Object.entries(payload.texts).forEach(([k, arr]) => {
    bits.push(arr.length ? `${k}: ${arr.join(" | ")}` : `${k}: (any non-empty answer)`);
  });
  Object.entries(payload.radios).forEach(([k, arr]) => {
    bits.push(`${k}: ${arr.join(" | ")}`);
  });
  Object.entries(payload.checks).forEach(([k, b]) => {
    bits.push(`${k}: ${b ? "checked" : "unchecked"}`);
  });
  return bits.length ? bits.join("\n") : "—";
}
