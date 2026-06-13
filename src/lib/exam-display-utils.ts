/**
 * Utilities for safely displaying exam section instructions and question prompts
 * in admin UI. Prisma stores `instruction` as Json, so it may arrive as an object
 * rather than a JSON string.
 */

function coerceToDisplayString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "text" in value) {
    return coerceToDisplayString((value as { text: unknown }).text);
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export interface ParsedSectionInstruction {
  text: string;
  passage: unknown;
  audio: string | null;
  introduction?: string;
  image?: string;
  image2?: string;
}

export function parseSectionInstruction(instruction: unknown): ParsedSectionInstruction {
  if (instruction == null || instruction === "") {
    return { text: "", passage: null, audio: null };
  }

  let data: Record<string, unknown>;
  if (typeof instruction === "string") {
    try {
      const parsed = JSON.parse(instruction);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        data = parsed as Record<string, unknown>;
      } else {
        return { text: instruction, passage: null, audio: null };
      }
    } catch {
      return { text: instruction, passage: null, audio: null };
    }
  } else if (typeof instruction === "object" && !Array.isArray(instruction)) {
    data = instruction as Record<string, unknown>;
  } else {
    return { text: String(instruction), passage: null, audio: null };
  }

  return {
    text: coerceToDisplayString(data.text),
    passage: data.passage ?? null,
    audio: typeof data.audio === "string" ? data.audio : null,
    introduction: typeof data.introduction === "string" ? data.introduction : undefined,
    image: typeof data.image === "string" ? data.image : undefined,
    image2: typeof data.image2 === "string" ? data.image2 : undefined,
  };
}

export function getPromptDisplayText(prompt: unknown): string {
  if (prompt == null) return "";
  if (typeof prompt === "string") return prompt;
  if (typeof prompt === "object" && !Array.isArray(prompt)) {
    const p = prompt as Record<string, unknown>;
    if (p.text != null) return coerceToDisplayString(p.text);
    if (Array.isArray(p.tokens)) return p.tokens.map(String).join("\n");
    if (typeof p.textWithBlanks === "string") return p.textWithBlanks;
    try {
      return JSON.stringify(prompt);
    } catch {
      return "";
    }
  }
  return String(prompt);
}
