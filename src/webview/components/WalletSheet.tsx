import { useEffect, useRef, useState } from 'react'
import { formatPrice } from '../format'
import { CheckIcon, WalletIcon } from './icons'

/**
 * The wallet's own payment step, as the proposal describes it: the member authorises 鮮款款
 * once, and from then on pays inside the wallet with no card to bind.
 *
 * A MOCK-UP, and built to stay one. It asks for nothing — no card number, no PIN, no password,
 * no field of any kind — moves no money, and reaches no payment service. It does not borrow the
 * wallet's logo or livery either: it names the payment method the way the proposal does and
 * carries 模擬 above the fold throughout, so nobody can mistake it for the real sheet or for a
 * working integration.
 *
 * What it is for: 悠遊卡's own engineers need to see where the handshake would sit in the flow —
 * one authorisation, then a confirmation per order — and that is a thing you show, not describe.
 */

const AUTHORISED_KEY = 'freshtogo.ew.walletAuthorised'

function readAuthorised() {
  try {
    return localStorage.getItem(AUTHORISED_KEY) === '1'
  } catch {
    return false
  }
}

function writeAuthorised() {
  try {
    localStorage.setItem(AUTHORISED_KEY, '1')
  } catch {
    // Nothing to do; the member is simply asked again.
  }
}

type Stage = 'authorise' | 'confirm' | 'working' | 'done'

export default function WalletSheet({
  amount,
  storeName,
  packName,
  onPaid,
  onCancel,
}: {
  amount: number
  storeName: string
  packName: string
  /** Called once the simulated payment lands; the caller then creates the reservation. */
  onPaid: () => void
  onCancel: () => void
}) {
  const [stage, setStage] = useState<Stage>(() => (readAuthorised() ? 'confirm' : 'authorise'))
  const timers = useRef<number[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Focus moves into the sheet, so a screen reader and a keyboard both land where the
    // decision is rather than back at the top of the page behind it, and returns to whatever
    // opened it on the way out.
    const opener = document.activeElement
    panelRef.current?.focus()
    const captured = timers
    return () => {
      captured.current.forEach(window.clearTimeout)
      captured.current = []
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [])

  function authorise() {
    writeAuthorised()
    setStage('confirm')
  }

  function pay() {
    setStage('working')
    // A beat, so the step reads as a handshake with something rather than an instant jump.
    timers.current.push(
      window.setTimeout(() => {
        setStage('done')
        timers.current.push(window.setTimeout(onPaid, 700))
      }, 900),
    )
  }

  return (
    <div className="ew-sheet-scrim" role="presentation" onClick={stage === 'authorise' || stage === 'confirm' ? onCancel : undefined}>
      <div
        ref={panelRef}
        className="ew-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="悠遊付付款（模擬）"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          // Escape is the keyboard's version of tapping the scrim, so it cancels where the
          // scrim cancels and is ignored once the payment is on its way.
          if (event.key === 'Escape' && (stage === 'authorise' || stage === 'confirm')) onCancel()
        }}
      >
        <div className="ew-sheet-grip" aria-hidden="true" />

        <div className="ew-sheet-brand">
          <span className="ew-sheet-mark" aria-hidden="true">
            <WalletIcon size={20} />
          </span>
          <span className="ew-sheet-brandname">悠遊付</span>
          <span className="ew-sheet-sim">模擬</span>
        </div>

        {stage === 'authorise' && (
          <>
            <h2 className="ew-sheet-title">鮮款款想使用你的悠遊付付款</h2>
            <ul className="ew-sheet-list">
              <li>
                <CheckIcon size={18} />
                以你的悠遊付帳戶支付鮮款包款項
              </li>
              <li>
                <CheckIcon size={18} />
                取得你的會員身分，不需另外註冊鮮款款
              </li>
              <li>
                <CheckIcon size={18} />
                不需綁定信用卡，也不會取得你的卡號
              </li>
            </ul>
            <p className="ew-sheet-note">只需同意一次，之後每筆訂單仍會逐筆確認金額。</p>
            <button type="button" className="ew-button" onClick={authorise}>
              同意並繼續
            </button>
            <button type="button" className="ew-button ew-button-plain" onClick={onCancel}>
              取消
            </button>
          </>
        )}

        {stage === 'confirm' && (
          <>
            <h2 className="ew-sheet-title">確認付款</h2>
            <p className="ew-sheet-amount">{formatPrice(amount)}</p>
            <div className="ew-sheet-rows">
              <div className="ew-sheet-row">
                <span>付款對象</span>
                <span className="ew-sheet-rowvalue">{storeName}</span>
              </div>
              <div className="ew-sheet-row">
                <span>品項</span>
                <span className="ew-sheet-rowvalue">{packName}</span>
              </div>
              <div className="ew-sheet-row">
                <span>付款方式</span>
                <span className="ew-sheet-rowvalue">悠遊付帳戶</span>
              </div>
            </div>
            <p className="ew-sheet-note">
              這是提案用的模擬畫面：按下確認不會向任何帳戶請款，也不會連到任何金流服務。
            </p>
            <button type="button" className="ew-button" onClick={pay}>
              確認付款・{formatPrice(amount)}
            </button>
            <button type="button" className="ew-button ew-button-plain" onClick={onCancel}>
              取消
            </button>
          </>
        )}

        {stage === 'working' && (
          <div className="ew-sheet-state" role="status">
            <div className="ew-spinner" />
            <p className="ew-sheet-statetext">處理中…</p>
          </div>
        )}

        {stage === 'done' && (
          <div className="ew-sheet-state" role="status">
            <span className="ew-sheet-tick">
              <CheckIcon size={34} />
            </span>
            <p className="ew-sheet-statetext">付款完成（模擬）</p>
          </div>
        )}
      </div>
    </div>
  )
}
