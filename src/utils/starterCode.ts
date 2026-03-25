import {
  DEFAULT_SUBMISSION_LANGUAGE,
  SUBMISSION_LANGUAGE_OPTIONS,
} from '@/constants/submissionLanguages'
import type { StarterCodeByLanguage } from '@/types/functionSignature.types'
import type { SupportedLanguage } from '@/types/submission.types'

export type LanguageDraftMap = Partial<Record<SupportedLanguage, string>>

type GetCodeForLanguageOptions = {
  language: SupportedLanguage
  drafts: LanguageDraftMap
  starterCodeByLanguage?: StarterCodeByLanguage | null
}

type MergeStoredLanguageDraftsOptions = {
  starterCodeByLanguage?: StarterCodeByLanguage | null
  storedDrafts?: Partial<Record<SupportedLanguage, string>>
  touchedLanguages?: SupportedLanguage[]
}

const EMPTY_STARTER_CODE: StarterCodeByLanguage = {
  cpp: '',
  java: '',
  python: '',
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['cpp', 'java', 'python']

function inferLegacyTouchedLanguages(
  storedDrafts?: Partial<Record<SupportedLanguage, string>>
): Set<SupportedLanguage> {
  return new Set(
    SUPPORTED_LANGUAGES.filter(language => {
      const storedDraft = storedDrafts?.[language]
      return typeof storedDraft === 'string' && storedDraft.length > 0
    })
  )
}

export function getLanguageLabel(language: SupportedLanguage): string {
  return (
    SUBMISSION_LANGUAGE_OPTIONS.find(option => option.value === language)
      ?.label ??
    SUBMISSION_LANGUAGE_OPTIONS.find(
      option => option.value === DEFAULT_SUBMISSION_LANGUAGE
    )!.label
  )
}

export function getLanguageValueFromLabel(label: string): SupportedLanguage {
  return (
    SUBMISSION_LANGUAGE_OPTIONS.find(option => option.label === label)?.value ??
    DEFAULT_SUBMISSION_LANGUAGE
  )
}

export function createInitialLanguageDrafts(
  starterCodeByLanguage?: StarterCodeByLanguage | null
): Record<SupportedLanguage, string> {
  const starter = starterCodeByLanguage ?? EMPTY_STARTER_CODE

  return {
    cpp: starter.cpp ?? '',
    java: starter.java ?? '',
    python: starter.python ?? '',
  }
}

export function mergeStoredLanguageDrafts({
  starterCodeByLanguage,
  storedDrafts,
  touchedLanguages,
}: MergeStoredLanguageDraftsOptions): Record<SupportedLanguage, string> {
  const baseDrafts = createInitialLanguageDrafts(starterCodeByLanguage)

  if (!storedDrafts) {
    return baseDrafts
  }

  const touchedLanguageSet =
    touchedLanguages && touchedLanguages.length > 0
      ? new Set(touchedLanguages)
      : inferLegacyTouchedLanguages(storedDrafts)

  return {
    cpp:
      touchedLanguageSet.has('cpp') && typeof storedDrafts.cpp === 'string'
        ? storedDrafts.cpp
        : baseDrafts.cpp,
    java:
      touchedLanguageSet.has('java') && typeof storedDrafts.java === 'string'
        ? storedDrafts.java
        : baseDrafts.java,
    python:
      touchedLanguageSet.has('python') &&
      typeof storedDrafts.python === 'string'
        ? storedDrafts.python
        : baseDrafts.python,
  }
}

export function getCodeForLanguage({
  language,
  drafts,
  starterCodeByLanguage,
}: GetCodeForLanguageOptions): string {
  const userDraft = drafts[language]
  if (typeof userDraft === 'string') {
    return userDraft
  }

  return createInitialLanguageDrafts(starterCodeByLanguage)[language]
}

export function updateLanguageDraft(
  drafts: LanguageDraftMap,
  language: SupportedLanguage,
  code: string
): LanguageDraftMap {
  return {
    ...drafts,
    [language]: code,
  }
}
