import { isReservable } from '../../api'
import { loadBoxes, usingStandIns } from '../catalog'
import BoxCard from '../components/BoxCard'
import Screen from '../components/Screen'
import SimulationNote from '../components/SimulationNote'
import { ChevronRightIcon, PinIcon } from '../components/icons'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { boxesNearStation, countsByStation } from '../nearby'
import { currentStation, writeStationPreference } from '../stationPreference'
import { STATIONS, STATION_RADIUS_M } from '../stations'
import { useAsync } from '../useAsync'
import { useWebviewNavigation } from '../useWebviewNavigation'

/** 1000 m reads better as 1 公里 than as 1000 公尺. */
function formatRadius(meters: number) {
  return meters >= 1000 ? `${meters / 1000} 公里` : `${meters} 公尺`
}

/**
 * The app's home: what you can collect on the way out of your station tonight.
 *
 * The station is a filter in the header, not a gate in front of the app — someone opening this
 * from a wallet's home screen should land on something to look at, and change the station if it
 * is wrong. The picker is still a screen of its own, one tap away.
 */
export default function HomePage() {
  const { goTo } = useWebviewNavigation()
  const station = currentStation()

  const { data: boxes, error, loading, reload } = useAsync((signal) => loadBoxes(signal), [])

  const standIns = Boolean(boxes) && usingStandIns()
  const nearby = boxes ? boxesNearStation(boxes, station) : []
  const reservable = nearby.filter((item) => isReservable(item.box.status)).length
  const counts = boxes ? countsByStation(boxes, STATIONS) : null
  const elsewhere = counts
    ? STATIONS.filter((other) => other.id !== station.id && counts[other.id] > 0)
    : []

  function openStation(id: string) {
    writeStationPreference(id)
    reload()
  }

  return (
    <Screen title="鮮款款" tab>
      <button
        type="button"
        className="ew-stationbar"
        onClick={() => goTo('/easywallet/stations')}
        aria-label={`下車站：${station.fullName}，點擊更改`}
      >
        <PinIcon size={18} />
        <span className="ew-stationbar-main">
          <span className="ew-stationbar-kicker">今天的下車站</span>
          <span className="ew-stationbar-name">{station.fullName}</span>
        </span>
        <span className="ew-stationbar-change">更改</span>
        <ChevronRightIcon size={18} className="ew-chevron" />
      </button>

      {loading && !boxes ? (
        <LoadingState label="正在查看這一站附近的鮮款包…" />
      ) : error && !boxes ? (
        <ErrorState error={error} onRetry={reload} />
      ) : nearby.length === 0 ? (
        <EmptyState
          title={`${station.fullName}今天還沒有鮮款包`}
          body={`店家多在下班前上架，稍後再回來看看。${
            elsewhere.length > 0 ? '其他站今天還有：' : ''
          }`}
        >
          {elsewhere.map((other) => (
            <button
              key={other.id}
              type="button"
              className="ew-button ew-button-secondary"
              onClick={() => openStation(other.id)}
            >
              {other.fullName}・{counts?.[other.id]} 款
            </button>
          ))}
          <button type="button" className="ew-button ew-button-secondary" onClick={reload}>
            重新整理
          </button>
        </EmptyState>
      ) : (
        <>
          <p className="ew-sub" style={{ marginTop: 16, marginBottom: 12 }}>
            出站步行 {formatRadius(STATION_RADIUS_M)}內・今天有 <strong>{reservable}</strong> 款可預約
          </p>
          <div style={{ marginBottom: 14 }}>
            <SimulationNote label="示意">
              {standIns
                ? '開發環境今天沒有上架資料，以下為示意店家與鮮款包，不是已合作的店家；預約會在這支手機上完成，不會送出到後端。'
                : '以下店家為開發環境的示意資料，不是已合作的店家。'}
            </SimulationNote>
          </div>
          <div className="ew-cardlist">
            {nearby.map((item) => (
              <BoxCard
                key={item.box.id}
                nearby={item}
                onSelect={() => goTo(`/easywallet/box/${item.box.id}`)}
              />
            ))}
          </div>
        </>
      )}
    </Screen>
  )
}
