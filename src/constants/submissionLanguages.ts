import type { SupportedLanguage } from '@/types/submission.types'

export type SupportedEditorLanguage = SupportedLanguage

export type LanguageOption = {
  value: SupportedEditorLanguage
  label: string
  monacoLanguage: 'cpp' | 'java' | 'python'
}

export const SUBMISSION_LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'cpp', label: 'C++', monacoLanguage: 'cpp' },
  { value: 'java', label: 'Java', monacoLanguage: 'java' },
  { value: 'python', label: 'Python', monacoLanguage: 'python' },
]

export const DEFAULT_SUBMISSION_LANGUAGE: SupportedEditorLanguage = 'cpp'
