import { useEffect, useMemo, useState } from 'react'
import Screen from '../components/Screen'
import FoodArt from '../components/FoodArt'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { CheckIcon, ClockIcon, PinIcon, ShieldIcon, WalkIcon } from '../components/icons'
import { loadBoxes } from '../catalog'
import { categoryLabel, categoryWash } from '../categories'
import { formatPickupWindow } from '../format'
import { readHuntSession, writeHuntSession } from '../huntSession'
import { formatClock, packsOnRoute, suggestBoardingTime } from '../routeHunt'
import { STATIONS, MINUTES_PER_STOP, findStation, stationsOnRoute } from '../stations'
import { useAsync } from '../useAsync'
import { useCardSwipe, type SwipeDecision } from '../useCardSwipe'
import { useWebviewNavigation } from '../useWebviewNavigation'

/** Now, rounded down to the minute — the default boarding time. */
function nowClock() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function withClock(time: string) {
  const match = /^(\d{1,2}):(\d{2})/.exec(time)
  const when = new Date()
  if (match) when.setHours(Number(match[1]), Number(match[2]), 0, 0)
  return when
}

/**
 * 吃 der — the app's one-at-a-time picker, re-cut around a commuter's journey.
 *
 * Set where you get on and where you get off, and it works through the packs at every stop on
 * the way, one card at a time: skip it, keep it for later, or reserve it. A store's customers
 * stop being the people who live near it and become everyone whose line passes through.
 *
 * Swipes work here as they do in the app — what collides with the system is an edge swipe, not
 * a swipe, so useCardSwipe simply ignores a drag that begins in the gutter. The three buttons
 * stay regardless: a gesture nobody can see is not an interface on its own, and a thumb on a
 * crowded train finds a button faster than it finds a drag.
 */
