// Utility function để normalize whitespace và newlines
export const normalizeWhitespace = (text: string): string => {
  if (!text) return ''

  return text
    .replace(/\\n/g, '\n') // Thay thế \n thành newline thực sự
    .replace(/\r\n/g, '\n') // Normalize Windows line endings
    .replace(/\r/g, '\n') // Normalize Mac line endings
    .replace(/\n{3,}/g, '\n\n') // Giảm nhiều newlines liên tiếp thành 2 newlines
    .replace(/[ \t]+$/gm, '') // Loại bỏ trailing spaces trên mỗi dòng
    .replace(/^[ \t]+/gm, '') // Loại bỏ leading spaces trên mỗi dòng
    .trim() // Loại bỏ spaces ở đầu và cuối
}

// Utility function để format text từ API
export const formatProblemDescription = (text: string): string => {
  if (!text) return ''

  // Normalize whitespace trước
  let formatted = normalizeWhitespace(text).replace(/\n/g, '<br>') // Thay thế newline thành <br> tag

  // Thay thế các ký tự HTML entities
  formatted = formatted
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  return formatted
}

// Utility function để format constraint text
export const formatConstraintText = (text: string): string => {
  if (!text) return ''

  // Sử dụng normalizeWhitespace và convert thành <br>
  return normalizeWhitespace(text).replace(/\n/g, '<br>')
}

// Utility function để format code trong text
export const formatCodeInText = (text: string): string => {
  if (!text) return ''

  let formatted = text

  // Format inline code với backticks
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Format code blocks với triple backticks
  formatted = formatted.replace(
    /```([\s\S]*?)```/g,
    '<pre><code>$1</code></pre>'
  )

  return formatted
}

// Utility function để format examples và input/output
export const formatExamples = (text: string): string => {
  if (!text) return ''

  let formatted = text

  // Format "Example X:" thành heading
  formatted = formatted.replace(
    /Example (\d+):/g,
    '<h4 class="example-heading">Example $1:</h4>'
  )

  // Format "Input:" và "Output:" thành bold
  formatted = formatted.replace(
    /(Input:|Output:|Explanation:)/g,
    '<strong>$1</strong>'
  )

  return formatted
}

// Main function để format toàn bộ problem description
export const formatProblemText = (text: string): string => {
  if (!text) return ''

  let formatted = text

  // 1. Format code blocks trước
  formatted = formatCodeInText(formatted)

  // 2. Format examples
  formatted = formatExamples(formatted)

  // 3. Format newlines
  formatted = formatProblemDescription(formatted)

  return formatted
}
