import { useEffect, useMemo, useState, type ReactElement } from 'react'
import Screen from '../components/Screen'
import FoodArt from '../components/FoodArt'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import {
  ArrowUpIcon,
  CheckIcon,
  CloseIcon,
  PinIcon,
  ShieldIcon,
  StarIcon,
  SwapIcon,
  WalkIcon,
} from '../components/icons'
import { loadBoxes } from '../catalog'
import { categoryLabel, categoryWash } from '../categories'
import { formatTimeOfDay, statusPill } from '../format'
import { readHuntSession, writeHuntSession } from '../huntSession'
import {
  formatClock,
  packsOnRoute,
  stopsOnRoute,
  suggestBoardingTime,
  type RouteStop,
} from '../routeHunt'
import {
  STATIONS,
  MINUTES_PER_STOP,
  findStation,
  lineColor,
  stationsOnRoute,
} from '../stations'
import { useAsync } from '../useAsync'
import { useCardSwipe, type SwipeDecision } from '../useCardSwipe'
import { useWebviewNavigation } from '../useWebviewNavigation'

/**
 * The three decisions, in the order the gestures put them: left, up, right.
 *
 * A list rather than three hand-written buttons, so the footer cannot drift out of step with
 * `SwipeDecision` — the key is the decision.
 */
const DECISIONS = [
  { key: 'skip', label: '跳過', spoken: '跳過這一款', Icon: CloseIcon },
  { key: 'take', label: '預約', spoken: '預約這一款', Icon: ArrowUpIcon },
  { key: 'keep', label: '先收著', spoken: '先收著，看完再決定', Icon: StarIcon },
] as const satisfies readonly {
  key: SwipeDecision
  label: string
  spoken: string
  Icon: (props: { size?: number }) => ReactElement
}[]

