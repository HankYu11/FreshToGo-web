import { useEffect, useRef, useState } from 'react'
import type { t } from '../i18n'
import dessertHunt from '../assets/app-ui/dessert.hunt.webp'
import deliHunt from '../assets/app-ui/deli.hunt.webp'
import bakeryHunt from '../assets/app-ui/bakery.hunt.webp'
import './HuntDemo.css'

export type HuntAction = 'reserve' | 'pass' | 'stack'
type Pose = 'rest' | 'press' | 'drag' | 'out'

// One pack per gesture, in the order the demo plays them. Mirrors the app: up asks to reserve,
// left passes, right stacks the pack for the end-of-round recap.
const cards: { src: string; action: HuntAction }[] = [
  { src: dessertHunt, action: 'reserve' },
  { src: deliHunt, action: 'pass' },
  { src: bakeryHunt, action: 'stack' },
]

const poseDurations: Record<Pose, number> = { rest: 700, press: 450, drag: 850, out: 550 }
const RECAP_MS = 3000

type Step = { card: number; pose: Pose; ms: number } | { card: number; pose: 'recap'; ms: number }

const timeline: Step[] = [
  ...cards.flatMap((_, card) =>
    (['rest', 'press', 'drag', 'out'] as const).map((pose) => ({ card, pose, ms: poseDurations[pose] })),
  ),
  { card: cards.length, pose: 'recap', ms: RECAP_MS },
]

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface HuntDemoProps {
  copy: ReturnType<typeof t>['hunt']
  onActiveChange?: (action: HuntAction | null) => void
}

export default function HuntDemo({ copy, onActiveChange }: HuntDemoProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [round, setRound] = useState(0)
  const [visible, setVisible] = useState(false)
  const [reducedMotion] = useState(prefersReducedMotion)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const step = timeline[stepIndex]
  const current = step.card
  const pose = step.pose

  // Only play while the demo is on screen.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.35,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || reducedMotion) return
    const timer = setTimeout(() => {
      if (stepIndex === timeline.length - 1) {
        setRound((r) => r + 1)
        setStepIndex(0)
      } else {
        setStepIndex(stepIndex + 1)
      }
    }, step.ms)
    return () => clearTimeout(timer)
  }, [stepIndex, visible, reducedMotion, step.ms])

  const activeAction = pose !== 'rest' && pose !== 'recap' ? cards[current].action : null

  useEffect(() => {
    onActiveChange?.(activeAction)
  }, [activeAction, onActiveChange])

  const markOf = (i: number): HuntAction | null =>
    i < current || (i === current && pose === 'out') ? cards[i].action : null
  const stackedCount = cards.filter((c, i) => c.action === 'stack' && markOf(i)).length
  const showToast =
    (cards[current]?.action === 'reserve' && pose === 'out') ||
    (current > 0 && cards[current - 1].action === 'reserve' && (pose === 'rest' || pose === 'press'))
  const stackedCard = cards.find((c) => c.action === 'stack')!

  const cardState = (i: number) => {
    if (i < current) return 'out'
    if (i === current) return pose === 'recap' ? 'out' : pose
    return 'behind'
  }

  const gestureLabel: Record<HuntAction, string> = {
    reserve: copy.reserveTitle,
    pass: copy.passTitle,
    stack: copy.stackTitle,
  }

  return (
    <div className="hunt-demo" ref={rootRef} role="img" aria-label={copy.demoLabel}>
      <div className="hunt-demo-bar" aria-hidden="true">
        <div className="hunt-demo-marks">
          {cards.map((c, i) => {
            const mark = markOf(i)
            return (
              <span
                key={c.src}
                className={`hunt-demo-mark${mark ? ` hunt-demo-mark-${mark}` : ''}${i === current ? ' is-current' : ''}`}
              />
            )
          })}
        </div>
        <div className={`hunt-demo-badge${stackedCount > 0 ? ' is-visible' : ''}`}>
          📥 {copy.stackedCount.replace('{n}', String(stackedCount))}
        </div>
      </div>

      <div className="hunt-demo-stage" aria-hidden="true">
        <span className={`hunt-demo-hint hunt-demo-hint-up${activeAction === 'reserve' ? ' is-active' : ''}`}>
          ↑ {copy.reserveTitle}
        </span>
        <span className={`hunt-demo-hint hunt-demo-hint-left${activeAction === 'pass' ? ' is-active' : ''}`}>
          ← {copy.passTitle}
        </span>
        <span className={`hunt-demo-hint hunt-demo-hint-right${activeAction === 'stack' ? ' is-active' : ''}`}>
          {copy.stackTitle} →
        </span>

        {/* Keyed on the round so a new round deals a fresh deck instead of flying cards back in. */}
        <div className="hunt-demo-deck" key={round}>
          {cards.map((c, i) => {
            const state = cardState(i)
            return (
              <div
                key={c.src}
                className={`hunt-demo-card is-${state} action-${c.action}`}
                style={{ zIndex: cards.length - i, ['--depth' as string]: Math.max(0, i - current) }}
              >
                <img src={c.src} alt="" draggable={false} />
                <span className={`hunt-demo-stamp stamp-${c.action}`}>{gestureLabel[c.action]}</span>
                <span className="hunt-demo-finger" />
              </div>
            )
          })}
        </div>

        <div className={`hunt-demo-toast${showToast ? ' is-visible' : ''}`}>✓ {copy.reservedToast}</div>

        <div className={`hunt-demo-recap${pose === 'recap' ? ' is-visible' : ''}`}>
          <strong>{copy.roundOver}</strong>
          <span>{copy.roundOverDesc}</span>
          <img src={stackedCard.src} alt="" />
        </div>
      </div>
    </div>
  )
}
