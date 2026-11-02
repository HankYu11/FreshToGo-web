import { ensureSession, getReservationStats, withSession } from '../../api'
import Screen from '../components/Screen'
import SimulationNote from '../components/SimulationNote'
import { PersonIcon } from '../components/icons'
import { ErrorState, LoadingState } from '../components/StateViews'
import { currentStation } from '../stationPreference'
import { useAsync } from '../useAsync'
import { useWebviewNavigation } from '../useWebviewNavigation'

interface ProfileData {
  displayName: string
  boxesPurchased: number
  storesVisited: number
  completedPickups: number
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
    const stats = await withSession(() => getReservationStats(signal))
    return {
      displayName: session.displayName || '悠遊付會員',
      boxesPurchased: stats.boxesPurchased,
      storesVisited: stats.storesVisited,
      completedPickups: stats.completedPickups,
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

          {/*
            GET /api/stats/impact is deliberately not shown here. It counts the DEV database —
            E2E runs and manual testing — and 「鮮款款上已經有 32 份食物被帶走」 under a member's
            own numbers reads as production traction. A real figure belongs in the pitch, from
            production, said by a person; a dev counter dressed as one is a claim nobody made.
          */}
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
              會員身分在正式版由悠遊付帶入，不需要註冊。此處每次開啟會建立一個獨立的測試會員，所以上面的數字從零開始，是這次操作累積的。
            </SimulationNote>
          </div>
        </>
      ) : null}
    </Screen>
  )
}
