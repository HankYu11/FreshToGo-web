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
    // node-qrcode sizes the canvas bitmap in CSS pixels, so a 200px bitmap shown at 200px CSS
    // is upscaled by the device and the module edges blur. Draw at the device's pixel density
    // and let the stylesheet size it back down — the merchant has to scan this.
    const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3)
    QRCode.toCanvas(canvas, value, {
      width: Math.round(size * ratio),
      margin: 1,
      color: { dark: '#1d2a29', light: '#ffffff' },
    })
      .then(() => {
        if (cancelled) return
        // toCanvas also writes that width to canvas.style, which would lay the QR out at the
        // bitmap's size and overflow the ticket. Put the CSS size back; the bitmap keeps its
        // extra pixels, which is the whole point.
        canvas.style.width = `${size}px`
        canvas.style.height = `${size}px`
        setFailed(false)
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
