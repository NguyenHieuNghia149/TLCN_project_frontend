import { describe, expect, it } from 'vitest'

import {
  createInitialLanguageDrafts,
  getCodeForLanguage,
  getLanguageLabel,
  getLanguageValueFromLabel,
  mergeStoredLanguageDrafts,
  updateLanguageDraft,
} from '@/utils/starterCode'

describe('starterCode helpers', () => {
  it('supports exactly cpp, java, and python labels', () => {
    expect(getLanguageLabel('cpp')).toBe('C++')
    expect(getLanguageLabel('java')).toBe('Java')
    expect(getLanguageLabel('python')).toBe('Python')
  })

  it('maps UI labels to backend language values', () => {
    expect(getLanguageValueFromLabel('C++')).toBe('cpp')
    expect(getLanguageValueFromLabel('Java')).toBe('java')
    expect(getLanguageValueFromLabel('Python')).toBe('python')
  })

  it('creates initial drafts from backend starter code', () => {
    const drafts = createInitialLanguageDrafts({
      cpp: 'cpp starter',
      java: 'java starter',
      python: 'python starter',
    })

    expect(drafts).toEqual({
      cpp: 'cpp starter',
      java: 'java starter',
      python: 'python starter',
    })
  })

  it('returns starter code when no user draft exists for a language', () => {
    const starterCodeByLanguage = {
      cpp: 'cpp starter',
      java: 'java starter',
      python: 'python starter',
    }

    expect(
      getCodeForLanguage({
        language: 'java',
        drafts: {},
        starterCodeByLanguage,
      })
    ).toBe('java starter')
  })

  it('preserves user drafts when switching languages', () => {
    const starterCodeByLanguage = {
      cpp: 'cpp starter',
      java: 'java starter',
      python: 'python starter',
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
        language: 'python',
        drafts,
        starterCodeByLanguage,
      })
    ).toBe('python starter')
  })

  it('prefers starter code over legacy bootstrap-empty drafts', () => {
    const merged = mergeStoredLanguageDrafts({
      starterCodeByLanguage: {
        cpp: 'cpp starter',
        java: 'java starter',
        python: 'python starter',
      },
      storedDrafts: {
        cpp: '',
        java: '',
        python: '',
      },
    })

    expect(merged).toEqual({
      cpp: 'cpp starter',
      java: 'java starter',
      python: 'python starter',
    })
  })

  it('preserves intentionally cleared drafts for touched languages', () => {
    const merged = mergeStoredLanguageDrafts({
      starterCodeByLanguage: {
        cpp: 'cpp starter',
        java: 'java starter',
        python: 'python starter',
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
    })
  })
})
