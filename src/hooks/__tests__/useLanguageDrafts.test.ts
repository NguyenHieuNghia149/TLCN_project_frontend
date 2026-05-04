// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useLanguageDrafts } from '@/hooks/useLanguageDrafts'

const activeLanguages = ['cpp', 'java', 'python', 'javascript']
const starterCodeByLanguage = {
  cpp: 'cpp starter',
  java: 'java starter',
  python: 'python starter',
  javascript: 'js starter',
}

const starterCodeByLegacyLanguages = {
  cpp: 'cpp starter',
  java: 'java starter',
  python: 'python starter',
}

const legacyLanguages = ['cpp', 'java', 'python']

describe('useLanguageDrafts', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('initializes drafts from the active language catalog instead of a fixed list', () => {
    const { result } = renderHook(() =>
      useLanguageDrafts({
        storageKey: 'editor-state',
        languages: activeLanguages,
        starterCodeByLanguage,
      })
    )

    expect(result.current.selectedLanguage).toBe('cpp')
    expect(result.current.code).toBe('cpp starter')

    act(() => {
      result.current.setSelectedLanguage('javascript')
    })

    expect(result.current.code).toBe('js starter')
  })

  it('clears legacy stored draft payloads without migrating them', () => {
    window.localStorage.setItem(
      'editor-state',
      JSON.stringify({
        selectedLanguage: 'java',
        drafts: { java: 'legacy java draft' },
        touchedLanguages: ['java'],
      })
    )

    const { result } = renderHook(() =>
      useLanguageDrafts({
        storageKey: 'editor-state',
        languages: legacyLanguages,
        starterCodeByLanguage: starterCodeByLegacyLanguages,
      })
    )

    expect(result.current.selectedLanguage).toBe('cpp')
    expect(result.current.code).toBe('cpp starter')
    expect(result.current.drafts).toEqual({
      cpp: 'cpp starter',
      java: 'java starter',
      python: 'python starter',
    })

    expect(
      JSON.parse(window.localStorage.getItem('editor-state') || '{}')
    ).toMatchObject({
      version: 2,
      selectedLanguage: 'cpp',
    })
  })
})
