/** Non-blocking exam notice: never opens an OS/browser dialog or exits fullscreen. */
export function showExamNotice(message: unknown) {
  window.dispatchEvent(new CustomEvent('exam-notice', { detail: String(message) }));
}
