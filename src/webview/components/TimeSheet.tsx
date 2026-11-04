import { useLayoutEffect, useRef } from 'react'

/**
 * Hours and minutes on one surface, both reachable in a single gesture.
 *
 * Two <select>s were two separate pickers: tap the hour, a wheel covers the screen, choose,
 * dismiss, tap the minute, do it again. Setting a departure time is one thought, so it gets one
 * sheet — and the two columns are the shape every phone already uses for a time.
 *
 * It is written out rather than left to <input type="time">, which renders in the host device's
 * locale: on an en_US phone that is 6:35 PM in the middle of a screen whose every other clock is
 * 24-hour, and no attribute overrides it. These columns print exactly what they are given.
 */

/** The height of one row, and the unit every scroll position is a multiple of. */
const ROW = 44

/** How many rows the column shows at once. Odd, so one of them is the middle. */
const VISIBLE = 5

function clamp(n: number, low: number, high: number) {
  return Math.min(high, Math.max(low, n))
}

function Wheel({
  values,
  value,
  label,
  onPick,
}: {
  values: string[]
  value: string
  label: string
  onPick: (next: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const index = clamp(values.indexOf(value), 0, values.length - 1)

  // Put the current value under the band before the first paint, and only then: the scroll
  // handler below is what moves the value afterwards, so re-scrolling on every change would
  // fight the finger that caused it.
  useLayoutEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = index * ROW
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onScroll() {
    const el = ref.current
    if (!el) return
    const next = values[clamp(Math.round(el.scrollTop / ROW), 0, values.length - 1)]
    if (next && next !== value) onPick(next)
  }

  /** Scroll to a row and let onScroll report it, so tapping and flicking end the same way. */
  function scrollTo(i: number) {
    ref.current?.scrollTo({
      top: clamp(i, 0, values.length - 1) * ROW,
      // The CSS media query cannot reach a scroll started from JS, so ask here as well.
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  return (
    <div
      ref={ref}
      className="ew-wheel"
      role="listbox"
      aria-label={label}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') scrollTo(index + 1)
        else if (event.key === 'ArrowUp') scrollTo(index - 1)
        else if (event.key === 'Home') scrollTo(0)
        else if (event.key === 'End') scrollTo(values.length - 1)
        else return
        event.preventDefault()
      }}
    >
      <div className="ew-wheel-pad" aria-hidden="true" />
      {values.map((entry, i) => (
        <button
          key={entry}
          type="button"
          role="option"
          aria-selected={entry === value}
          // Out of the tab order: the column itself is the stop, and arrow keys move within it.
          tabIndex={-1}
          className={`ew-wheel-opt${entry === value ? ' ew-wheel-opt-on' : ''}`}
          onClick={() => scrollTo(i)}
        >
          {entry}
        </button>
      ))}
      <div className="ew-wheel-pad" aria-hidden="true" />
    </div>
  )
}

export default function TimeSheet({
  value,
  hours,
  minutes,
  label,
  onChange,
  onClose,
}: {
  /** "HH:MM", and always one of `hours` × `minutes`. */
  value: string
  hours: string[]
  minutes: string[]
  label: string
  onChange: (next: string) => void
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    // Focus moves in so a keyboard and a screen reader land on the decision, and goes back to
    // the control that opened the sheet when it closes — otherwise it falls to the body and
    // the next Tab starts again from the top of the page.
    const opener = document.activeElement
    panelRef.current?.focus()
    return () => {
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [])

  return (
    <div className="ew-sheet-scrim" role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className="ew-sheet ew-sheet-time"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
      >
        <div className="ew-sheet-grip" aria-hidden="true" />
        <h2 className="ew-sheet-title">{label}</h2>

        <div className="ew-wheels" style={{ height: ROW * VISIBLE }}>
          <span className="ew-wheels-band" aria-hidden="true" />
          <Wheel
            values={hours}
            value={value.slice(0, 2)}
            label="時"
            onPick={(hour) => onChange(`${hour}:${value.slice(3, 5)}`)}
          />
          <span className="ew-wheels-colon" aria-hidden="true">
            :
          </span>
          <Wheel
            values={minutes}
            value={value.slice(3, 5)}
            label="分"
            onPick={(minute) => onChange(`${value.slice(0, 2)}:${minute}`)}
          />
        </div>

        <button type="button" className="ew-button" onClick={onClose}>
          完成
        </button>
      </div>
    </div>
  )
}
