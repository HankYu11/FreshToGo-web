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
      <Link to="/easywallet" className="demo-card demo-hub-item">
        <span className="demo-hub-icon">🚇</span>
        <span>
          <b>悠遊付 webview 版</b>
          <span className="demo-muted">選下車站、看站旁的鮮款包、預約拿取貨碼（付款為模擬）</span>
        </span>
        <span className="demo-hub-go">›</span>
      </Link>
      <Link to="/merchant" className="demo-card demo-hub-item">
        <span className="demo-hub-icon">🏪</span>
        <span>
          <b>店家後台</b>
          <span className="demo-muted">用店家帳號登入，上架今天的鮮款包到 dev</span>
        </span>
        <span className="demo-hub-go">›</span>
      </Link>
      <p className="demo-foot">這些功能只在測試環境（dev）顯示，不會出現在正式網站。</p>
    </div>
  )
}
