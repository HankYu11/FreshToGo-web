import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { isReservable } from '../../api'
import { loadBox, reserve } from '../catalog'
import Screen from '../components/Screen'
import SimulationNote from '../components/SimulationNote'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { WalletIcon } from '../components/icons'
import { errorCode, isMissing, isTerminalReserveError, reserveErrorMessage } from '../errors'
import { formatPickupWindow, formatPrice } from '../format'
import { useAsync } from '../useAsync'
import { useWebviewNavigation } from '../useWebviewNavigation'

/**
 * Step four: confirm and pay.
 *
 * The payment block is a stand-in and says so. There is no wallet payment integration yet —
 * the reservation is created against the real dev backend, and the money side is the part
 * this demo is asking to talk about rather than claiming to have finished.
 */
export default function CheckoutPage() {
  const { boxId = '' } = useParams()
  const { goBack, replaceTo } = useWebviewNavigation()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<unknown>(null)
  // State alone cannot stop two taps landing in the same frame; a ref closes that window,
  // which matters more here than anywhere else in the flow.
  const inFlight = useRef(false)

  const { data: box, error, loading, reload } = useAsync((signal) => loadBox(boxId, signal), [boxId])

  async function confirm() {
    if (inFlight.current) return
    inFlight.current = true
    setSubmitting(true)
    setSubmitError(null)
    try {
      const reservation = await reserve(boxId)
      // replace: the ticket ends the flow, so Back from it returns to the listing instead of
      // re-entering checkout and risking a second reservation. The ticket is told it came from
      // here, because that decides how far back "回到列表" has to go.
      replaceTo(`/easywallet/ticket/${reservation.id}`, { from: 'checkout' })
    } catch (reserveError) {
      setSubmitError(reserveError)
      setSubmitting(false)
      inFlight.current = false
    }
  }

  const backToDetail = () => goBack(`/easywallet/box/${boxId}`)

  if (loading && !box) {
    return (
      <Screen title="確認預約" onBack={backToDetail}>
        <LoadingState />
      </Screen>
    )
  }

  if (!box) {
    if (error && !isMissing(error)) {
      return (
        <Screen title="確認預約" onBack={backToDetail}>
          <ErrorState error={error} onRetry={reload} />
        </Screen>
      )
    }
    return (
      <Screen title="確認預約" onBack={backToDetail}>
        <EmptyState
          title={errorCode(error) === 'BOX_NOT_ELIGIBLE' ? '這一包無法預約' : '找不到這個鮮款包'}
          body={
            errorCode(error) === 'BOX_NOT_ELIGIBLE'
              ? '這一包只開放給特定顧客，這個帳號不符合資格。'
              : '它可能已經下架了，回上一頁看看其他款。'
          }
        >
          <button type="button" className="ew-button" onClick={backToDetail}>
            回上一頁
          </button>
        </EmptyState>
      </Screen>
    )
  }

  const blocked = !isReservable(box.status) || isTerminalReserveError(submitError)

  return (
    <Screen
      title="確認預約"
      onBack={backToDetail}
      footer={
        <button
          type="button"
          className="ew-button"
          onClick={confirm}
          disabled={submitting || blocked}
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
          <span>今天 {formatPickupWindow(box.pickupTimeStart, box.pickupTimeEnd) || '請洽店家'}</span>
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

      {!isReservable(box.status) && (
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
