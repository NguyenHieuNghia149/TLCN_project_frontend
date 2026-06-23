type ApiValidationErrors = {
  formErrors?: string[]
  fieldErrors?: Record<string, string[]>
}

type ApiErrorPayload = {
  message?: unknown
  code?: unknown
  error?: {
    message?: unknown
    code?: unknown
    details?: unknown
  }
  errors?: ApiValidationErrors
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function isCodeLikeMessage(value: string | null): boolean {
  return !!value && /^[A-Z0-9_]+$/.test(value.trim())
}

function pickFirstValidationMessage(
  errors?: ApiValidationErrors
): string | null {
  if (!errors) {
    return null
  }

  const firstFormError = errors.formErrors?.find(
    item => typeof item === 'string' && item.trim().length > 0
  )
  if (firstFormError) {
    return firstFormError
  }

  for (const [field, messages] of Object.entries(errors.fieldErrors ?? {})) {
    if (!Array.isArray(messages)) {
      continue
    }

    const firstMessage = messages.find(
      item => typeof item === 'string' && item.trim().length > 0
    )
    if (firstMessage) {
      return `${field}: ${firstMessage}`
    }
  }

  return null
}

function pickDetailMessage(details: unknown): string | null {
  const detailString = asNonEmptyString(details)
  if (detailString) {
    return detailString
  }

  if (Array.isArray(details)) {
    for (const item of details) {
      const itemString = asNonEmptyString(item)
      if (itemString) {
        return itemString
      }

      if (item && typeof item === 'object') {
        const nestedMessage = asNonEmptyString(
          (item as { message?: unknown }).message
        )
        if (nestedMessage) {
          return nestedMessage
        }
      }
    }
  }

  if (details && typeof details === 'object') {
    const message = asNonEmptyString((details as { message?: unknown }).message)
    if (message) {
      return message
    }

    const validationErrors = (details as { errors?: ApiValidationErrors })
      .errors
    const validationMessage = pickFirstValidationMessage(validationErrors)
    if (validationMessage) {
      return validationMessage
    }
  }

  return null
}

export function extractApiErrorMessage(
  error: unknown,
  fallback: string
): string {
  const directString = asNonEmptyString(error)
  if (directString) {
    return directString
  }

  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  ) {
    const payload = (error as { response?: { data?: ApiErrorPayload } })
      .response?.data

    if (payload) {
      const topLevelMessage = asNonEmptyString(payload.message)
      const nestedMessage = asNonEmptyString(payload.error?.message)
      const detailMessage = pickDetailMessage(payload.error?.details)
      const validationMessage = pickFirstValidationMessage(payload.errors)

      if (detailMessage) {
        return detailMessage
      }

      if (validationMessage) {
        return validationMessage
      }

      if (nestedMessage) {
        return nestedMessage
      }

      if (topLevelMessage && !isCodeLikeMessage(topLevelMessage)) {
        return topLevelMessage
      }

      if (topLevelMessage && nestedMessage) {
        return nestedMessage
      }
    }
  }

  if (error instanceof Error) {
    const errorMessage = asNonEmptyString(error.message)
    if (errorMessage) {
      return errorMessage
    }
  }

  return fallback
}
