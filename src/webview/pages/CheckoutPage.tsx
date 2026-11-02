import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiErrorMessage, ApiError } from '../../api/client'
import { getBox, isReservable } from '../../api/boxes'
import { createReservation } from '../../api/reservations'
import { withSession } from '../../api/session'
import Screen from '../components/Screen'
import SimulationNote from '../components/SimulationNote'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { WalletIcon } from '../components/icons'
import { formatPickupWindow, formatPrice } from '../format'
import { useAsync } from '../useAsync'

/** What the backend refuses a reservation for, said in the customer's terms. */
const RESERVE_ERRORS: Record<string, string> = {
  BOX_SOLD_OUT: '這一包剛剛被預約完了，回上一頁看看其他款。',
  BOX_NOT_AVAILABLE: '這一包目前不開放預約，回上一頁看看其他款。',
  OUTSIDE_SALE_WINDOW: '這一包還不在開賣時段內，請稍後再試。',
  USER_BLOCKED: '這個帳號目前被暫停預約（未到店取貨次數過多）。',
  ALREADY_RESERVED: '這一包你已經預約過了。',
}

function reserveErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.isOffline) {
    return '沒有網路連線，預約沒有送出。請確認網路後再試一次。'
  }
  const code = error instanceof ApiError ? error.code : undefined
  if (code && RESERVE_ERRORS[code]) return RESERVE_ERRORS[code]
  return apiErrorMessage(error) ?? '預約沒有成功，請稍後再試一次。'
}

/**
 * Step four: confirm and pay.
 *
 * The payment block is a stand-in and says so. There is no wallet payment integration yet —
 * the reservation is created against the real dev backend, and the money side is the part
 * this demo is asking to talk about rather than claiming to have finished.
 */
export default function CheckoutPage() {
  const navigate = useNavigate()
  const { boxId = '' } = useParams()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<unknown>(null)

  const { data: box, error, loading, reload } = useAsync((signal) => getBox(boxId, signal), [boxId])

  function goBack() {
    navigate(`/easywallet/box/${boxId}`)
  }

  async function confirm() {
    if (submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const reservation = await withSession(() => createReservation(boxId))
      // replace: the ticket is the end of the flow, so Back from it returns to the listing
      // rather than re-entering checkout and risking a second reservation.
      navigate(`/easywallet/ticket/${reservation.id}`, { replace: true })
    } catch (reserveError) {
      setSubmitError(reserveError)
      setSubmitting(false)
    }
  }

  if (loading && !box) {
    return (
      <Screen title="確認預約" onBack={goBack}>
        <LoadingState />
      </Screen>
    )
  }

  if (error && !box) {
    return (
      <Screen title="確認預約" onBack={goBack}>
        <ErrorState error={error} onRetry={reload} />
      </Screen>
    )
  }

  if (!box) {
    return (
      <Screen title="確認預約" onBack={goBack}>
        <EmptyState title="找不到這個鮮款包">
          <button type="button" className="ew-button" onClick={goBack}>
            回上一頁
          </button>
        </EmptyState>
      </Screen>
    )
  }

  const available = isReservable(box.status)
  const pickup = formatPickupWindow(box.pickupTimeStart, box.pickupTimeEnd)

  return (
    <Screen
      title="確認預約"
      onBack={goBack}
      footer={
        <button
          type="button"
          className="ew-button"
          onClick={confirm}
          disabled={submitting || !available}
        >
          {submitting ? '預約中…' : `確認預約・${formatPrice(box.discountedPrice)}`}
        </button>
      }
    >
      <section className="ew-panel" style={{ marginTop: 0 }}>
        <p className="ew-panel-title">訂單內容</p>
        <div className="ew-summaryrow">
          <span>
            {box.storeName}
            <span className="ew-note" style={{ marginTop: 2 }}>
              {box.name}
            </span>
          </span>
          <span className="ew-inforow-strong">{formatPrice(box.discountedPrice)}</span>
        </div>
        <div className="ew-summaryrow">
          <span className="ew-inforow-label" style={{ flex: 'none' }}>
            取貨時段
          </span>
          <span>今天 {pickup || '請洽店家'}</span>
        </div>
        <div className="ew-summaryrow ew-summaryrow-total">
          <span>應付金額</span>
          <span className="ew-price">{formatPrice(box.discountedPrice)}</span>
        </div>
      </section>

      <section className="ew-section">
        <p className="ew-panel-title">付款方式</p>
        <div className="ew-paymethod" style={{ marginTop: 10 }}>
          <span className="ew-paymethod-mark">
            <WalletIcon />
          </span>
          <span className="ew-paymethod-main">
            <span className="ew-paymethod-name">由悠遊付完成付款</span>
            <span className="ew-paymethod-sub">
              正式版將由宿主 App 的付款流程扣款，本版本不會發生任何金流。
            </span>
          </span>
        </div>
        <div style={{ marginTop: 12 }}>
          <SimulationNote>
            付款為模擬步驟：按下確認只會在開發環境建立一筆預約並產生取貨碼，不會向任何帳戶請款。
          </SimulationNote>
        </div>
      </section>

      {!available && (
        <p className="ew-note" style={{ color: 'var(--ew-danger)' }}>
          這一包目前無法預約，請回上一頁看看其他款。
        </p>
      )}

      {submitError !== null && (
        <p
          className="ew-note"
          role="alert"
          style={{ color: 'var(--ew-danger)', fontWeight: 600 }}
        >
          {reserveErrorMessage(submitError)}
        </p>
      )}
    </Screen>
  )
}
