import { ensureSession, getImpactStats, getReservationStats, withSession } from '../../api'
import Screen from '../components/Screen'
import SimulationNote from '../components/SimulationNote'
import { LeafIcon, PersonIcon } from '../components/icons'
import { ErrorState, LoadingState } from '../components/StateViews'
import { currentStation } from '../stationPreference'
import { useAsync } from '../useAsync'
import { useWebviewNavigation } from '../useWebviewNavigation'

interface ProfileData {
  displayName: string
  boxesPurchased: number
  storesVisited: number
  completedPickups: number
  platformBoxesSaved: number
}

/**
 * Who the member is and what they have saved.
 *
 * The identity comes from the session the host app would have handed in — the point of the
 * proposal is that there is no account to create, so this screen shows a member who is already
 * signed in and never offers a way to sign in or out.
 */
export default function ProfilePage() {
  const { goTo } = useWebviewNavigation()
  const station = currentStation()

  const { data, error, loading, reload } = useAsync<ProfileData>(async (signal) => {
    const session = await ensureSession()
    const [stats, impact] = await Promise.all([
      withSession(() => getReservationStats(signal)),
      // Public, and not worth failing the screen over.
      getImpactStats().catch(() => null),
    ])
    return {
      displayName: session.displayName || '悠遊付會員',
      boxesPurchased: stats.boxesPurchased,
      storesVisited: stats.storesVisited,
      completedPickups: stats.completedPickups,
      platformBoxesSaved: impact?.boxesSaved ?? 0,
    }
  }, [])

  return (
    <Screen title="我的" tab>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data ? (
        <>
          <div className="ew-memberrow">
            <span className="ew-memberavatar" aria-hidden="true">
              <PersonIcon size={26} />
            </span>
            <span className="ew-memberrow-main">
              <span className="ew-memberrow-name">{data.displayName}</span>
              <span className="ew-memberrow-sub">由悠遊付帶入的會員身分・無需另外註冊</span>
            </span>
          </div>

          <div className="ew-statrow">
            <div className="ew-stat">
              <span className="ew-stat-value">{data.boxesPurchased}</span>
              <span className="ew-stat-label">預約過</span>
            </div>
            <div className="ew-stat">
              <span className="ew-stat-value">{data.completedPickups}</span>
              <span className="ew-stat-label">完成取貨</span>
            </div>
            <div className="ew-stat">
              <span className="ew-stat-value">{data.storesVisited}</span>
              <span className="ew-stat-label">造訪店家</span>
            </div>
          </div>

          {data.platformBoxesSaved > 0 && (
            <section className="ew-panel">
              {/* One span, or flex makes each text node and the <strong> its own item and the
                  sentence wraps in the wrong places. */}
              <p className="ew-impact">
                <LeafIcon size={18} />
                <span>
                  鮮款款上已經有 <strong>{data.platformBoxesSaved.toLocaleString('zh-TW')}</strong>{' '}
                  份食物被帶走，而不是被丟掉。
                </span>
              </p>
            </section>
          )}

          <section className="ew-panel">
            <p className="ew-panel-title">設定</p>
            <button
              type="button"
              className="ew-settingrow"
              onClick={() => goTo('/easywallet/stations')}
            >
              <span>下車站</span>
              <span className="ew-settingrow-value">{station.fullName}</span>
            </button>
          </section>

          <div className="ew-section">
            <SimulationNote>
              會員身分在正式版由悠遊付帶入。此處以開發環境的測試帳號模擬，因此這些數字來自該測試帳號。
            </SimulationNote>
          </div>
        </>
      ) : null}
    </Screen>
  )
}
