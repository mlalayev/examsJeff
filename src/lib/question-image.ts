/** Older edits used prompt.image; older creates used prompt.imageUrl. */
export function questionImageSource(question: { image?: unknown; prompt?: any }): string | null {
  return [question.image, question.prompt?.image, question.prompt?.imageUrl]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0) || null;
}

export function questionImageForSave(question: { image?: string | null; prompt?: any }) {
  const prompt = { ...(question.prompt || {}) };
  const image = question.image !== undefined ? question.image || null : questionImageSource(question);
  delete prompt.image;
  delete prompt.imageUrl;
  if (image) prompt.imageUrl = image;
  return { image, prompt };
}
