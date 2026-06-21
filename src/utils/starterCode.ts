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
  languages?: SupportedLanguage[]
  starterCodeByLanguage?: StarterCodeByLanguage | null
  storedDrafts?: Partial<Record<SupportedLanguage, string>>
  touchedLanguages?: SupportedLanguage[]
}

const LEGACY_FALLBACK_LANGUAGES: SupportedLanguage[] = ['cpp', 'java', 'python']

function resolveLanguages(
  languages?: SupportedLanguage[],
  starterCodeByLanguage?: StarterCodeByLanguage | null,
  storedDrafts?: Partial<Record<SupportedLanguage, string>>
): SupportedLanguage[] {
  if (Array.isArray(languages) && languages.length > 0) {
    return [...languages]
  }

  const inferredLanguages = new Set<SupportedLanguage>([
    ...Object.keys(starterCodeByLanguage ?? {}),
    ...Object.keys(storedDrafts ?? {}),
  ])

  if (inferredLanguages.size > 0) {
    return [...inferredLanguages]
  }

  return [...LEGACY_FALLBACK_LANGUAGES]
}

function inferLegacyTouchedLanguages(
  languages: SupportedLanguage[],
  storedDrafts?: Partial<Record<SupportedLanguage, string>>
): Set<SupportedLanguage> {
  return new Set(
    languages.filter(language => {
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
    )?.label ??
    language
  )
}

export function getLanguageValueFromLabel(label: string): SupportedLanguage {
  return (
    SUBMISSION_LANGUAGE_OPTIONS.find(option => option.label === label)?.value ??
    DEFAULT_SUBMISSION_LANGUAGE
  )
}

export function createInitialLanguageDrafts(
  languages: SupportedLanguage[],
  starterCodeByLanguage?: StarterCodeByLanguage | null
): Record<SupportedLanguage, string>
export function createInitialLanguageDrafts(
  starterCodeByLanguage?: StarterCodeByLanguage | null
): Record<SupportedLanguage, string>
export function createInitialLanguageDrafts(
  languagesOrStarterCode?: SupportedLanguage[] | StarterCodeByLanguage | null,
  maybeStarterCode?: StarterCodeByLanguage | null
): Record<SupportedLanguage, string> {
  const languages = Array.isArray(languagesOrStarterCode)
    ? resolveLanguages(languagesOrStarterCode, maybeStarterCode)
    : resolveLanguages(undefined, languagesOrStarterCode ?? undefined)
  const starterCodeByLanguage = Array.isArray(languagesOrStarterCode)
    ? maybeStarterCode
    : languagesOrStarterCode

  return languages.reduce<Record<SupportedLanguage, string>>(
    (drafts, language) => {
      drafts[language] = starterCodeByLanguage?.[language] ?? ''
      return drafts
    },
    {}
  )
}

export function mergeStoredLanguageDrafts({
  languages,
  starterCodeByLanguage,
  storedDrafts,
  touchedLanguages,
}: MergeStoredLanguageDraftsOptions): Record<SupportedLanguage, string> {
  const resolvedLanguages = resolveLanguages(
    languages,
    starterCodeByLanguage,
    storedDrafts
  )
  const baseDrafts = createInitialLanguageDrafts(
    resolvedLanguages,
    starterCodeByLanguage
  )

  if (!storedDrafts) {
    return baseDrafts
  }

  const touchedLanguageSet =
    touchedLanguages && touchedLanguages.length > 0
      ? new Set(touchedLanguages)
      : inferLegacyTouchedLanguages(resolvedLanguages, storedDrafts)

  return resolvedLanguages.reduce<Record<SupportedLanguage, string>>(
    (drafts, language) => {
      drafts[language] =
        touchedLanguageSet.has(language) &&
        typeof storedDrafts[language] === 'string'
          ? (storedDrafts[language] ?? '')
          : (baseDrafts[language] ?? '')
      return drafts
    },
    {}
  )
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

  return starterCodeByLanguage?.[language] ?? ''
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
