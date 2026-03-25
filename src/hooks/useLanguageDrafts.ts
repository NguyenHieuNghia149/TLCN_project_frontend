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
  selectedLanguage?: SupportedLanguage
  drafts?: Partial<Record<SupportedLanguage, string>>
  touchedLanguages?: SupportedLanguage[]
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['cpp', 'java', 'python']

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return value === 'cpp' || value === 'java' || value === 'python'
}

function normalizeTouchedLanguages(value: unknown): SupportedLanguage[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isSupportedLanguage)
}

function inferTouchedLanguages(
  drafts?: Partial<Record<SupportedLanguage, string>>
): SupportedLanguage[] {
  return SUPPORTED_LANGUAGES.filter(language => {
    const draft = drafts?.[language]
    return typeof draft === 'string' && draft.length > 0
  })
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

/**
 * Manages per-language editor drafts with starter-code fallback and local persistence.
 */
export function useLanguageDrafts(options: {
  storageKey?: string
  legacyCodeStorageKey?: string
  starterCodeByLanguage?: StarterCodeByLanguage | null
}) {
  const { storageKey, legacyCodeStorageKey, starterCodeByLanguage } = options
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    DEFAULT_SUBMISSION_LANGUAGE
  )
  const [drafts, setDrafts] = useState<LanguageDraftMap>(() =>
    createInitialLanguageDrafts(starterCodeByLanguage)
  )
  const [touchedLanguages, setTouchedLanguages] = useState<SupportedLanguage[]>(
    []
  )

  useEffect(() => {
    const baseDrafts = createInitialLanguageDrafts(starterCodeByLanguage)

    if (!storageKey) {
      setSelectedLanguage(DEFAULT_SUBMISSION_LANGUAGE)
      setDrafts(baseDrafts)
      setTouchedLanguages([])
      return
    }

    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as StoredEditorState
        const nextLanguage = isSupportedLanguage(parsed.selectedLanguage)
          ? parsed.selectedLanguage
          : DEFAULT_SUBMISSION_LANGUAGE
        const nextTouchedLanguages = normalizeTouchedLanguages(
          parsed.touchedLanguages
        )
        const resolvedTouchedLanguages =
          nextTouchedLanguages.length > 0
            ? nextTouchedLanguages
            : inferTouchedLanguages(parsed.drafts)

        setSelectedLanguage(nextLanguage)
        setDrafts(
          mergeStoredLanguageDrafts({
            starterCodeByLanguage,
            storedDrafts: parsed.drafts,
            touchedLanguages: resolvedTouchedLanguages,
          })
        )
        setTouchedLanguages(resolvedTouchedLanguages)
        return
      }
    } catch (error) {
      console.warn('Failed to restore multi-language editor state:', error)
    }

    const legacyDrafts = { ...baseDrafts }
    const legacyTouchedLanguages: SupportedLanguage[] = []

    if (legacyCodeStorageKey) {
      try {
        const legacyCode = window.localStorage.getItem(legacyCodeStorageKey)
        if (legacyCode) {
          legacyDrafts[DEFAULT_SUBMISSION_LANGUAGE] = legacyCode
          legacyTouchedLanguages.push(DEFAULT_SUBMISSION_LANGUAGE)
        }
      } catch (error) {
        console.warn('Failed to restore legacy editor code:', error)
      }
    }

    setSelectedLanguage(DEFAULT_SUBMISSION_LANGUAGE)
    setDrafts(legacyDrafts)
    setTouchedLanguages(legacyTouchedLanguages)
  }, [legacyCodeStorageKey, starterCodeByLanguage, storageKey])

  useEffect(() => {
    if (!storageKey) {
      return
    }

    try {
      const payload: StoredEditorState = {
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

  const handleLanguageChange = useCallback((language: SupportedLanguage) => {
    setSelectedLanguage(language)
  }, [])

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
      setSelectedLanguage(language)
      setDrafts(prevDrafts =>
        updateLanguageDraft(prevDrafts, language, nextCode)
      )
      setTouchedLanguages(prevTouchedLanguages =>
        addTouchedLanguage(prevTouchedLanguages, language)
      )
    },
    []
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
