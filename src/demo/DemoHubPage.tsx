import { Link } from 'react-router-dom'
import './demo.css'

export default function DemoHubPage() {
  return (
    <div className="demo-page">
      <header className="demo-bar">
        <Link to="/" className="demo-back">‹ 首頁</Link>
        <span className="demo-title">測試功能</span>
        <span />
      </header>
      <Link to="/demo/ai-pack" className="demo-card demo-hub-item">
        <span className="demo-hub-icon">📦</span>
        <span>
          <b>AI 打包師</b>
          <span className="demo-muted">拍一張剩下的商品，AI 建議包數、單價與打包單</span>
        </span>
        <span className="demo-hub-go">›</span>
      </Link>
      <p className="demo-foot">這些功能只在測試環境（dev）顯示，不會出現在正式網站。</p>
    </div>
  )
}
