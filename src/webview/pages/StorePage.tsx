import { useParams } from 'react-router-dom'
import { getStoreProfile, isReservable } from '../../api'
import BoxCard from '../components/BoxCard'
import Screen from '../components/Screen'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { ClockIcon, PinIcon } from '../components/icons'
import { isMissing } from '../errors'
import { describeWalk, toNearby } from '../nearby'
import { currentStation } from '../stationPreference'
import { useAsync } from '../useAsync'
import { useWebviewNavigation } from '../useWebviewNavigation'

/**
 * One store, and everything it has listed right now.
 *
 * Reached from a pack, so a customer can see who they are collecting from before committing —
 * and so the flow has somewhere to go that is not the checkout.
 */
export default function StorePage() {
  const { merchantId = '' } = useParams()
  const { goBack, goTo } = useWebviewNavigation()
  const station = currentStation()

  const {
    data: store,
    error,
    loading,
    reload,
  } = useAsync((signal) => getStoreProfile(merchantId, signal), [merchantId])

  const back = () => goBack('/easywallet')

  if (loading && !store) {
    return (
      <Screen title="店家" onBack={back}>
        <LoadingState />
      </Screen>
    )
  }

  if (!store) {
    if (error && !isMissing(error)) {
      return (
        <Screen title="店家" onBack={back}>
          <ErrorState error={error} onRetry={reload} />
        </Screen>
      )
    }
    return (
      <Screen title="店家" onBack={back}>
        <EmptyState title="找不到這家店" body="它可能已經下架了。">
          <button type="button" className="ew-button" onClick={back}>
            回到今日
          </button>
        </EmptyState>
      </Screen>
    )
  }

  const walk = describeWalk(station, store.storeLatitude, store.storeLongitude)
  const open = store.availableBoxes.filter((box) => isReservable(box.status))

  return (
    <Screen title={store.storeName} onBack={back}>
      <div className="ew-storehead">
        {store.logoUrl ? (
          <img className="ew-storehead-logo" src={store.logoUrl} alt="" />
        ) : (
          <span className="ew-storehead-logo ew-storehead-initial" aria-hidden="true">
            {store.storeName.slice(0, 1)}
          </span>
        )}
        <h2 className="ew-h2" style={{ marginTop: 10 }}>
          {store.storeName}
        </h2>
        {store.bio && <p className="ew-sub">{store.bio}</p>}
      </div>

      <section className="ew-panel">
        <p className="ew-metarow">
          <PinIcon />
          {store.storeAddress || '地址請洽店家'}
        </p>
        {walk && (
          <p className="ew-metarow">
            <ClockIcon />
            {station.fullName}往{walk.direction}步行約 {walk.minutes} 分
          </p>
        )}
        {store.businessHours && (
          <p className="ew-metarow">
            <ClockIcon />
            {store.businessHours}
          </p>
        )}
        <p className="ew-note">此為開發環境的示意店家與地址，非實際合作門市。</p>
      </section>

      {store.story && (
        <section className="ew-panel">
          <p className="ew-panel-title">關於這家店</p>
          <p className="ew-sub" style={{ marginTop: 8 }}>
            {store.story}
          </p>
        </section>
      )}

      <h2 className="ew-sectiontitle" style={{ marginTop: 22 }}>
        今天的鮮款包
      </h2>
      {open.length === 0 ? (
        <EmptyState title="這家店今天沒有鮮款包" body="店家多在下班前上架，稍後再回來看看。" />
      ) : (
        <div className="ew-cardlist">
          {open.map((box) => (
            <BoxCard
              key={box.id}
              nearby={toNearby(box, station)}
              onSelect={() => goTo(`/easywallet/box/${box.id}`)}
            />
          ))}
        </div>
      )}
    </Screen>
  )
}
