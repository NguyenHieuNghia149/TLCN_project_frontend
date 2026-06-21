import type { LanguageCatalogEntry } from '@/types/language.types'
import type { SupportedLanguage } from '@/types/submission.types'

export type SupportedEditorLanguage = SupportedLanguage

export type LanguageOption = {
  value: SupportedEditorLanguage
  label: string
  monacoLanguage: string
}

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  cpp: 'cpp',
  cplusplus: 'cpp',
  java: 'java',
  python: 'python',
  py: 'python',
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  csharp: 'csharp',
  cs: 'csharp',
  go: 'go',
  golang: 'go',
}

export const DEFAULT_SUBMISSION_LANGUAGE: SupportedEditorLanguage = 'cpp'

export const SUBMISSION_LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'cpp', label: 'C++', monacoLanguage: 'cpp' },
  { value: 'java', label: 'Java', monacoLanguage: 'java' },
  { value: 'python', label: 'Python', monacoLanguage: 'python' },
]

export function resolveMonacoLanguage(language: string): string {
  return MONACO_LANGUAGE_MAP[language] ?? 'plaintext'
}

export function buildSubmissionLanguageOptions(
  languages?: LanguageCatalogEntry[]
): LanguageOption[] {
  if (!languages || languages.length === 0) {
    return SUBMISSION_LANGUAGE_OPTIONS
  }

  return [...languages]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(language => ({
      value: language.key,
      label: language.displayName,
      monacoLanguage: resolveMonacoLanguage(language.key),
    }))
}

export function getDefaultSubmissionLanguage(
  languages?: LanguageCatalogEntry[]
): SupportedEditorLanguage {
  return (
    buildSubmissionLanguageOptions(languages)[0]?.value ??
    DEFAULT_SUBMISSION_LANGUAGE
  )
}
