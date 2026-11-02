import type { Box, Reservation } from '../api'

/**
 * Stand-in listings, used only when the dev backend has nothing listed for today.
 *
 * A pack exists for one day: `GET /api/boxes` returns today's only and `saleDate` cannot be in
 * the past, so a demo given on a day nobody seeded is a demo of three empty stations. That is
 * worse than no demo. These fill that gap.
 *
 * They are never a disguise. Every store is named （示範店）, the feed and the detail screen both
 * say the stores are 示意 data, and the moment the backend has real listings for today this
 * whole module drops out of the path — see `catalog.ts`. Reserving one of these cannot reach the
 * backend either (the ids are not real), so the reservation is kept in this tab's storage and the
 * ticket says it was a simulated step, exactly as the payment does.
 */

export interface Seed {
  id: string
  merchant: string
  store: string
  address: string
  latitude: number
  longitude: number
  category: Box['category']
  name: string
  description: string
  originalPrice: number
  discountedPrice: number
  quantity: number
  remaining: number
  pickup: [string, string]
}

/** Within ~400 m of 龍山寺 / 西門 / 台北車站, so the walking estimates land at 2–6 minutes. */
export const SEEDS: Seed[] = [
  // 龍山寺
  {
    id: 'demo-ls-bakery', merchant: 'demo-m-ls-bakery', store: '麵包坊（示範店）',
    address: '台北市萬華區西園路一段 120 號', latitude: 25.0361, longitude: 121.4985,
    category: 'BAKERY', name: '隔日仍好吃・歐包綜合袋',
    description: '當天現烤沒賣完的歐式麵包，依當日剩餘品項搭配，約 3–4 顆。',
    originalPrice: 220, discountedPrice: 75, quantity: 6, remaining: 4, pickup: ['15:00', '22:00'],
  },
  {
    id: 'demo-ls-deli', merchant: 'demo-m-ls-deli', store: '便當屋（示範店）',
    address: '台北市萬華區康定路 20 號', latitude: 25.0348, longitude: 121.5012,
    category: 'DELI', name: '今日主菜便當包',
    description: '當日現做的主菜便當，口味由店家依剩餘品項決定。',
    originalPrice: 160, discountedPrice: 75, quantity: 5, remaining: 2, pickup: ['16:30', '22:30'],
  },
  {
    id: 'demo-ls-produce', merchant: 'demo-m-ls-produce', store: '青果舖（示範店）',
    address: '台北市萬華區廣州街 28 號', latitude: 25.0366, longitude: 121.5006,
    category: 'PRODUCE', name: '當日蔬果惜食袋',
    description: '今天沒賣完、但還很新鮮的蔬果，一袋約 5–6 樣。',
    originalPrice: 180, discountedPrice: 69, quantity: 6, remaining: 5, pickup: ['14:00', '21:00'],
  },
  {
    id: 'demo-ls-dessert', merchant: 'demo-m-ls-dessert', store: '甜心烘焙（示範店）',
    address: '台北市萬華區和平西路三段 86 號', latitude: 25.0340, longitude: 121.4992,
    category: 'DESSERT', name: '午後甜點盒',
    description: '當日現做的蛋糕與塔派，依櫃上剩餘品項搭配。',
    originalPrice: 240, discountedPrice: 89, quantity: 4, remaining: 3, pickup: ['15:30', '21:30'],
  },

  // 西門
  {
    id: 'demo-xm-dessert', merchant: 'demo-m-xm-dessert', store: '甜點店（示範店）',
    address: '台北市萬華區漢中街 50 號', latitude: 25.0435, longitude: 121.5068,
    category: 'DESSERT', name: '甜點櫃清空組',
    description: '打烊前的甜點櫃，一盒裝走當天剩下的品項。',
    originalPrice: 240, discountedPrice: 90, quantity: 5, remaining: 3, pickup: ['14:00', '22:00'],
  },
  {
    id: 'demo-xm-deli', merchant: 'demo-m-xm-deli', store: '熟食舖（示範店）',
    address: '台北市萬華區成都路 27 號', latitude: 25.0427, longitude: 121.5062,
    category: 'DELI', name: '熱食櫃驚喜包',
    description: '熱食櫃當日未售出的滷味與炸物，份量約兩人份。',
    originalPrice: 150, discountedPrice: 75, quantity: 6, remaining: 4, pickup: ['16:00', '22:30'],
  },
  {
    id: 'demo-xm-cafe', merchant: 'demo-m-xm-cafe', store: '手沖咖啡（示範店）',
    address: '台北市萬華區昆明街 92 號', latitude: 25.0414, longitude: 121.5055,
    category: 'BEVERAGE', name: '咖啡・司康組',
    description: '當日手沖豆與現烤司康，咖啡為冰鎮瓶裝。',
    originalPrice: 190, discountedPrice: 79, quantity: 4, remaining: 3, pickup: ['13:00', '21:00'],
  },
  {
    id: 'demo-xm-grocery', merchant: 'demo-m-xm-grocery', store: '雜貨鋪（示範店）',
    address: '台北市萬華區西寧南路 70 號', latitude: 25.0444, longitude: 121.5064,
    category: 'GROCERY', name: '零食雜貨惜食箱',
    description: '接近賞味期但還很好的零食與乾貨，一箱約 8 樣。',
    originalPrice: 260, discountedPrice: 99, quantity: 3, remaining: 2, pickup: ['12:00', '21:30'],
  },

  // 台北車站
  {
    id: 'demo-tp-cafe', merchant: 'demo-m-tp-cafe', store: '咖啡館（示範店）',
    address: '台北市中正區館前路 8 號', latitude: 25.0455, longitude: 121.5156,
    category: 'BEVERAGE', name: '咖啡・麵包組',
    description: '每日現烤吐司與丹麥麵包，搭配一瓶當日手沖。',
    originalPrice: 190, discountedPrice: 75, quantity: 8, remaining: 6, pickup: ['14:30', '21:30'],
  },
  {
    id: 'demo-tp-bakery', merchant: 'demo-m-tp-bakery', store: '吐司坊（示範店）',
    address: '台北市中正區忠孝西路一段 47 號', latitude: 25.0468, longitude: 121.5162,
    category: 'BAKERY', name: '當日吐司與丹麥組',
    description: '當天出爐沒賣完的吐司與丹麥，依剩餘品項搭配。',
    originalPrice: 200, discountedPrice: 75, quantity: 5, remaining: 3, pickup: ['15:30', '22:00'],
  },
  {
    id: 'demo-tp-deli', merchant: 'demo-m-tp-deli', store: '便當部（示範店）',
    address: '台北市中正區許昌街 14 號', latitude: 25.0450, longitude: 121.5173,
    category: 'DELI', name: '站前便當驚喜包',
    description: '通勤時段後剩下的現做便當，主菜由店家決定。',
    originalPrice: 170, discountedPrice: 79, quantity: 5, remaining: 4, pickup: ['17:00', '22:00'],
  },
  {
    id: 'demo-tp-frozen', merchant: 'demo-m-tp-frozen', store: '冷藏櫃（示範店）',
    address: '台北市中正區公園路 30 號', latitude: 25.0462, longitude: 121.5186,
    category: 'FROZEN', name: '冷藏即食惜食組',
    description: '冷藏櫃當日未售出的即食餐盒，回家微波就能吃。',
    originalPrice: 230, discountedPrice: 85, quantity: 4, remaining: 3, pickup: ['16:00', '22:00'],
  },
]

