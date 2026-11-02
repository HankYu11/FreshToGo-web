import { listBoxes } from '../../api'
import Screen from '../components/Screen'
import { CheckIcon, ChevronRightIcon } from '../components/icons'
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
  const { goBack } = useWebviewNavigation()
  const current = readStationPreference()
  const { data: boxes, error, loading, reload } = useAsync((signal) => listBoxes(signal), [])

  const counts = boxes ? countsByStation(boxes, STATIONS) : null

  // The counts are a nicety; the station list is the screen. A failed count leaves the three
  // stations tappable and says so quietly, rather than replacing the whole screen with an error.
  const countsFailed = Boolean(error) && !counts

  function choose(stationId: string) {
    writeStationPreference(stationId)
    // Back to wherever the picker was opened from — the home feed re-reads the station.
    goBack('/easywallet')
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
    <Screen title="選擇下車站" onBack={() => goBack('/easywallet')}>
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
              {current === station.id ? (
                <CheckIcon className="ew-stationcard-check" />
              ) : (
                <ChevronRightIcon className="ew-chevron" />
              )}
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

    </Screen>
  )
}
