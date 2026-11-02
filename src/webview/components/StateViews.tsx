import type { ReactNode } from 'react'
import { ApiError } from '../../api/client'
import { AlertIcon, BoxIcon, CloudOffIcon } from './icons'

/**
 * The three ways a screen can have nothing to show. A webview that goes white because a
 * request failed is the thing a reviewer notices first, so every fetch in this flow lands
 * in one of these.
 */

export function LoadingState({ label = '載入中…' }: { label?: string }) {
  return (
    <div className="ew-state" role="status" aria-live="polite">
      <div className="ew-spinner" />
      <p className="ew-state-body">{label}</p>
    </div>
  )
}

export function EmptyState({
  title,
  body,
  children,
}: {
  title: string
  body?: string
  children?: ReactNode
}) {
  return (
    <div className="ew-state">
      <BoxIcon className="ew-state-icon" />
      <p className="ew-state-title">{title}</p>
      {body && <p className="ew-state-body">{body}</p>}
      {children && <div className="ew-state-actions">{children}</div>}
    </div>
  )
}

/**
 * Failure, told apart by cause: a request that never left the device reads as a connection
 * problem, everything else as a server problem. Both offer the same way out — try again.
 */
export function ErrorState({
  error,
  onRetry,
  children,
}: {
  error: unknown
  onRetry?: () => void
  children?: ReactNode
}) {
  const offline = error instanceof ApiError ? error.isOffline : false

  return (
    <div className="ew-state" role="alert">
      {offline ? (
        <CloudOffIcon className="ew-state-icon" />
      ) : (
        <AlertIcon className="ew-state-icon" />
      )}
      <p className="ew-state-title">{offline ? '目前沒有網路連線' : '暫時讀不到資料'}</p>
      <p className="ew-state-body">
        {offline
          ? '請確認網路後再試一次，已經載入的內容仍然可以瀏覽。'
          : '伺服器暫時沒有回應，稍後再試一次。'}
      </p>
      <div className="ew-state-actions">
        {onRetry && (
          <button type="button" className="ew-button" onClick={onRetry}>
            重新載入
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
