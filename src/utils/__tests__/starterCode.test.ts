import { describe, expect, it } from 'vitest'

import {
  createInitialLanguageDrafts,
  getCodeForLanguage,
  mergeStoredLanguageDrafts,
  updateLanguageDraft,
} from '@/utils/starterCode'

describe('starterCode helpers', () => {
  const languages = ['cpp', 'java', 'python', 'javascript']

  it('derives draft maps from the runtime language catalog instead of a fixed three-language list', () => {
    const drafts = createInitialLanguageDrafts(languages, {
      cpp: 'cpp starter',
      java: 'java starter',
      python: 'python starter',
      javascript: 'js starter',
    })

    expect(Object.keys(drafts)).toEqual(['cpp', 'java', 'python', 'javascript'])
    expect(drafts.javascript).toBe('js starter')
  })

  it('returns starter code when no user draft exists for a language', () => {
    const starterCodeByLanguage = {
      cpp: 'cpp starter',
      java: 'java starter',
      python: 'python starter',
      javascript: 'js starter',
    }

    expect(
      getCodeForLanguage({
        language: 'javascript',
        drafts: {},
        starterCodeByLanguage,
      })
    ).toBe('js starter')
  })

  it('preserves user drafts when switching languages', () => {
    const starterCodeByLanguage = {
      cpp: 'cpp starter',
      java: 'java starter',
      python: 'python starter',
      javascript: 'js starter',
    }

    const drafts = updateLanguageDraft({}, 'cpp', 'custom cpp solution')

    expect(
      getCodeForLanguage({
        language: 'cpp',
        drafts,
        starterCodeByLanguage,
      })
    ).toBe('custom cpp solution')

    expect(
      getCodeForLanguage({
        language: 'javascript',
        drafts,
        starterCodeByLanguage,
      })
    ).toBe('js starter')
  })

  it('prefers starter code over untouched stored drafts', () => {
    const merged = mergeStoredLanguageDrafts({
      languages,
      starterCodeByLanguage: {
        cpp: 'cpp starter',
        java: 'java starter',
        python: 'python starter',
        javascript: 'js starter',
      },
      storedDrafts: {
        cpp: '',
        java: '',
        python: '',
        javascript: '',
      },
    })

    expect(merged).toEqual({
      cpp: 'cpp starter',
      java: 'java starter',
      python: 'python starter',
      javascript: 'js starter',
    })
  })

  it('preserves intentionally cleared drafts for touched languages', () => {
    const merged = mergeStoredLanguageDrafts({
      languages,
      starterCodeByLanguage: {
        cpp: 'cpp starter',
        java: 'java starter',
        python: 'python starter',
        javascript: 'js starter',
      },
      storedDrafts: {
        cpp: '',
        java: 'custom java',
      },
      touchedLanguages: ['cpp', 'java'],
    })

    expect(merged).toEqual({
      cpp: '',
      java: 'custom java',
      python: 'python starter',
      javascript: 'js starter',
    })
  })
})
