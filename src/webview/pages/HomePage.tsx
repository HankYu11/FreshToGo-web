import { isReservable } from '../../api'
import CompactBoxCard from '../components/CompactBoxCard'
import Screen from '../components/Screen'
import StationRow from '../components/StationRow'
import { ChevronRightIcon, PinIcon, RouteIcon } from '../components/icons'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { loadBoxes } from '../catalog'
import { boxesNearStation } from '../nearby'
import { currentStation, writeStationPreference } from '../stationPreference'
import { STATIONS, STATION_RADIUS_M } from '../stations'
import { useAsync } from '../useAsync'
import { useWebviewNavigation } from '../useWebviewNavigation'

/** 700 m reads better as 700 公尺 than as 0.7 公里. */
function formatRadius(meters: number) {
  return meters >= 1000 ? `${meters / 1000} 公里` : `${meters} 公尺`
}

/**
 * The app's home, organised the way the pilot actually works: by stop.
 *
 * The line is the unit, not the neighbourhood. Every stop is a row you push sideways — the one
 * you get off at first, under a heading of its own, then the rest of the pilot, because a
 * commuter who could just as easily get off one stop earlier should be able to see what is
 * there without changing any setting first. One gesture reads the whole line.
 *
 * A flat list could not say any of that: it put 台北車站 and 龍山寺 shoulder to shoulder with
 * nothing to indicate they are twenty minutes apart.
 */
export default function HomePage() {
  const { goTo } = useWebviewNavigation()
  const station = currentStation()

  const { data: boxes, error, loading, reload } = useAsync((signal) => loadBoxes(signal), [])

  const here = boxes ? boxesNearStation(boxes, station) : []
  const reservable = here.filter((item) => isReservable(item.box.status)).length

  // Every other stop on the pilot, in line order, keeping only what can still be reserved —
  // a row of sold-out packs for a station you are not even at is noise.
  const elsewhere = boxes
    ? STATIONS.filter((other) => other.id !== station.id)
        .map((other) => ({
          station: other,
          packs: boxesNearStation(boxes, other).filter((item) => isReservable(item.box.status)),
        }))
        .filter((group) => group.packs.length > 0)
    : []

  function chooseStation(id: string) {
    writeStationPreference(id)
    // The feed is rebuilt around a different stop: keeping the old scroll offset would land the
    // commuter somewhere in the middle of a page that no longer says what it said.
    window.scrollTo(0, 0)
    reload()
  }

  const nothingAnywhere = here.length === 0 && elsewhere.length === 0

  return (
    <Screen
      title="鮮款款"
      tab
      fab={
        <button
          type="button"
          className="ew-fab"
          onClick={() => goTo('/easywallet/hunt')}
          aria-label="吃 der：設定上下車站，看沿途的鮮款包"
        >
          <RouteIcon size={22} />
          <span className="ew-fab-label">吃 der</span>
        </button>
      }
    >
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
      ) : nothingAnywhere ? (
        <EmptyState
          title="今天三站都還沒有鮮款包"
          body="店家多在下班前上架，稍後再回來看看。"
        >
          <button type="button" className="ew-button ew-button-secondary" onClick={reload}>
            重新整理
          </button>
        </EmptyState>
      ) : (
        <>
          <h2 className="ew-feedhead">
            {station.fullName}附近
            <span className="ew-feedhead-sub">
              出站步行 {formatRadius(STATION_RADIUS_M)}內・{reservable} 款可預約
            </span>
          </h2>

          {here.length === 0 ? (
            <EmptyState
              title={`${station.fullName}今天還沒有鮮款包`}
              body="下面幾站今天還有，或稍後再回來看看。"
            />
          ) : (
            <div className="ew-stationrow">
              {here.map((item) => (
                <CompactBoxCard
                  key={item.box.id}
                  nearby={item}
                  onSelect={() => goTo(`/easywallet/box/${item.box.id}`)}
                />
              ))}
            </div>
          )}

          {elsewhere.length > 0 && (
            <>
              <h2 className="ew-feedhead ew-feedhead-spaced">
                沿線其他站
                <span className="ew-feedhead-sub">提早一站下車也拿得到</span>
              </h2>
              {elsewhere.map((group) => (
                <StationRow
                  key={group.station.id}
                  station={group.station}
                  packs={group.packs}
                  onSelectStation={() => chooseStation(group.station.id)}
                  onSelectPack={(boxId) => goTo(`/easywallet/box/${boxId}`)}
                />
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  )
}
