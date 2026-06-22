import * as mammoth from 'mammoth'

/**
 * Kết quả trả về khi chuyển đổi .docx
 */
export interface ParseDocxResult {
  html: string
  error: string
}

/**
 * Chuyển đổi file Word (.docx) thành HTML thuần túy
 * @param file - File Word (.docx) từ input[type="file"]
 * @returns Promise<ParseDocxResult>
 */
export const parseDocxToHtml = async (
  file: File | null
): Promise<ParseDocxResult> => {
  return new Promise(resolve => {
    if (!file || !isValidDocxFile(file)) {
      resolve({
        html: '',
        error: 'Invalid file. Please select a .docx file',
      })
      return
    }

    const reader = new FileReader()

    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const result = await mammoth.convertToHtml({ arrayBuffer })
        // Trả về HTML thuần túy, không xử lý code
        resolve({ html: result.value || '', error: '' })
      } catch (err) {
        console.error('Failed to convert docx file:', err)
        resolve({
          html: '',
          error: 'Failed to convert file. Please check the file content.',
        })
      }
    }

    reader.onerror = () => {
      resolve({ html: '', error: 'Failed to read file' })
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * Kiểm tra file .docx hợp lệ
 * @param file
 * @returns boolean
 */
export const isValidDocxFile = (file: File | null): boolean => {
  if (!file) return false
  const ext = file.name.split('.').pop()?.toLowerCase()
  const mime = file.type.toLowerCase()
  return (
    ext === 'docx' &&
    mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
}
