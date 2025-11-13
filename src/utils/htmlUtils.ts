/**
 * Utility functions for HTML content manipulation
 */

/**
 * Strips HTML tags from a string
 * @param html - HTML string to strip tags from
 * @returns Plain text without HTML tags
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return ''

  // Create a temporary div element to parse HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  // Get text content and clean up whitespace
  return tempDiv.textContent || tempDiv.innerText || ''
}

/**
 * Truncates HTML content to a specified length while preserving HTML structure
 * @param html - HTML string to truncate
 * @param maxLength - Maximum length of the preview (default: 150)
 * @returns Truncated HTML string
 */
export const truncateHtmlContent = (
  html: string,
  maxLength: number = 150
): string => {
  if (!html) return ''

  // First strip HTML tags to get plain text
  const plainText = stripHtmlTags(html)

  // If plain text is shorter than maxLength, return original HTML
  if (plainText.length <= maxLength) {
    return html
  }

  // Truncate plain text
  const truncatedText = plainText.substring(0, maxLength).trim()

  // Find the last complete word to avoid cutting words
  const lastSpaceIndex = truncatedText.lastIndexOf(' ')
  const finalText =
    lastSpaceIndex > 0
      ? truncatedText.substring(0, lastSpaceIndex)
      : truncatedText

  return finalText + '...'
}

/**
 * Creates a safe HTML preview by stripping tags and truncating
 * @param html - HTML string to create preview from
 * @param maxLength - Maximum length of the preview (default: 150)
 * @returns Safe text preview
 */
export const createHtmlPreview = (
  html: string,
  maxLength: number = 150
): string => {
  if (!html) return 'No description available'

  const plainText = stripHtmlTags(html)
  const truncatedText =
    plainText.length > maxLength
      ? plainText.substring(0, maxLength).trim() + '...'
      : plainText

  return truncatedText || 'No description available'
}
