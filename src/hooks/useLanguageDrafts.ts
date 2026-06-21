import { useCallback, useEffect, useMemo, useState } from 'react'

import { DEFAULT_SUBMISSION_LANGUAGE } from '@/constants/submissionLanguages'
import type { StarterCodeByLanguage } from '@/types/functionSignature.types'
import type { SupportedLanguage } from '@/types/submission.types'
import {
  createInitialLanguageDrafts,
  getCodeForLanguage,
  mergeStoredLanguageDrafts,
  type LanguageDraftMap,
  updateLanguageDraft,
} from '@/utils/starterCode'

type StoredEditorState = {
  version: 2
  selectedLanguage?: SupportedLanguage
  drafts?: Partial<Record<SupportedLanguage, string>>
  touchedLanguages?: SupportedLanguage[]
}

const STORAGE_VERSION = 2

function resolveLanguages(
  languages?: SupportedLanguage[],
  starterCodeByLanguage?: StarterCodeByLanguage | null
): SupportedLanguage[] {
  if (Array.isArray(languages) && languages.length > 0) {
    return [...languages]
  }

  const starterLanguages = Object.keys(starterCodeByLanguage ?? {})
  if (starterLanguages.length > 0) {
    return starterLanguages
  }

  return [DEFAULT_SUBMISSION_LANGUAGE]
}

function isKnownLanguage(
  value: unknown,
  languages: SupportedLanguage[]
): value is SupportedLanguage {
  return typeof value === 'string' && languages.includes(value)
}

function normalizeTouchedLanguages(
  value: unknown,
  languages: SupportedLanguage[]
): SupportedLanguage[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(language => isKnownLanguage(language, languages))
}

function addTouchedLanguage(
  touchedLanguages: SupportedLanguage[],
  language: SupportedLanguage
): SupportedLanguage[] {
  return touchedLanguages.includes(language)
    ? touchedLanguages
    : [...touchedLanguages, language]
}

function removeTouchedLanguage(
  touchedLanguages: SupportedLanguage[],
  language: SupportedLanguage
): SupportedLanguage[] {
  return touchedLanguages.filter(item => item !== language)
}

function getDefaultLanguage(languages: SupportedLanguage[]): SupportedLanguage {
  return languages[0] ?? DEFAULT_SUBMISSION_LANGUAGE
}

/**
 * Manages per-language editor drafts with starter-code fallback and local persistence.
 */
export function useLanguageDrafts(options: {
  storageKey?: string
  legacyCodeStorageKey?: string
  languages?: SupportedLanguage[]
  starterCodeByLanguage?: StarterCodeByLanguage | null
}) {
  const { storageKey, legacyCodeStorageKey, languages, starterCodeByLanguage } =
    options
  const resolvedLanguages = useMemo(
    () => resolveLanguages(languages, starterCodeByLanguage),
    [languages, starterCodeByLanguage]
  )
  const defaultLanguage = useMemo(
    () => getDefaultLanguage(resolvedLanguages),
    [resolvedLanguages]
  )

  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage>(defaultLanguage)
  const [drafts, setDrafts] = useState<LanguageDraftMap>(() =>
    createInitialLanguageDrafts(resolvedLanguages, starterCodeByLanguage)
  )
  const [touchedLanguages, setTouchedLanguages] = useState<SupportedLanguage[]>(
    []
  )

  useEffect(() => {
    const baseDrafts = createInitialLanguageDrafts(
      resolvedLanguages,
      starterCodeByLanguage
    )

    if (legacyCodeStorageKey) {
      window.localStorage.removeItem(legacyCodeStorageKey)
    }

    if (!storageKey) {
      setSelectedLanguage(defaultLanguage)
      setDrafts(baseDrafts)
      setTouchedLanguages([])
      return
    }

    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredEditorState>

        if (parsed.version === STORAGE_VERSION) {
          const nextLanguage = isKnownLanguage(
            parsed.selectedLanguage,
            resolvedLanguages
          )
            ? parsed.selectedLanguage
            : defaultLanguage
          const nextTouchedLanguages = normalizeTouchedLanguages(
            parsed.touchedLanguages,
            resolvedLanguages
          )

          setSelectedLanguage(nextLanguage)
          setDrafts(
            mergeStoredLanguageDrafts({
              languages: resolvedLanguages,
              starterCodeByLanguage,
              storedDrafts: parsed.drafts,
              touchedLanguages: nextTouchedLanguages,
            })
          )
          setTouchedLanguages(nextTouchedLanguages)
          return
        }

        window.localStorage.removeItem(storageKey)
      }
    } catch (error) {
      console.warn('Failed to restore multi-language editor state:', error)
      window.localStorage.removeItem(storageKey)
    }

    setSelectedLanguage(defaultLanguage)
    setDrafts(baseDrafts)
    setTouchedLanguages([])
  }, [
    defaultLanguage,
    legacyCodeStorageKey,
    resolvedLanguages,
    starterCodeByLanguage,
    storageKey,
  ])

  useEffect(() => {
    if (!storageKey) {
      return
    }

    try {
      const payload: StoredEditorState = {
        version: STORAGE_VERSION,
        selectedLanguage,
        drafts,
        touchedLanguages,
      }
      window.localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch (error) {
      console.warn('Failed to persist multi-language editor state:', error)
    }
  }, [drafts, selectedLanguage, storageKey, touchedLanguages])

  const code = useMemo(
    () =>
      getCodeForLanguage({
        language: selectedLanguage,
        drafts,
        starterCodeByLanguage,
      }),
    [drafts, selectedLanguage, starterCodeByLanguage]
  )

  const handleCodeChange = useCallback(
    (nextCode: string) => {
      setDrafts(prevDrafts =>
        updateLanguageDraft(prevDrafts, selectedLanguage, nextCode)
      )
      setTouchedLanguages(prevTouchedLanguages =>
        addTouchedLanguage(prevTouchedLanguages, selectedLanguage)
      )
    },
    [selectedLanguage]
  )

  const handleLanguageChange = useCallback(
    (language: SupportedLanguage) => {
      setSelectedLanguage(
        resolvedLanguages.includes(language) ? language : defaultLanguage
      )
    },
    [defaultLanguage, resolvedLanguages]
  )

  const resetCurrentLanguage = useCallback(() => {
    const fallbackCode = starterCodeByLanguage?.[selectedLanguage] ?? ''
    setDrafts(prevDrafts =>
      updateLanguageDraft(prevDrafts, selectedLanguage, fallbackCode)
    )
    setTouchedLanguages(prevTouchedLanguages =>
      removeTouchedLanguage(prevTouchedLanguages, selectedLanguage)
    )
  }, [selectedLanguage, starterCodeByLanguage])

  const restoreDraft = useCallback(
    (language: SupportedLanguage, nextCode: string) => {
      const nextLanguage = resolvedLanguages.includes(language)
        ? language
        : defaultLanguage
      setSelectedLanguage(nextLanguage)
      setDrafts(prevDrafts =>
        updateLanguageDraft(prevDrafts, nextLanguage, nextCode)
      )
      setTouchedLanguages(prevTouchedLanguages =>
        addTouchedLanguage(prevTouchedLanguages, nextLanguage)
      )
    },
    [defaultLanguage, resolvedLanguages]
  )

  return {
    code,
    drafts,
    selectedLanguage,
    setSelectedLanguage: handleLanguageChange,
    onCodeChange: handleCodeChange,
    onResetCurrentLanguage: resetCurrentLanguage,
    restoreDraft,
  }
}
