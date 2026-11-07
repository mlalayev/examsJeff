// Browser hints, not an OS/extension security boundary.
export const examAnswerInputProps = {
  spellCheck: false,
  autoCorrect: 'off',
  autoComplete: 'off',
  autoCapitalize: 'off',
  writingsuggestions: 'false',
  'data-gramm': 'false',
  'data-gramm_editor': 'false',
  'data-enable-grammarly': 'false',
} as const;

export function disableAnswerAssistance(root: Document) {
  root.querySelectorAll('input, textarea, [contenteditable]').forEach(element => {
    element.setAttribute('spellcheck', 'false');
    element.setAttribute('autocorrect', 'off');
    element.setAttribute('autocomplete', 'off');
    element.setAttribute('autocapitalize', 'off');
    element.setAttribute('writingsuggestions', 'false');
    element.setAttribute('data-gramm', 'false');
    element.setAttribute('data-gramm_editor', 'false');
    element.setAttribute('data-enable-grammarly', 'false');
  });
}
