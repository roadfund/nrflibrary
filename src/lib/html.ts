import DOMPurify from 'isomorphic-dompurify';

/** Plain-text length/preview for HTML produced by the rich text editor. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Sanitizes rich text editor output before rendering with dangerouslySetInnerHTML. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'strong',
      'em',
      'ul',
      'ol',
      'li',
      'br',
      'h1',
      'h2',
      'h3',
      'a',
      'blockquote',
      'code',
    ],
    ALLOWED_ATTR: ['href', 'rel', 'target', 'style'],
  });
}