/** Mirrors the backend's derivation: >2 left is AVAILABLE, 1–2 ALMOST_SOLD_OUT, 0 SOLD_OUT. */
function statusFor(remaining: number): Box['status'] {
  if (remaining <= 0) return 'SOLD_OUT'
  if (remaining <= 2) return 'ALMOST_SOLD_OUT'
  return 'AVAILABLE'
}

function toBox(seed: Seed, remaining: number): Box {
  return {
    id: seed.id,
    merchantId: seed.merchant,
    name: seed.name,
    description: seed.description,
    originalPrice: seed.originalPrice,
    discountedPrice: seed.discountedPrice,
    discountPercent: Math.round(
      ((seed.originalPrice - seed.discountedPrice) / seed.originalPrice) * 100,
    ),
    storeName: seed.store,
    storeAddress: seed.address,
    storeLatitude: seed.latitude,
    storeLongitude: seed.longitude,
    storeLogoUrl: null,
    merchantTimezone: 'Asia/Taipei',
    pickupTimeStart: seed.pickup[0],
    pickupTimeEnd: seed.pickup[1],
    status: statusFor(remaining),
    remainingCount: remaining,
    quantity: seed.quantity,
    saleDate: new Date().toISOString().slice(0, 10),
    category: seed.category,
    imageUrl: null,
  }
}

