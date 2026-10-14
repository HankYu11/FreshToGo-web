// AI 打包師 demo: one call turns a photo of what's left on the counter into packing options
// and a packing list. Dev-only — see ./enabled.ts.
//
// The page sends only the photo and the note to the dev backend (POST /api/demo/ai-pack), which
// calls Gemini with a key kept in Secret Manager. No key ever reaches the browser.

import { BASE_URL } from '../api/config'

export interface Item { name: string; count: number; unitPrice: number }
export interface BagLine { name: string; count: number }
export interface PackOption {
  label: string
  bags: number
  price: number
  valuePerBag: number
  reason: string
  packingList: BagLine[][]
}
export interface PackResult {
  items: Item[]
  totalValue: number
  options: PackOption[]
  recommended: number
  recommendationReason: string
  title: string
  hint: string
  repaired: boolean[]
}

/** Shrinks the photo before upload: phone photos are 4–12 MB and the model needs far less. */
export async function toJpegBase64(file: Blob, maxSide = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  return dataUrl.slice(dataUrl.indexOf(',') + 1)
}

export async function analyse(imageBase64: string, note: string): Promise<PackResult> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}/api/demo/ai-pack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg', note: note.trim() || undefined }),
    })
  } catch {
    throw new Error('連不上伺服器，請確認網路後再試一次。')
  }
  if (!res.ok) {
    if (res.status === 429) throw new Error('試太多次了，請等一分鐘再試。')
    if (res.status === 413) throw new Error('照片太大了，請換一張再試。')
    if (res.status === 400) throw new Error('補充說明請在 200 字以內，或換一張照片再試。')
    if (res.status === 502) throw new Error('AI 服務暫時無法使用，請稍後再試。')
    throw new Error(`伺服器回應錯誤（${res.status}）`)
  }
  const body = await res.json().catch(() => null)
  if (!body?.data) throw new Error('AI 沒有回傳結果，請換一張照片再試一次。')
  return normalise(body.data)
}

type Raw = {
  items: Item[]
  options: Omit<PackOption, 'valuePerBag'>[]
  recommended: number
  recommendationReason: string
  title: string
  hint: string
}

function normalise(raw: Raw): PackResult {
  const items = raw.items
    .map((it) => ({ name: it.name.trim(), count: Math.max(0, Math.round(it.count)), unitPrice: Math.max(0, Math.round(it.unitPrice)) }))
    .filter((it) => it.name && it.count > 0)
  const totalValue = items.reduce((s, it) => s + it.count * it.unitPrice, 0)
  const repaired: boolean[] = []
  const options = raw.options.slice(0, 2).map((op) => {
    const bags = Math.max(1, Math.min(op.bags, items.reduce((s, it) => s + it.count, 0) || 1))
    let packingList = op.packingList
    const ok = packingList.length === bags && sameCounts(items, packingList)
    if (!ok) packingList = balancedPack(items, bags)
    repaired.push(!ok)
    return { ...op, bags, packingList, valuePerBag: bags ? Math.round(totalValue / bags) : 0 }
  })
  const recommended = raw.recommended === 1 && options.length > 1 ? 1 : 0
  return { items, totalValue, options, recommended, recommendationReason: raw.recommendationReason, title: raw.title, hint: raw.hint, repaired }
}

/** True when the bags hold exactly the recognised items — the model's arithmetic is not trusted. */
function sameCounts(items: Item[], bags: BagLine[][]): boolean {
  const want = new Map(items.map((it) => [it.name, it.count]))
  const got = new Map<string, number>()
  for (const bag of bags) for (const line of bag) got.set(line.name.trim(), (got.get(line.name.trim()) ?? 0) + line.count)
  if (want.size !== got.size) return false
  for (const [name, n] of want) if (got.get(name) !== n) return false
  return true
}

/**
 * Fallback when the model's packing list doesn't add up: deal the most valuable pieces first,
 * each to the bag with the lowest value so far, preferring a bag that doesn't have that item yet.
 */
export function balancedPack(items: Item[], bags: number): BagLine[][] {
  const pieces = items.flatMap((it) => Array.from({ length: it.count }, () => it)).sort((a, b) => b.unitPrice - a.unitPrice)
  const value = Array(bags).fill(0)
  const content: Map<string, number>[] = Array.from({ length: bags }, () => new Map())
  for (const p of pieces) {
    let best = 0
    for (let b = 1; b < bags; b++) {
      const score = (i: number) => value[i] + (content[i].has(p.name) ? p.unitPrice * 0.6 : 0)
      if (score(b) < score(best)) best = b
    }
    value[best] += p.unitPrice
    content[best].set(p.name, (content[best].get(p.name) ?? 0) + 1)
  }
  return content.map((m) => [...m].map(([name, count]) => ({ name, count })))
}
