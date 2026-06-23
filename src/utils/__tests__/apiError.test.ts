import { describe, expect, it } from 'vitest'

import { extractApiErrorMessage } from '../apiError'

describe('extractApiErrorMessage', () => {
  it('prefers nested server messages over top-level code-like messages', () => {
    const error = {
      response: {
        data: {
          message: 'USER_NOT_FOUND',
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User with this email does not exist',
          },
        },
      },
    }

    expect(extractApiErrorMessage(error, 'Fallback')).toBe(
      'User with this email does not exist'
    )
  })

  it('extracts validation messages from flattened zod errors', () => {
    const error = {
      response: {
        data: {
          message: 'Validation error',
          errors: {
            fieldErrors: {
              email: ['Invalid email format'],
            },
          },
        },
      },
    }

    expect(extractApiErrorMessage(error, 'Fallback')).toBe(
      'email: Invalid email format'
    )
  })

  it('uses nested detail messages before generic wrapper messages', () => {
    const error = {
      response: {
        data: {
          error: {
            message: 'Validation error',
            details: ['End date must be after start date'],
          },
        },
      },
    }

    expect(extractApiErrorMessage(error, 'Fallback')).toBe(
      'End date must be after start date'
    )
  })
})