export function isDemoId(id: string) {
  return id.startsWith('demo-')
}

/** Today's stand-in listings, with anything reserved in this tab already taken off the count. */
export function demoBoxes(): Box[] {
  const taken = reservedCounts()
  return SEEDS.map((seed) => toBox(seed, Math.max(0, seed.remaining - (taken[seed.id] ?? 0))))
}

export function demoBox(id: string): Box | null {
  const seed = SEEDS.find((s) => s.id === id)
  if (!seed) return null
  const taken = reservedCounts()
  return toBox(seed, Math.max(0, seed.remaining - (taken[id] ?? 0)))
}

export function demoStore(merchantId: string) {
  const seed = SEEDS.find((s) => s.merchant === merchantId)
  if (!seed) return null
  return {
    merchantId: seed.merchant,
    storeName: seed.store,
    storeAddress: seed.address,
    storeLatitude: seed.latitude,
    storeLongitude: seed.longitude,
    logoUrl: null,
    bio: null,
    story: null,
    businessHours: null,
    availableBoxes: demoBoxes().filter((box) => box.merchantId === merchantId),
  }
}

// ── Reservations against a stand-in listing ────────────────────────────────
// These ids do not exist on the backend, so the order lives in this tab only. Everything the
// ticket needs is stored, and the pickup window is rebuilt in the merchant's own timezone.

const ORDERS_KEY = 'freshtogo.ew.demoOrders'

interface StoredOrder {
  id: string
  boxId: string
  orderId: string
  redemptionCode: string
  createdAt: string
}

function readOrders(): StoredOrder[] {
  try {
    const raw = sessionStorage.getItem(ORDERS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as StoredOrder[]) : []
  } catch {
    return []
  }
}

function writeOrders(orders: StoredOrder[]) {
  try {
    sessionStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  } catch {
    // Storage off in this webview: the order still works for this page view.
  }
}

function reservedCounts(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const order of readOrders()) {
    counts[order.boxId] = (counts[order.boxId] ?? 0) + 1
  }
  return counts
}

/** Six characters, same shape as the backend's redemption code. */
function redemptionCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

/** Turn "HH:mm" on the merchant's day into the UTC instant the ticket formats back. */
function pickupInstant(time: string): string | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) return null
  const today = new Date()
  // Asia/Taipei is UTC+8 all year — no DST to account for.
  const utc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    Number(match[1]) - 8,
    Number(match[2]),
  )
  return new Date(utc).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function toReservation(order: StoredOrder): Reservation | null {
  const box = demoBox(order.boxId)
  if (!box) return null
  return {
    id: order.id,
    orderId: order.orderId,
    redemptionCode: order.redemptionCode,
    price: box.discountedPrice,
    merchantTimezone: box.merchantTimezone,
    pickupWindowStartUtc: pickupInstant(box.pickupTimeStart),
    pickupWindowEndUtc: pickupInstant(box.pickupTimeEnd),
    box,
    isPickedUp: false,
    isCancelled: false,
    status: 'ACTIVE',
    cancelledBy: null,
    cancellationReason: null,
  }
}

export function createDemoReservation(boxId: string): Reservation {
  const box = demoBox(boxId)
  if (!box) throw new Error(`No stand-in listing ${boxId}`)

  const order: StoredOrder = {
    id: `demo-order-${Date.now().toString(36)}`,
    boxId,
    orderId: `#${String(Math.floor(Math.random() * 9000) + 1000)}`,
    redemptionCode: redemptionCode(),
    createdAt: new Date().toISOString(),
  }
  writeOrders([order, ...readOrders()])

  const reservation = toReservation(order)
  if (!reservation) throw new Error('Could not build the stand-in reservation')
  return reservation
}

export function demoReservation(id: string): Reservation | null {
  const order = readOrders().find((o) => o.id === id)
  return order ? toReservation(order) : null
}

export function demoReservations(): Reservation[] {
  return readOrders()
    .map(toReservation)
    .filter((r): r is Reservation => r !== null)
}

export function hasDemoReservation(boxId: string) {
  return readOrders().some((order) => order.boxId === boxId)
}
