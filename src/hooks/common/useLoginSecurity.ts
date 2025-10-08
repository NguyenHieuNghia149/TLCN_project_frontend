import { useState, useCallback, useRef } from 'react'

interface LoginAttempt {
  timestamp: number
  email: string
}

interface UseLoginSecurityOptions {
  maxAttempts?: number
  lockoutDuration?: number // in milliseconds
  maxAttemptsPerEmail?: number
}

interface UseLoginSecurityReturn {
  isLocked: boolean
  remainingTime: number
  attemptLogin: (email: string) => boolean
  resetAttempts: () => void
  getAttemptsCount: (email: string) => number
}

/**
 * Custom hook for login security features
 * - Rate limiting to prevent brute force attacks
 * - Account lockout after multiple failed attempts
 * - Per-email attempt tracking
 */
export const useLoginSecurity = (
  options: UseLoginSecurityOptions = {}
): UseLoginSecurityReturn => {
  const {
    maxAttempts = 5,
    lockoutDuration = 15 * 60 * 1000, // 15 minutes
    maxAttemptsPerEmail = 3,
  } = options

  const [attempts, setAttempts] = useState<LoginAttempt[]>([])
  const [isLocked, setIsLocked] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)
  const lockoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up old attempts (older than lockout duration)
  const cleanupOldAttempts = useCallback(() => {
    const now = Date.now()
    setAttempts(prev =>
      prev.filter(attempt => now - attempt.timestamp < lockoutDuration)
    )
  }, [lockoutDuration])

  // Get attempts count for specific email
  const getAttemptsCount = useCallback(
    (email: string): number => {
      cleanupOldAttempts()
      return attempts.filter(attempt => attempt.email === email).length
    },
    [attempts, cleanupOldAttempts]
  )

  // Check if account is locked
  const checkLockout = useCallback(() => {
    const now = Date.now()
    const recentAttempts = attempts.filter(
      attempt => now - attempt.timestamp < lockoutDuration
    )

    if (recentAttempts.length >= maxAttempts) {
      setIsLocked(true)
      const oldestAttempt = Math.min(...recentAttempts.map(a => a.timestamp))
      const timeRemaining = lockoutDuration - (now - oldestAttempt)
      setRemainingTime(Math.max(0, timeRemaining))

      // Set timeout to unlock
      if (lockoutTimeoutRef.current) {
        clearTimeout(lockoutTimeoutRef.current)
      }
      lockoutTimeoutRef.current = setTimeout(() => {
        setIsLocked(false)
        setRemainingTime(0)
      }, timeRemaining)

      return true
    }
    return false
  }, [attempts, maxAttempts, lockoutDuration])

  // Attempt login with security checks
  const attemptLogin = useCallback(
    (email: string): boolean => {
      cleanupOldAttempts()

      // Check if globally locked
      if (isLocked) {
        return false
      }

      // Check per-email attempts
      const emailAttempts = getAttemptsCount(email)
      if (emailAttempts >= maxAttemptsPerEmail) {
        return false
      }

      // Add new attempt
      const newAttempt: LoginAttempt = {
        timestamp: Date.now(),
        email: email.toLowerCase(),
      }

      setAttempts(prev => [...prev, newAttempt])

      // Check if this triggers a lockout
      setTimeout(() => {
        checkLockout()
      }, 100)

      return true
    },
    [
      isLocked,
      getAttemptsCount,
      maxAttemptsPerEmail,
      cleanupOldAttempts,
      checkLockout,
    ]
  )

  // Reset all attempts
  const resetAttempts = useCallback(() => {
    setAttempts([])
    setIsLocked(false)
    setRemainingTime(0)
    if (lockoutTimeoutRef.current) {
      clearTimeout(lockoutTimeoutRef.current)
      lockoutTimeoutRef.current = null
    }
  }, [])

  return {
    isLocked,
    remainingTime,
    attemptLogin,
    resetAttempts,
    getAttemptsCount,
  }
}
