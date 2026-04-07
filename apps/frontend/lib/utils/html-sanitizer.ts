/**
 * HTML Sanitization Utilities
 *
 * Uses dynamic imports to avoid bundling issues with isomorphic-dompurify
 * during static generation. The DOMPurify library is only loaded when
 * sanitization is actually needed at runtime.
 */

/**
 * Whitelist of allowed HTML tags for rich text content
 */
const ALLOWED_TAGS = ['strong', 'em', 'u', 'a'];

/**
 * Whitelist of allowed HTML attributes
 */
const ALLOWED_ATTR = ['href', 'target', 'rel'];

// Cache for the DOMPurify instance
let purifyInstance: typeof import('isomorphic-dompurify').default | null = null;

/**
 * Dynamically imports and caches the DOMPurify instance.
 * This avoids bundling issues during static generation.
 */
async function getDOMPurify() {
  if (!purifyInstance) {
    const DOMPurify = (await import('isomorphic-dompurify')).default;
    purifyInstance = DOMPurify;
  }
  return purifyInstance;
}

/**
 * Sanitizes HTML content using DOMPurify with a strict whitelist.
 * Only allows bold, italic, underline, and link formatting.
 *
 * @param dirty - The unsanitized HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export async function sanitizeHtml(dirty: string): Promise<string> {
  const DOMPurify = await getDOMPurify();
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORCE_BODY: true,
  });
}

/**
 * Sanitizes HTML content synchronously (for browser-only usage).
 * Falls back to basic tag stripping if DOMPurify is not available.
 *
 * @param dirty - The unsanitized HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHtmlSync(dirty: string): string {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Use browser's native DOM API for sanitization
    const div = document.createElement('div');
    div.innerHTML = dirty;

    // Remove disallowed tags
    const allElements = div.getElementsByTagName('*');
    for (let i = allElements.length - 1; i >= 0; i--) {
      const el = allElements[i];
      if (!ALLOWED_TAGS.includes(el.tagName.toLowerCase())) {
        // Replace tag with its text content
        const text = document.createTextNode(el.textContent || '');
        el.parentNode?.replaceChild(text, el);
      } else {
        // Remove disallowed attributes
        Array.from(el.attributes).forEach((attr) => {
          if (!ALLOWED_ATTR.includes(attr.name.toLowerCase())) {
            el.removeAttribute(attr.name);
          }
        });
      }
    }

    return div.innerHTML;
  }

  // Server-side fallback: basic tag stripping
  return dirty.replace(/<[^>]*>/g, '');
}

/**
 * Strips all HTML tags from content, returning plain text.
 *
 * @param html - HTML string to strip
 * @returns Plain text with all tags removed
 */
export function stripHtml(html: string): string {
  if (typeof window !== 'undefined') {
    // Browser: use DOM API
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  // Server-side: regex-based stripping
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Checks if a string contains HTML tags.
 *
 * @param text - String to check
 * @returns True if the string contains HTML tags
 */
export function isHtmlContent(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}
