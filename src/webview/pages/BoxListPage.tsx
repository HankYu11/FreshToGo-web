import { useParams } from 'react-router-dom'
import { isReservable, listBoxes } from '../../api'
import BoxCard from '../components/BoxCard'
import Screen from '../components/Screen'
import SimulationNote from '../components/SimulationNote'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { boxesNearStation, countsByStation } from '../nearby'
import { writeStationPreference } from '../stationPreference'
import { STATIONS, STATION_RADIUS_M, findStation } from '../stations'
import { useAsync } from '../useAsync'
import { useWebviewNavigation } from '../useWebviewNavigation'

/**
 * Step two: what can be collected around this station tonight.
 *
 * Every listing for today arrives in one request and the station filter is applied here —
 * there is no station-aware endpoint, and with a pilot this size one request is cheaper than
 * three. Sold-out and not-yet-on-sale packs stay on the list, dimmed, because an empty-looking
 * station and a station whose packs have gone are different things to a commuter.
 */
export default function BoxListPage() {
  const { stationId = '' } = useParams()
  const { goBack, goTo, replaceTo } = useWebviewNavigation()
  const station = findStation(stationId)

  const { data: boxes, error, loading, reload } = useAsync((signal) => listBoxes(signal), [])

  if (!station) {
    return (
      <Screen title="鮮款款" onBack={() => replaceTo('/easywallet')}>
        <EmptyState title="找不到這一站" body="請回到上一頁重新選擇下車站。">
          <button type="button" className="ew-button" onClick={() => replaceTo('/easywallet')}>
            重新選擇
          </button>
        </EmptyState>
      </Screen>
    )
  }

  const nearby = boxes ? boxesNearStation(boxes, station) : []
  const reservable = nearby.filter((item) => isReservable(item.box.status)).length
  const counts = boxes ? countsByStation(boxes, STATIONS) : null
  const elsewhere = counts
    ? STATIONS.filter((other) => other.id !== station.id && counts[other.id] > 0)
    : []

  /** A deliberate move to the picker — pushes, so Back returns to this list. */
  function changeStation() {
    goTo('/easywallet')
  }

  function openStation(id: string) {
    writeStationPreference(id)
    replaceTo(`/easywallet/station/${id}`)
  }

  return (
    <Screen
      title={`${station.fullName}附近`}
      onBack={() => goBack('/easywallet')}
      action={
        <button type="button" className="ew-button-quiet" onClick={changeStation}>
          換站
        </button>
      }
    >
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
          <p className="ew-sub" style={{ marginTop: 0, marginBottom: 12 }}>
            出站步行 {formatRadius(STATION_RADIUS_M)}內・今天有 <strong>{reservable}</strong> 款可預約
          </p>
          <div style={{ marginBottom: 14 }}>
            <SimulationNote label="示意">
              以下店家為開發環境的示意資料，不是已合作的店家。
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

/** 1000 m reads better as 1 公里 than as 1000 公尺. */
function formatRadius(meters: number) {
  return meters >= 1000 ? `${meters / 1000} 公里` : `${meters} 公尺`
}
