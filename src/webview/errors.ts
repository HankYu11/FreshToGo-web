import { ApiError, apiErrorMessage } from '../api'

/**
 * A request for one listing or reservation that failed because the thing is not there, or not
 * for this caller — as opposed to the server being unwell.
 *
 * Told apart so the screen can say 「找不到這個鮮款包」 instead of 「伺服器暫時沒有回應」 with a
 * retry button that will never work. 400 is in here because a malformed id in the URL is a bad
 * link, not an outage.
 */
export function isMissing(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false
  return error.status === 404 || error.status === 400 || error.status === 403
}

/** Backend `error.code`, when the response carried one. */
export function errorCode(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined
}

/** What a failed reservation should tell the customer, in their terms. */
const RESERVE_ERRORS: Record<string, string> = {
  BOX_SOLD_OUT: '這一包剛剛被預約完了，回上一頁看看其他款。',
  BOX_NOT_AVAILABLE: '這一包目前不開放預約，回上一頁看看其他款。',
  OUTSIDE_SALE_WINDOW: '這一包還不在開賣時段內，請稍後再試。',
  USER_BLOCKED: '這個帳號目前暫停預約（未到店取貨次數過多）。',
  BOX_NOT_ELIGIBLE: '這一包只開放給特定顧客，這個帳號不符合資格。',
  RESERVATION_ALREADY_EXISTS: '你已經預約過這一包了，在取貨券裡可以找到取貨碼。',
}

/**
 * Codes that will not change by trying again — the confirm button stays disabled afterwards
 * rather than inviting a second tap that fails the same way.
 */
const TERMINAL_RESERVE_ERRORS = new Set([
  'BOX_SOLD_OUT',
  'BOX_NOT_AVAILABLE',
  'BOX_NOT_ELIGIBLE',
  'USER_BLOCKED',
  'RESERVATION_ALREADY_EXISTS',
])

export function reserveErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.isOffline) {
    return '沒有網路連線，預約沒有送出。請確認網路後再試一次。'
  }
  const code = errorCode(error)
  if (code && RESERVE_ERRORS[code]) return RESERVE_ERRORS[code]
  return apiErrorMessage(error) ?? '預約沒有成功，請稍後再試一次。'
}

export function isTerminalReserveError(error: unknown): boolean {
  const code = errorCode(error)
  return code !== undefined && TERMINAL_RESERVE_ERRORS.has(code)
}
