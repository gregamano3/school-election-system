/**
 * Simple HTML sanitization utilities
 * For production, consider using a library like DOMPurify or sanitize-html
 */

/**
 * Remove HTML tags and return plain text
 * Basic sanitization - removes all HTML tags
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Escape HTML special characters
 * Prevents XSS by converting <, >, &, ", ' to HTML entities
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitize text input - removes HTML and escapes special characters
 * Use for user-generated content like names, descriptions, bios
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";
  // First strip HTML tags, then escape remaining special characters
  return escapeHtml(stripHtml(input));
}

/**
 * Sanitize text but allow line breaks (converts \n to <br>)
 * Use for multi-line text like bios, descriptions
 */
export function sanitizeMultilineText(input: string | null | undefined): string {
  if (!input) return "";
  const sanitized = sanitizeText(input);
  // Convert line breaks to <br> tags
  return sanitized.replace(/\n/g, "<br>");
}
