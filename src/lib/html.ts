import sanitize from 'sanitize-html';

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
  return sanitize(html, {
    allowedTags: [
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
    allowedAttributes: {
      '*': ['style'],
      a: ['href', 'rel', 'target'],
    },
    allowedStyles: {
      '*': { 'text-align': [/^(left|right|center|justify)$/] },
    },
  });
}