export default function HuntPage() {
  const { goBack, goTo } = useWebviewNavigation()

  // Read once, at mount. Reserving a pack leaves this screen for the detail page, and React
  // Router unmounts the deck on the way out; everything below is restored from what the last
  // run left behind, and the effect further down writes it back as it changes.
  const [resumed] = useState(readHuntSession)

  const [from, setFrom] = useState(
    () => findStation(resumed?.fromId) ?? STATIONS[STATIONS.length - 1],
  )
  const [to, setTo] = useState(() => findStation(resumed?.toId) ?? STATIONS[0])
  const [boardingAt, setBoardingAt] = useState(() => resumed?.boardingAt ?? nowClock())
  const [started, setStarted] = useState(() => resumed?.started ?? false)

  const [index, setIndex] = useState(() => resumed?.index ?? 0)
  const [keptIds, setKeptIds] = useState<string[]>(() => resumed?.keptIds ?? [])
  const [takenIds] = useState<string[]>(() => resumed?.takenIds ?? [])

  const { data: boxes, error, loading, reload } = useAsync((signal) => loadBoxes(signal), [])

  // A pack already reserved is out of the deck, which also means the position restored above
  // lands on the card after it rather than on the one just taken.
  const packs = useMemo(
    () =>
      boxes
        ? packsOnRoute(boxes, from, to, withClock(boardingAt)).filter(
            (pack) => !takenIds.includes(pack.box.id),
          )
        : [],
    [boxes, from, to, boardingAt, takenIds],
  )

  // Held by id, not as the packs themselves: the deck is rebuilt from a fresh load of today's
  // listings every time this screen comes back, and a kept card has to be one of those. Travel
  // order rather than the order they were kept in, which is the order they get collected in.
  const kept = useMemo(
    () => packs.filter((pack) => keptIds.includes(pack.box.id)),
    [packs, keptIds],
  )

  const suggestion = useMemo(
    () => (boxes && packs.length === 0 ? suggestBoardingTime(boxes, from, to) : null),
    [boxes, packs.length, from, to],
  )
  const route = stationsOnRoute(from, to)
  const current = packs[index]
  const finished = started && index >= packs.length

  function decide(decision: SwipeDecision) {
    if (!current) return
    if (decision === 'take') {
      goTo(`/easywallet/box/${current.box.id}`)
      return
    }
    if (decision === 'keep') setKeptIds((list) => [...list, current.box.id])
    setIndex((n) => n + 1)
  }

  const swipe = useCardSwipe({ onDecide: decide, enabled: Boolean(current) })

  // Crossing between the set-up form and the deck swaps the whole screen for a different one;
  // inheriting the old screen's scroll offset would open the deck with the card's top — and the
  // stamp that sits on it — already cut off under the app bar.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [started])

  useEffect(() => {
    writeHuntSession({
      fromId: from.id,
      toId: to.id,
      boardingAt,
      started,
      index,
      keptIds,
      takenIds,
    })
  }, [from, to, boardingAt, started, index, keptIds, takenIds])

  // The route is set again from scratch, but a pack already reserved stays out of the deck.
  function restart() {
    setStarted(false)
    setIndex(0)
    setKeptIds([])
  }

  // ── Set the journey ────────────────────────────────────────────────────
  if (!started) {
    return (
      <Screen title="吃 der" onBack={() => goBack('/easywallet')}>
        <h2 className="ew-h1">這趟車，沿途有什麼可以帶？</h2>
        <p className="ew-sub">
          設定上下車站，沿途每一站的鮮款包一張一張看過。只會推薦你到站時還拿得到的。
        </p>

        <section className="ew-panel">
          <p className="ew-panel-title">這趟車</p>
          <label className="ew-field">
            <span className="ew-field-label">上車站</span>
            <select
              className="ew-select"
              value={from.id}
              onChange={(e) => setFrom(STATIONS.find((s) => s.id === e.target.value) ?? from)}
            >
              {STATIONS.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="ew-field">
            <span className="ew-field-label">下車站</span>
            <select
              className="ew-select"
              value={to.id}
              onChange={(e) => setTo(STATIONS.find((s) => s.id === e.target.value) ?? to)}
            >
              {STATIONS.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="ew-field">
            <span className="ew-field-label">上車時間</span>
            <input
              className="ew-select"
              type="time"
              value={boardingAt}
              onChange={(e) => setBoardingAt(e.target.value || nowClock())}
            />
          </label>
        </section>

        <section className="ew-panel">
          <p className="ew-panel-title">沿途會經過</p>
          <p className="ew-routeline">
            {route.map((station, i) => (
              <span key={station.id} className="ew-routestop">
                {i > 0 && <span className="ew-routedash" aria-hidden="true" />}
                {station.fullName}
              </span>
            ))}
          </p>
          <p className="ew-note">
            以每站約 {MINUTES_PER_STOP} 分鐘推算到站時間，再加上出站步行時間，比對店家的取貨時段。
          </p>
        </section>

        {loading && !boxes ? (
          <LoadingState />
        ) : error && !boxes ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <p className="ew-sub">
            這趟車沿途有 <strong>{packs.length}</strong> 款來得及取貨。
            {packs.length === 0 && ' 這個時間出發，沿途的店都已經過了取貨時段。'}
          </p>
        )}

        {suggestion && (
          <button
            type="button"
            className="ew-button ew-button-secondary"
            style={{ marginTop: 12 }}
            onClick={() => setBoardingAt(suggestion.clock)}
          >
            改成 {suggestion.clock} 出發（{suggestion.count} 款）
          </button>
        )}

        {/*
          Not a disclaimer — a property of the design, and one the partner cares about. Buried
          under a 示意 badge it reads as an apology for something missing; stated plainly it is
          the answer to the first question a card company asks about a commuting feature.
        */}
        <section className="ew-panel">
          <p className="ew-privacy">
            <ShieldIcon size={18} />
            <span>
              <strong>不使用你的乘車紀錄。</strong>
              上下車站與上車時間都由你自己設定，鮮款款不會向悠遊卡索取、也不會收到你的刷卡資料。
            </span>
          </p>
        </section>

        <div style={{ marginTop: 18 }}>
          <button
            type="button"
            className="ew-button"
            disabled={packs.length === 0}
            onClick={() => setStarted(true)}
          >
            {packs.length > 0 ? `開始看這 ${packs.length} 款` : '沿途目前沒有可取貨的'}
          </button>
        </div>
      </Screen>
    )
  }

  // ── What was kept ──────────────────────────────────────────────────────
  if (finished) {
    return (
      <Screen title="吃 der" onBack={() => goBack('/easywallet')}>
        {kept.length === 0 ? (
          <EmptyState title="這趟車沒有收著任何一款" body="換個時間或換一段路線再看看。">
            <button type="button" className="ew-button" onClick={restart}>
              重新設定
            </button>
          </EmptyState>
        ) : (
          <>
            <h2 className="ew-h1">先收著的 {kept.length} 款</h2>
            <p className="ew-sub">挑一款預約，取貨碼會出現在「訂單」裡。</p>
            <div className="ew-cardlist" style={{ marginTop: 18 }}>
              {kept.map((pack) => (
                <button
                  key={pack.box.id}
                  type="button"
                  className="ew-keptrow"
                  onClick={() => goTo(`/easywallet/box/${pack.box.id}`)}
                >
                  <span
                    className="ew-keptart"
                    style={{ background: categoryWash(pack.box.category) }}
                    aria-hidden="true"
                  >
                    <FoodArt category={pack.box.category} />
                  </span>
                  <span className="ew-keptmain">
                    <span className="ew-keptstation">
                      <PinIcon size={13} />
                      {pack.station.fullName}・步行 {pack.walkMinutes} 分
                    </span>
                    <span className="ew-keptname">{pack.box.name}</span>
                    <span className="ew-keptstore">{pack.box.storeName}</span>
                  </span>
                  <span className="ew-keptprice">NT${pack.box.discountedPrice}</span>
                </button>
              ))}
            </div>
            <div className="ew-section">
              <button type="button" className="ew-button ew-button-secondary" onClick={restart}>
                重新設定路線
              </button>
            </div>
          </>
        )}
      </Screen>
    )
  }

  // ── One pack at a time ─────────────────────────────────────────────────
  return (
    <Screen
      title={`${index + 1} / ${packs.length}`}
      onBack={restart}
      footer={
        <div className="ew-decide">
          <button
            type="button"
            className="ew-decide-skip"
            disabled={swipe.busy}
            onClick={() => swipe.decideFromButton('skip')}
          >
            跳過
          </button>
          <button
            type="button"
            className="ew-decide-keep"
            disabled={swipe.busy}
            onClick={() => swipe.decideFromButton('keep')}
          >
            先收著
          </button>
          <button
            type="button"
            className="ew-decide-take"
            disabled={swipe.busy}
            onClick={() => swipe.decideFromButton('take')}
          >
            預約
          </button>
        </div>
      }
    >
      {current && (
        <article
          className={`ew-huntcard${swipe.lifted ? ' ew-huntcard-lifted' : ''}`}
          key={current.box.id}
          style={swipe.style}
          {...swipe.handlers}
        >
          <div
            className="ew-huntcard-art"
            style={{ background: categoryWash(current.box.category) }}
          >
            <FoodArt category={current.box.category} />
            {swipe.leaning && (
              <span className={`ew-huntstamp ew-huntstamp-${swipe.leaning}`} aria-hidden="true">
                {swipe.leaning === 'skip' ? '跳過' : swipe.leaning === 'keep' ? '先收著' : '預約'}
              </span>
            )}
            <span className="ew-card-kicker">{categoryLabel(current.box.category)}</span>
            <span className="ew-card-tear" aria-hidden="true" />
          </div>
          <div className="ew-huntcard-body">
            <p className="ew-huntcard-stop">
              <PinIcon size={14} />
              {current.station.fullName}・出站往{current.direction}
            </p>
            <h2 className="ew-huntcard-name">{current.box.name}</h2>
            <p className="ew-huntcard-store">{current.box.storeName}</p>

            <div className="ew-huntcard-facts">
              <p className="ew-metaitem">
                <ClockIcon size={15} />
                取貨 {formatPickupWindow(current.box.pickupTimeStart, current.box.pickupTimeEnd)}
              </p>
              <p className="ew-metaitem">
                <WalkIcon size={15} />
                步行 {current.walkMinutes} 分
              </p>
            </div>

            <p className="ew-huntcard-reach">
              <CheckIcon size={16} />
              {current.minutesToArrive === 0
                ? '上車前就能取'
                : `約 ${current.minutesToArrive} 分後到站`}
              ，{formatClock(current.reachableAt)} 可以到店，還在取貨時段內
            </p>

            <p className="ew-pricerow">
              <span className="ew-price">
                <span className="ew-price-unit">NT$</span>
                {current.box.discountedPrice}
              </span>
              {current.box.originalPrice > current.box.discountedPrice && (
                <span className="ew-price-original">NT${current.box.originalPrice}</span>
              )}
            </p>
          </div>
        </article>
      )}

      <p className="ew-note ew-huntswipehint">
        左滑跳過・右滑先收著・上滑預約，也可以用下面的按鈕
        {kept.length > 0 && ` ・ 已先收著 ${kept.length} 款`}
      </p>
    </Screen>
  )
}