/** What a stop says under its name: who is open there, and how far out of the station. */
function stopMeta(stop: RouteStop) {
  if (stop.packs.length === 0) return '這一站今天沒有'
  const walks = stop.packs.map((pack) => pack.walkMinutes)
  const low = Math.min(...walks)
  const high = Math.max(...walks)
  const walk = low === high ? `步行 ${low} 分` : `步行 ${low}–${high} 分`
  return `${stop.storeCount} 家店・出站${walk}`
}

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
  const route = useMemo(() => stationsOnRoute(from, to), [from, to])

  // The journey read as a line rather than a pile: which stop, at what time, with what on it.
  const stops = useMemo(
    () => stopsOnRoute(packs, route, withClock(boardingAt)),
    [packs, route, boardingAt],
  )

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

  /** One tap turns a commute home into the same commute in. */
  function swapEnds() {
    setFrom(to)
    setTo(from)
  }

  // The route is set again from scratch, but a pack already reserved stays out of the deck.
  function restart() {
    setStarted(false)
    setIndex(0)
    setKeptIds([])
  }

  // ── Set the journey ────────────────────────────────────────────────────
  if (!started) {
    const rideMinutes = (route.length - 1) * MINUTES_PER_STOP
    const alightAt = new Date(withClock(boardingAt).getTime() + rideMinutes * 60_000)
    const stopsWithPacks = stops.filter((stop) => stop.packs.length > 0).length
    const storeTotal = new Set(
      packs.map((pack) => pack.box.merchantId || pack.box.storeName),
    ).size

    return (
      <Screen title="吃 der" onBack={() => goBack('/easywallet')}>
        <p className="ew-hunt-eyebrow">沿路找晚餐</p>
        <h2 className="ew-h1">從上車到下車，沿路都能取</h2>

        {/*
          The journey as a ticket reads it: two ends, the ride between them, and the one thing
          the rider sets that nothing else can know — when they get on. The arrival is derived,
          so it is printed rather than offered.
        */}
        <section className="ew-journey">
          <div className="ew-journey-end">
            <span className="ew-journey-label">上車</span>
            <span className="ew-journey-pick">
              <span className="ew-linebadge" style={{ background: lineColor(from) }}>
                {from.lines[0]}
              </span>
              <select
                className="ew-journey-select"
                aria-label="上車站"
                value={from.id}
                onChange={(e) => setFrom(findStation(e.target.value) ?? from)}
              >
                {STATIONS.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.fullName}
                  </option>
                ))}
              </select>
            </span>
            <input
              className="ew-journey-time"
              type="time"
              aria-label="上車時間"
              value={boardingAt}
              onChange={(e) => setBoardingAt(e.target.value || nowClock())}
            />
          </div>

          <div className="ew-journey-mid">
            <button
              type="button"
              className="ew-journey-swap"
              onClick={swapEnds}
              aria-label="對調上下車站"
            >
              <SwapIcon size={18} />
            </button>
            <span className="ew-journey-ride">約 {rideMinutes} 分</span>
          </div>

          <div className="ew-journey-end ew-journey-end-to">
            <span className="ew-journey-label">下車</span>
            <span className="ew-journey-pick">
              <span className="ew-linebadge" style={{ background: lineColor(to) }}>
                {to.lines[0]}
              </span>
              <select
                className="ew-journey-select"
                aria-label="下車站"
                value={to.id}
                onChange={(e) => setTo(findStation(e.target.value) ?? to)}
              >
                {STATIONS.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.fullName}
                  </option>
                ))}
              </select>
            </span>
            <span className="ew-journey-arrive">{formatClock(alightAt)} 到站</span>
          </div>
        </section>

        {loading && !boxes ? (
          <LoadingState label="正在看這條線上有什麼…" />
        ) : error && !boxes ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <>
            {/*
              The line itself. A rider does not think "twenty-five packs on this journey", they
              think "five at 西門 at 18:13" — so the stops carry the time, the count and a glance
              at what kind of food it is, and a stop with nothing still gets its place on the rail.
            */}
            <ol className="ew-route">
              {stops.map((stop, i) => (
                <li
                  key={stop.station.id}
                  className={`ew-route-stop${stop.packs.length === 0 ? ' ew-route-stop-bare' : ''}`}
                >
                  <span className="ew-route-time">{formatClock(stop.arriveAt)}</span>
                  <span className="ew-route-rail" aria-hidden="true">
                    <span
                      className="ew-route-dot"
                      style={{ borderColor: lineColor(stop.station) }}
                    />
                  </span>
                  <span className="ew-route-main">
                    <span className="ew-route-name">
                      {stop.station.fullName}
                      {i === 0 && <span className="ew-route-tag">上車</span>}
                      {i === stops.length - 1 && <span className="ew-route-tag">下車</span>}
                    </span>
                    <span className="ew-route-meta">{stopMeta(stop)}</span>
                  </span>
                  <span className="ew-route-art" aria-hidden="true">
                    {stop.categories.slice(0, 2).map((category) => (
                      <span
                        key={category}
                        className="ew-route-thumb"
                        style={{ background: categoryWash(category) }}
                      >
                        <FoodArt category={category} />
                      </span>
                    ))}
                  </span>
                  <span className="ew-route-count">
                    {stop.packs.length > 0 ? (
                      <>
                        <strong>{stop.packs.length}</strong>份
                      </>
                    ) : (
                      '—'
                    )}
                  </span>
                </li>
              ))}
            </ol>

            {packs.length === 0 && (
              <p className="ew-note">這個時間出發，沿途的店都已經過了取貨時段。</p>
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
          </>
        )}

        {/*
          Not a disclaimer — a property of the design, and one the partner cares about. Buried
          under a 模擬 badge it reads as an apology for something missing; stated plainly it is
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
            className="ew-button ew-button-tall"
            disabled={packs.length === 0}
            onClick={() => setStarted(true)}
          >
            {packs.length > 0 ? (
              <>
                開始吃 der
                <span className="ew-button-sub">
                  沿途 {stopsWithPacks} 站・{storeTotal} 家店・{packs.length} 份鮮款包
                </span>
              </>
            ) : (
              '沿途目前沒有可取貨的'
            )}
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
  const arriveAt = new Date(
    withClock(boardingAt).getTime() + (current?.minutesToArrive ?? 0) * 60_000,
  )
  const stock = current ? statusPill(current.box) : null

  return (
    <Screen
      title={`${index + 1} / ${packs.length}`}
      onBack={restart}
      centred
      footer={
        /*
          Left, up, right — the buttons sit where the gestures throw the card, so one is a
          picture of the other. A drag arms the matching circle, which is how somebody learns
          the gesture without being told about it.
        */
        <div className="ew-decide">
          {DECISIONS.map(({ key, label, spoken, Icon }) => (
            <button
              key={key}
              type="button"
              className={`ew-decide-btn ew-decide-${key}${
                swipe.leaning === key ? ' ew-decide-armed' : ''
              }`}
              aria-label={spoken}
              disabled={swipe.busy}
              onClick={() => swipe.decideFromButton(key)}
            >
              <span className="ew-decide-circle">
                <Icon size={key === 'take' ? 26 : 23} />
              </span>
              <span className="ew-decide-label">{label}</span>
            </button>
          ))}
        </div>
      }
    >
      {/*
        Where this card sits on the journey. A deck of cards says nothing about distance; the
        same packs on a rail say "this one is two stops before you get off", which is the whole
        reason the feature is on a train line rather than a map.
      */}
      <div className="ew-deckroute">
        <span className="ew-linebadge" style={{ background: lineColor(route[0]) }}>
          {route[0].lines[0]}
        </span>
        <ol className="ew-deckroute-rail">
          {stops.map((stop) => {
            const here = current?.station.id === stop.station.id
            return (
              <li
                key={stop.station.id}
                className={`ew-deckroute-node${here ? ' ew-deckroute-here' : ''}`}
              >
                <span
                  className="ew-deckroute-dot"
                  style={{ borderColor: lineColor(stop.station) }}
                  aria-hidden="true"
                />
                <span className="ew-deckroute-label">{stop.station.name}</span>
              </li>
            )
          })}
        </ol>
        {kept.length > 0 && (
          <span className="ew-deckroute-kept">
            <StarIcon size={12} />
            {kept.length}
          </span>
        )}
      </div>

      {/* The card takes the height the route strip and the footer leave it, and centres in it. */}
      <div className="ew-deckstage">
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
              {stock && (
                <span className={`ew-pill ${stock.warn ? 'ew-pill-warn' : ''}`}>{stock.label}</span>
              )}
              <span className="ew-huntcard-walk">
                <WalkIcon size={13} />
                出站往{current.direction}・{current.walkMinutes} 分
              </span>
              <span className="ew-card-tear" aria-hidden="true" />
            </div>
            <div className="ew-huntcard-body">
              <p className="ew-huntcard-stop">
                <PinIcon size={14} />
                {current.station.fullName}・{current.box.storeName}
              </p>
              <h2 className="ew-huntcard-name">{current.box.name}</h2>

              {/*
                The three times that decide it, in the order they happen. Written out because the
                rule behind this screen — only what you can still collect — is exactly this
                arithmetic, and a rider who can see it does not have to take it on trust.
              */}
              <div className="ew-huntclock">
                <span className="ew-huntclock-step">
                  <span className="ew-huntclock-label">到站</span>
                  <span className="ew-huntclock-value">{formatClock(arriveAt)}</span>
                </span>
                <span className="ew-huntclock-arrow" aria-hidden="true" />
                <span className="ew-huntclock-step">
                  <span className="ew-huntclock-label">到店</span>
                  <span className="ew-huntclock-value">{formatClock(current.reachableAt)}</span>
                </span>
                <span className="ew-huntclock-arrow" aria-hidden="true" />
                <span className="ew-huntclock-step">
                  <span className="ew-huntclock-label">取貨到</span>
                  <span className="ew-huntclock-value">
                    {formatTimeOfDay(current.box.pickupTimeEnd)}
                  </span>
                </span>
              </div>

              {/* The promise and the price on one line: the two things a decision weighs. */}
              <div className="ew-huntcard-foot">
                <p className="ew-huntcard-reach">
                  <CheckIcon size={15} />
                  {current.minutesToArrive === 0 ? '上車前就能取' : '到站時還拿得到'}
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
            </div>
          </article>
        )}
      </div>
    </Screen>
  )
}
