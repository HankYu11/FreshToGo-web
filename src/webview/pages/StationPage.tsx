import { listBoxes } from '../../api'
import Screen from '../components/Screen'
import SimulationNote from '../components/SimulationNote'
import { ChevronRightIcon } from '../components/icons'
import { countsByStation } from '../nearby'
import { readStationPreference, writeStationPreference } from '../stationPreference'
import { STATIONS } from '../stations'
import { useAsync } from '../useAsync'
import { useWebviewNavigation } from '../useWebviewNavigation'

/** MRT line colours, for the pips under a station name. */
const LINE_COLORS: Record<string, string> = {
  BL: '#0070bd',
  G: '#008659',
  R: '#e3002c',
}

/**
 * Step one: which station does the commuter get off at tonight?
 *
 * The counts come from today's real listings, so the entry screen already says whether there
 * is anything to collect — the question a commuter actually has before they tap anything.
 */
export default function StationPage() {
  const { goTo } = useWebviewNavigation()
  const current = readStationPreference()
  const { data: boxes, error, loading, reload } = useAsync((signal) => listBoxes(signal), [])

  const counts = boxes ? countsByStation(boxes, STATIONS) : null

  // The counts are a nicety; the station list is the screen. A failed count leaves the three
  // stations tappable and says so quietly, rather than replacing the whole screen with an error.
  const countsFailed = Boolean(error) && !counts

  function choose(stationId: string) {
    writeStationPreference(stationId)
    goTo(`/easywallet/station/${stationId}`)
  }

  function stationMeta(stationId: string) {
    if (counts) {
      return counts[stationId] > 0 ? `今天有 ${counts[stationId]} 款可預約` : '今天暫無可預約'
    }
    if (loading) {
      return (
        <span className="ew-skeleton" style={{ display: 'inline-block', width: 84, height: 13 }} />
      )
    }
    return '今天數量待確認'
  }

  return (
    <Screen title="鮮款款">
      <div className="ew-brandchip">
        <img src="/freshtogo_logo.svg" alt="" width={40} height={40} />
        <div>
          <p className="ew-brandchip-name">鮮款款</p>
          <p className="ew-brandchip-tagline">店家今天沒賣完的好料，下班順路帶一包</p>
        </div>
      </div>

      <h2 className="ew-h1">今天在哪一站下車？</h2>
      <p className="ew-sub">選一站，看看出站後步行可達的鮮款包。</p>

      <ul className="ew-stationlist">
        {STATIONS.map((station) => (
          <li key={station.id}>
            <button
              type="button"
              className={`ew-stationcard ${
                current === station.id ? 'ew-stationcard-current' : ''
              }`}
              onClick={() => choose(station.id)}
            >
              <span className="ew-stationcard-main">
                <span className="ew-stationcard-name">{station.fullName}</span>
                <span className="ew-linepips" aria-hidden="true">
                  {station.lines.map((line) => (
                    <span
                      key={line}
                      className="ew-linepip"
                      style={{ background: LINE_COLORS[line] ?? '#9aa7a6' }}
                    />
                  ))}
                </span>
                <span className="ew-stationcard-meta">{stationMeta(station.id)}</span>
              </span>
              <ChevronRightIcon className="ew-chevron" />
            </button>
          </li>
        ))}
      </ul>

      {countsFailed && (
        <div className="ew-inlineretry" role="status">
          <span>目前讀不到今天的數量</span>
          <button type="button" className="ew-button-quiet" onClick={reload}>
            重試
          </button>
        </div>
      )}

      <div className="ew-section">
        <SimulationNote>
          這是開發環境的展示版本。會員身分由宿主 App 帶入，此處以開發用帳號模擬；付款流程尚未與悠遊付串接。
        </SimulationNote>
      </div>
    </Screen>
  )
}
