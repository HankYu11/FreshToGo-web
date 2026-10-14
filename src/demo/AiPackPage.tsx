import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { analyse, toJpegBase64, type PackResult } from './aiPack'
import sampleBakery from './sample-bakery.jpg'
import './demo.css'

type Phase = 'idle' | 'loading' | 'done' | 'error'

export default function AiPackPage() {
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState<PackResult | null>(null)
  const [choice, setChoice] = useState(0)
  const [listed, setListed] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }, [photoUrl])

  const pick = (blob: Blob) => {
    setPhoto(blob)
    setPhotoUrl(URL.createObjectURL(blob))
    setResult(null)
    setPhase('idle')
    setListed(false)
  }

  const useSample = async () => pick(await (await fetch(sampleBakery)).blob())

  const run = async () => {
    if (!photo) return
    setPhase('loading'); setError(''); setListed(false)
    try {
      const r = await analyse(await toJpegBase64(photo), note)
      if (r.items.length === 0) throw new Error('照片中沒有辨識到可以打包的商品，換一張試試。')
      setResult(r); setChoice(r.recommended); setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : '發生錯誤，請再試一次。'); setPhase('error')
    }
  }

  const option = result?.options[choice]

  return (
    <div className="demo-page">
      <header className="demo-bar">
        <Link to="/demo" className="demo-back">‹ Demo</Link>
        <span className="demo-title">AI 打包師</span>
        <span />
      </header>

      <section className="demo-card">
        <h2>收店前，拍一張剩下的商品</h2>
        <p className="demo-muted">AI 會辨識品項、建議包幾包與單價，並產生照著包的打包單。</p>
        {photoUrl
          ? <img className="demo-photo" src={photoUrl} alt="要打包的商品" />
          : <div className="demo-photo demo-photo-empty">尚未選擇照片</div>}
        <input ref={fileInput} type="file" accept="image/*" capture="environment" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = '' }} />
        <div className="demo-row">
          <button className="demo-btn ghost" onClick={() => fileInput.current?.click()}>📷 拍照／選照片</button>
          <button className="demo-btn ghost" onClick={useSample}>用範例圖片</button>
        </div>
        <input className="demo-note" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="補充（選填）：例如「吐司一條原價 85」" maxLength={200} />
        <button className="demo-btn" onClick={run} disabled={!photo || phase === 'loading'}>
          {phase === 'loading' ? 'AI 正在看你的商品…' : '開始分析'}
        </button>
        {phase === 'error' && <p className="demo-error">{error}</p>}
      </section>

      {result && option && (
        <>
          <section className="demo-card">
            <div className="demo-chip">AI 辨識</div>
            <ul className="demo-items">
              {result.items.map((it) => (
                <li key={it.name}><span>{it.name} × {it.count}</span><span className="demo-muted">約 ${it.unitPrice}／個</span></li>
              ))}
            </ul>
            <p className="demo-total">以原價計算，總價值約 <b>${result.totalValue.toLocaleString()}</b></p>
          </section>

          <section className="demo-card">
            <h3>怎麼包比較好？</h3>
            <div className="demo-options">
              {result.options.map((op, i) => (
                <button key={i} className={`demo-option${i === choice ? ' on' : ''}`} onClick={() => { setChoice(i); setListed(false) }}>
                  <span className="demo-option-label">{op.label}{i === result.recommended && <b> ✔ 建議</b>}</span>
                  <span className="demo-option-main">{op.bags} 包 × ${op.price}</span>
                  <span className="demo-muted">每包價值約 ${op.valuePerBag}</span>
                  <span className="demo-option-reason">{op.reason}</span>
                </button>
              ))}
            </div>
            <p className="demo-reco">💡 {result.recommendationReason}</p>
          </section>

          <section className="demo-card">
            <h3>打包單（照著包）</h3>
            {option.packingList.map((bag, i) => (
              <div className="demo-bag" key={i}>
                <span className="demo-bag-no">第 {i + 1} 包</span>
                <span>{bag.map((l) => `${l.name} ×${l.count}`).join('、')}</span>
              </div>
            ))}
            {result.repaired[choice] && <p className="demo-muted">已自動調整打包單，確保每項商品剛好分配完。</p>}
          </section>

          <section className="demo-card demo-preview">
            <h3>上架預覽（消費者看到的）</h3>
            <div className="demo-listing">
              {photoUrl && <img src={photoUrl} alt="" />}
              <div>
                <b>{result.title}</b>
                <p>{result.hint}</p>
                <p className="demo-price">${option.price} <s>${option.valuePerBag}</s> · 剩 {option.bags} 個</p>
              </div>
            </div>
            <button className="demo-btn" onClick={() => setListed(true)}>照著包好了，一鍵上架</button>
            {listed && <p className="demo-ok">✔ 示範模式：已模擬上架 {option.bags} 包「{result.title}」，不會真的上架。</p>}
          </section>
        </>
      )}

      <p className="demo-foot">Demo 功能，只在測試環境顯示。AI 建議僅供參考，正式版將加入店家的售出紀錄。</p>
    </div>
  )
}
