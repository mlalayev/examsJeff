/**
 * Utilities for INLINE_SELECT questions with one or more inline dropdowns.
 */

export function countInlineSelectBlanks(promptText: string): number {
  const matches = promptText.match(/____+|___+/g);
  return matches && matches.length > 0 ? matches.length : 1;
}

export interface InlineSelectBlankOptions {
  choices: string[];
}

export interface InlineSelectOptions {
  choices?: string[];
  blanks?: InlineSelectBlankOptions[];
}

/** Resolve per-blank choice lists (falls back to shared `choices`). */
export function getInlineSelectBlankChoices(
  options: InlineSelectOptions | null | undefined,
  blankCount: number
): string[][] {
  const shared = options?.choices || [];
  const blanks = options?.blanks || [];
  return Array.from({ length: blankCount }, (_, i) => {
    const fromBlank = blanks[i]?.choices;
    if (Array.isArray(fromBlank) && fromBlank.length > 0) return fromBlank;
    return shared;
  });
}

/** Ensure options.blanks array matches blank count in prompt. */
export function syncInlineSelectBlanks(
  options: InlineSelectOptions | undefined,
  blankCount: number
): InlineSelectOptions {
  const shared = options?.choices || ["Option 1", "Option 2", "Option 3"];
  const existing = options?.blanks || [];
  const blanks: InlineSelectBlankOptions[] = Array.from({ length: blankCount }, (_, i) => {
    if (existing[i]?.choices?.length) {
      return { choices: [...existing[i].choices] };
    }
    return { choices: [...shared] };
  });
  return { ...options, choices: shared, blanks };
}

export function isMultiInlineSelectAnswer(
  value: unknown
): value is Record<string, number> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}
