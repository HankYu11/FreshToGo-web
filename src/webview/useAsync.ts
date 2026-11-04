import { useCallback, useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  error: unknown
  loading: boolean
}

/**
 * Run a fetch on mount and expose one of three states to render from, plus a retry.
 *
 * The request is aborted when the effect is torn down, so React's StrictMode double-mount in
 * development cannot land two responses on one screen, and leaving a screen mid-request does
 * not set state on an unmounted component.
 */
export function useAsync<T>(
  load: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList,
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true })
  const [attempt, setAttempt] = useState(0)

  // The caller passes a fresh closure every render; `deps` is what decides when to re-run it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps)

  useEffect(() => {
    const controller = new AbortController()
    setState((previous) => ({ ...previous, loading: true, error: null }))

    run(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ data, error: null, loading: false })
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        // An abort surfaces here too on some engines; never show it as a failure.
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({ data: null, error, loading: false })
      },
    )

    return () => controller.abort()
  }, [run, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  return { ...state, reload }
}
