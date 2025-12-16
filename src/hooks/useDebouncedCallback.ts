import { useRef, useEffect, useCallback } from 'react'

type Timer = ReturnType<typeof setTimeout> | null

type DebounceOptions = {
  onStart?: () => void
  onSuccess?: () => void
  onError?: (err: unknown) => void
}

/**
 * A lightweight debounced callback hook.
 * Returns a stable callback that delays invoking `fn` until `wait` ms have passed since the last call.
 * Supports optional lifecycle callbacks: onStart/onSuccess/onError.
 */
export default function useDebouncedCallback<T extends unknown[]>(
  fn: (...args: T) => void | Promise<void>,
  wait = 2000,
  options?: DebounceOptions
) {
  const timer = useRef<Timer>(null)
  const lastArgs = useRef<T | null>(null)
  const savedFn = useRef(fn)

  useEffect(() => {
    savedFn.current = fn
  }, [fn])

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [])

  const callback = useCallback(
    (...args: T) => {
      lastArgs.current = args
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        timer.current = null
        const a = lastArgs.current
        lastArgs.current = null
        if (!a) return
        try {
          if (options?.onStart) options.onStart()
          const res = savedFn.current(...a)
          if (res instanceof Promise) await res
          if (options?.onSuccess) options.onSuccess()
        } catch (err) {
          if (options?.onError) options.onError(err)
        }
      }, wait)
    },
    [wait, options]
  )

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    lastArgs.current = null
  }, [])

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    if (lastArgs.current) {
      const a = lastArgs.current
      lastArgs.current = null
      try {
        if (options?.onStart) options.onStart()
        const res = savedFn.current(...a)
        if (res instanceof Promise) await res
        if (options?.onSuccess) options.onSuccess()
      } catch (err) {
        if (options?.onError) options.onError(err)
      }
    }
  }, [options])

  return { callback, cancel, flush }
}
