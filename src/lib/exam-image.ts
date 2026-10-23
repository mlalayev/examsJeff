/** Uploaded files must be served dynamically, including uploads made after build. */
export function resolveExamImage(src: string): string {
  if (src.startsWith('/images/')) return `/api${src}`;
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(src, window.location.origin);
      if (url.origin === window.location.origin && url.pathname.startsWith('/images/')) {
        return `/api${url.pathname}${url.search}${url.hash}`;
      }
    } catch { /* Preserve external/data URLs and let the browser handle them. */ }
  }
  return src;
}
