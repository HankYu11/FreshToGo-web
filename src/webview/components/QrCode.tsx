import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

/**
 * The redemption code as a QR, matching what the app's `QrCodeView` encodes: the bare
 * 6-character code, which is what the merchant app's scanner reads.
 *
 * Drawn to a canvas rather than an <img> data URL so nothing depends on a data: URI surviving
 * whatever CSP the host webview applies. If it fails to draw, the code underneath is still the
 * thing the merchant can type in, so the QR is treated as an enhancement and never as the
 * only way through.
 */
export default function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !value) return

    let cancelled = false
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      color: { dark: '#1d2a29', light: '#ffffff' },
    })
      .then(() => {
        if (!cancelled) setFailed(false)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [value, size])

  if (failed) return null

  return (
    <div className="ew-ticket-qr">
      <canvas ref={canvasRef} role="img" aria-label={`取貨碼 ${value} 的 QR Code`} />
    </div>
  )
}
